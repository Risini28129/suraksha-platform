import '../src/core/env';
import { Db } from '../src/core/db';
import { CryptoService } from '../src/core/crypto';
import { required } from '../src/core/env';
import { hash } from 'argon2';

/** Adds deterministic, fictional admin examples without resetting existing records. */
async function seedAdminPreview() {
  if (process.env.NODE_ENV === 'production') throw new Error('Preview data is development only');
  const db = new Db();
  const crypto = new CryptoService();
  try {
    const admin = await db.user.findUniqueOrThrow({ where: { login: 'SL-ADM-0192' } });
    const owner = await db.user.findFirstOrThrow({ where: { role: 'USER', demo: true } });
    const officer = await db.user.findUniqueOrThrow({ where: { login: 'WP-CDU-0044' } });
    if (!admin.demo || !officer.demo) throw new Error('Expected local demo accounts');
    const passwordHash = await hash(required('SEED_PASSWORD'));
    const staff = [
      {
        login: 'DEMO-POL-0101',
        name: 'Amaya Perera · Demo',
        role: 'POLICE',
        verified: true,
        status: 'ACTIVE',
      },
      {
        login: 'DEMO-POL-0102',
        name: 'Dilan Fernando · Demo',
        role: 'POLICE',
        verified: false,
        status: 'ACTIVE',
      },
      {
        login: 'DEMO-CNS-0101',
        name: 'Nethmi Jayasinghe · Demo',
        role: 'COUNSELOR',
        verified: true,
        status: 'ACTIVE',
      },
      {
        login: 'DEMO-CNS-0102',
        name: 'Kavindi Silva · Demo',
        role: 'COUNSELOR',
        verified: false,
        status: 'ACTIVE',
      },
      {
        login: 'DEMO-LGL-0101',
        name: 'Anuki De Silva · Demo',
        role: 'LEGAL_ADVISOR',
        verified: true,
        status: 'ACTIVE',
      },
      {
        login: 'DEMO-POL-0103',
        name: 'Ravin Dias · Demo',
        role: 'POLICE',
        verified: true,
        status: 'SUSPENDED',
      },
    ] as const;
    for (const account of staff)
      await db.user.upsert({
        where: { login: account.login },
        update: {},
        create: {
          ...account,
          passwordHash,
          demo: true,
          staff: { create: { credentialId: account.login, jurisdiction: 'Colombo' } },
        },
      });
    const categories = [
      'CYBER_HARASSMENT',
      'WORKPLACE_HARASSMENT',
      'PUBLIC_TRANSPORT_ABUSE',
      'DOMESTIC_VIOLENCE',
    ] as const;
    const narratives = [
      'A fictional community member received repeated unwanted messages from an unfamiliar online account. Screenshots have been requested and a follow-up with a verified officer is pending.',
      'A fictional workplace report describes repeated inappropriate comments. The reporter has requested a private review and information about available support.',
      'A fictional passenger reported verbal harassment during an evening bus journey. The incident details are ready for initial review and assignment.',
      'A fictional community member requested a confidential wellbeing check and guidance on support options. A trained officer should review the case notes.',
    ];
    for (let i = 0; i < 16; i++) {
      const reference = `DEMO-${3101 + i}`;
      const createdAt = new Date(Date.now() - (i % 7) * 86400000 - i * 110000);
      const stage = i % 5 === 4 ? 'RESOLVED' : i % 3 === 1 ? 'UNDER_INVESTIGATION' : 'FILED';
      const seededCase = await db.case.upsert({
        where: { reference },
        update: {},
        create: {
          reference,
          ownerId: owner.id,
          officerId: i % 3 === 0 ? null : officer.id,
          category: categories[i % 4]!,
          stage,
          priority: i % 3 === 0 ? 'HIGH' : i % 3 === 1 ? 'MEDIUM' : 'LOW',
          triage: stage === 'FILED' ? 'NEW' : 'IN_REVIEW',
          escalated: i === 2 || i === 7,
          anonymous: true,
          demo: true,
          requestKey: `admin-preview-${i}`,
          createdAt,
          report: {
            create: {
              occurredAt: createdAt,
              narrativeCipher: crypto.seal(
                `DEMO ONLY — No real person or incident. ${narratives[i % 4]}`,
              ),
            },
          },
          events: {
            create: [
              {
                type: 'FILED',
                publicText: 'Fictional report received for review',
                actorId: owner.id,
                createdAt,
              },
              ...(stage === 'RESOLVED'
                ? [
                    {
                      type: 'RESOLVE',
                      publicText: 'Demo case resolved after review',
                      actorId: admin.id,
                      createdAt: new Date(),
                    },
                  ]
                : []),
            ],
          },
        },
      });
      const auditId = `admin-preview-report-${i}`;
      await db.auditLog.upsert({
        where: { id: auditId },
        update: {},
        create: {
          id: auditId,
          actorId: owner.id,
          action: 'REPORT_FILED',
          resourceId: seededCase.id,
          createdAt,
        },
      });
    }
    for (let i = 0; i < 9; i++) {
      const createdAt = new Date(Date.now() - (i % 7) * 86400000 - i * 60000);
      await db.sOSAlert.upsert({
        where: { ownerId_requestKey: { ownerId: owner.id, requestKey: 'admin-preview-sos-' + i } },
        update: {},
        create: {
          ownerId: owner.id,
          requestKey: 'admin-preview-sos-' + i,
          status: 'SAFE',
          locationState: 'UNAVAILABLE',
          createdAt,
          events: { create: { type: 'SAFE', actorId: owner.id, createdAt } },
        },
      });
    }
    const posts = [
      [
        'A small step forward today: I reached out for support and felt heard. Thank you to this community.',
        'Review a supportive community post before publication.',
      ],
      [
        'Does anyone know where to find verified workplace wellbeing resources?',
        'Check that resource suggestions are appropriate.',
      ],
      [
        'This fictional post includes a promotional link to an unverified support service.',
        'User reported possible promotional content.',
      ],
      [
        'Reminder: please avoid sharing personal contact details in a public community discussion.',
        'Review guidance about personal information.',
      ],
      [
        'Taking a short break and talking to someone I trust helped me today.',
        'Pending community review before publication.',
      ],
    ];
    for (const [i, item] of posts.entries()) {
      const id = `admin-preview-post-${i}`;
      await db.communityPost.upsert({
        where: { id },
        update: {},
        create: {
          id,
          authorId: owner.id,
          body: `[DEMO] ${item[0]}`,
          moderation: {
            create: {
              id: `admin-preview-review-${i}`,
              source: i === 2 ? 'USER_REPORTED' : 'DEVELOPMENT_REVIEW',
              reason: item[1]!,
            },
          },
        },
      });
    }
    for (let i = 0; i < 2; i++)
      await db.communityComment.upsert({
        where: { id: `admin-preview-comment-${i}` },
        update: {},
        create: {
          id: `admin-preview-comment-${i}`,
          postId: 'admin-preview-post-0',
          authorId: owner.id,
          body: '[DEMO] Thank you for sharing. Please use verified support resources and keep personal details private.',
          moderation: {
            create: {
              id: `admin-preview-comment-review-${i}`,
              source: i ? 'USER_REPORTED' : 'DEVELOPMENT_REVIEW',
              reason: 'Review the response for supportive language and privacy.',
            },
          },
        },
      });
    for (const [id, name] of [
      ['development-rules-v1', 'Harassment analysis development adapter'],
      ['demo-language-review-v1', 'Multilingual review · demo registry'],
    ]) {
      await db.modelVersion.upsert({
        where: { id },
        update: {},
        create: {
          id: id!,
          name: name!,
          provider: 'development',
          demo: true,
          driftStatus: 'NOT_EVALUATED',
        },
      });
      await db.modelAuditEvent.upsert({
        where: { id: `admin-preview-model-${id}` },
        update: {},
        create: {
          id: `admin-preview-model-${id}`,
          modelId: id!,
          actorId: admin.id,
          type: 'DRIFT_REVIEW',
          detail:
            '[DEMO] Evaluation requested. No validated accuracy or language coverage has been established.',
        },
      });
    }
    console.log(
      'Admin preview ready: 6 additional staff, 16 reports, 7 moderation items and model audit examples. Existing records preserved.',
    );
  } finally {
    await db.$disconnect();
  }
}
void seedAdminPreview();
