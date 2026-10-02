import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { Db } from '../core/db';
import { CryptoService } from '../core/crypto';
import { AuthService, AuthedRequest, Roles } from '../auth/auth';
import type { Principal } from '@suraksha/types';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { parse } from '../core/http';
import { z } from 'zod';
import { required } from '../core/env';
export interface EvidenceObjectStore {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
@Injectable()
export class ObjectStore implements EvidenceObjectStore {
  private client?: S3Client;
  private local = process.env.EVIDENCE_PROVIDER === 'local';
  private folder = resolve(process.env.LOCAL_OBJECT_DIR || '.local/evidence');
  private s3() {
    return (this.client ??= new S3Client({
      endpoint: required('S3_ENDPOINT'),
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: required('S3_ACCESS_KEY'),
        secretAccessKey: required('S3_SECRET_KEY'),
      },
    }));
  }
  async put(key: string, bytes: Buffer) {
    if (this.local) {
      if (process.env.NODE_ENV === 'production')
        throw new Error('Local object store is development only');
      await mkdir(this.folder, { recursive: true, mode: 0o700 });
      await writeFile(resolve(this.folder, key), bytes, { mode: 0o600 });
      return;
    }
    const Bucket = required('S3_BUCKET');
    try {
      await this.s3().send(new HeadBucketCommand({ Bucket }));
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404)
        throw error;
      await this.s3().send(new CreateBucketCommand({ Bucket }));
    }
    await this.s3().send(
      new PutObjectCommand({
        Bucket,
        Key: key,
        Body: bytes,
        ContentType: 'application/octet-stream',
      }),
    );
  }
  async get(key: string) {
    if (this.local) return readFile(resolve(this.folder, key));
    const result = await this.s3().send(
      new GetObjectCommand({ Bucket: required('S3_BUCKET'), Key: key }),
    );
    if (!result.Body) throw new Error('Object missing');
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async remove(key: string) {
    if (this.local) {
      await unlink(resolve(this.folder, key)).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') throw e;
      });
      return;
    }
    await this.s3().send(new DeleteObjectCommand({ Bucket: required('S3_BUCKET'), Key: key }));
  }
}
export const evidenceSelect = {
  id: true,
  filename: true,
  mediaType: true,
  kind: true,
  size: true,
  sha256: true,
  capturedAt: true,
  sealedAt: true,
  locationTag: true,
  createdAt: true,
} as const;
@Injectable()
export class EvidenceService {
  constructor(
    @Inject(Db) private db: Db,
    @Inject(CryptoService) private crypto: CryptoService,
    @Inject(ObjectStore) private objects: ObjectStore,
    @Inject(JwtService) private jwt: JwtService,
    @Inject(AuthService) private auth: AuthService,
  ) {}
  async create(
    ownerId: string,
    bytes: Buffer,
    filename: string,
    mediaType: string,
    kind: string,
    note?: string,
  ) {
    if (bytes.length > 25 * 1024 * 1024)
      throw new BadRequestException('Maximum evidence size is 25 MB');
    const objectKey = randomUUID();
    await this.objects.put(objectKey, this.crypto.encrypt(bytes));
    try {
      const item = await this.db.evidence.create({
        data: {
          ownerId,
          objectKey,
          filename: filename.replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 150),
          mediaType,
          kind,
          size: bytes.length,
          sha256: this.crypto.hash(bytes),
          noteCipher: note ? this.crypto.seal(note) : null,
        },
        select: evidenceSelect,
      });
      await this.auth.audit(ownerId, 'EVIDENCE_CREATED', item.id);
      return item;
    } catch (error) {
      await this.objects.remove(objectKey);
      throw error;
    }
  }
  async allowed(user: Principal, id: string) {
    const item = await this.db.evidence.findUnique({
      where: { id },
      include: { cases: { include: { case: true } } },
    });
    if (!item) throw new NotFoundException();
    const allowed =
      item.ownerId === user.id ||
      (user.role === 'ADMIN' && item.cases.length > 0) ||
      (user.role === 'POLICE' && item.cases.some((x) => x.case.officerId === user.id));
    if (!allowed) throw new ForbiddenException('Evidence access is restricted');
    return item;
  }
  async metadata(user: Principal, id: string) {
    await this.allowed(user, id);
    return this.db.evidence.findUnique({ where: { id }, select: evidenceSelect });
  }
  async unlock(user: Principal, pin: string) {
    const account = await this.db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (account.pinLockedUntil && account.pinLockedUntil > new Date())
      throw new ForbiddenException('PIN temporarily locked. Try again later.');
    if (!account.pinHash || !(await verify(account.pinHash, pin))) {
      await this.db.user.update({
        where: { id: user.id },
        data: {
          pinAttempts: { increment: 1 },
          pinLockedUntil: account.pinAttempts >= 4 ? new Date(Date.now() + 300000) : null,
        },
      });
      throw new ForbiddenException('Incorrect PIN');
    }
    await this.db.user.update({
      where: { id: user.id },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });
    await this.auth.audit(user.id, 'PIN_UNLOCK');
    return {
      proof: this.jwt.sign({ sub: user.id, purpose: 'evidence-unlock' }, { expiresIn: '2m' }),
    };
  }
  async download(user: Principal, id: string, proof?: string) {
    const item = await this.allowed(user, id);
    if (item.ownerId === user.id && item.sealedAt) {
      try {
        const p = this.jwt.verify(proof || '');
        if (p.sub !== user.id || p.purpose !== 'evidence-unlock') throw new Error();
      } catch {
        throw new ForbiddenException('Unlock this sealed evidence with your PIN');
      }
    }
    const bytes = this.crypto.decrypt(await this.objects.get(item.objectKey));
    if (this.crypto.hash(bytes) !== item.sha256)
      throw new BadRequestException('Evidence integrity verification failed');
    await this.db.evidenceAccess.create({
      data: { evidenceId: id, actorId: user.id, action: 'DOWNLOAD_HASH_VERIFIED' },
    });
    return { bytes, item };
  }
}
@Controller('evidence')
export class EvidenceController {
  constructor(
    @Inject(Db) private db: Db,
    @Inject(EvidenceService) private evidence: EvidenceService,
  ) {}
  @Roles('USER') @Get() list(@Req() req: AuthedRequest) {
    return this.db.evidence.findMany({
      where: { ownerId: req.user.id },
      select: evidenceSelect,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
  @Roles('USER')
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  upload(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: unknown,
  ) {
    if (!file) throw new BadRequestException('Choose a file');
    const input = parse(
      z.object({
        kind: z.enum(['Photo', 'Audio', 'Video', 'Chat log', 'Analysis']).default('Photo'),
        note: z.string().max(2000).optional(),
        filename: z
          .string()
          .max(255)
          .regex(/^[^\/\\\x00-\x1f]+$/)
          .optional(),
      }),
      body,
    );
    return this.evidence.create(
      req.user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
      input.kind,
      input.note,
    );
  }
  @Roles('USER', 'ADMIN', 'POLICE') @Get(':id') detail(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
  ) {
    return this.evidence.metadata(req.user, id);
  }
  @Roles('USER') @Post(':id/unlock') async unlock(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    await this.evidence.allowed(req.user, id);
    return this.evidence.unlock(
      req.user,
      parse(z.object({ pin: z.string().regex(/^\d{6}$/) }), body).pin,
    );
  }
  @Roles('USER', 'ADMIN', 'POLICE') @Get(':id/content') async download(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { bytes, item } = await this.evidence.download(
      req.user,
      id,
      req.headers['x-unlock-proof'] as string | undefined,
    );
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(item.filename)}`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(bytes);
  }
}
