import { FileInterceptor } from '@nestjs/platform-express';
import { recognizeScreenshot } from './ocr';
import {
  Body,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Db } from '../core/db';
import { AuthedRequest, Roles } from '../auth/auth';
import { EvidenceService } from '../evidence/evidence';
import { parse } from '../core/http';
import { z } from 'zod';
import { required } from '../core/env';
@Controller('analysis')
@Roles('USER')
export class AnalysisController {
  constructor(
    @Inject(Db) private db: Db,
    @Inject(EvidenceService) private evidence: EvidenceService,
  ) {}
  @Post('ocr')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async screenshot(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose a screenshot');
    return recognizeScreenshot(file.buffer);
  }
  @Post() async analyze(@Req() r: AuthedRequest, @Body() body: unknown) {
    const input = parse(
      z.object({
        text: z.string().trim().min(1).max(10000),
        language: z.enum(['auto', 'en', 'si', 'ta']).default('auto'),
      }),
      body,
    );
    let result;
    try {
      const response = await fetch(required('AI_URL') + '/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + required('AI_SERVICE_TOKEN'),
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      result = z
        .object({
          classification: z.string(),
          riskLevel: z.string(),
          confidence: z.number().min(0).max(1).nullable(),
          language: z.string(),
          modelVersion: z.string(),
          validationStatus: z.string(),
          explanation: z.string(),
        })
        .parse(await response.json());
    } catch {
      throw new ServiceUnavailableException(
        'Analysis is unavailable. Your report and evidence tools remain available.',
      );
    }
    const evidence = await this.evidence.create(
      r.user.id,
      Buffer.from(input.text),
      'Analyzed-message.txt',
      'text/plain',
      'Analysis',
    );
    return this.db.aIAnalysis.create({
      data: { ...result, ownerId: r.user.id, evidenceId: evidence.id },
    });
  }
  @Get(':id') get(@Req() r: AuthedRequest, @Param('id') id: string) {
    return this.db.aIAnalysis.findFirstOrThrow({
      where: { id, ownerId: r.user.id },
      select: {
        id: true,
        classification: true,
        riskLevel: true,
        confidence: true,
        language: true,
        modelVersion: true,
        validationStatus: true,
        explanation: true,
        evidenceId: true,
        createdAt: true,
      },
    });
  }
}
