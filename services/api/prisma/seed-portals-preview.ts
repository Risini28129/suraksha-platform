import '../src/core/env';
import { Db } from '../src/core/db';
import { CryptoService } from '../src/core/crypto';
import { hash } from 'argon2';
import { required } from '../src/core/env';
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Preview data is development only');
  const db = new Db();
  const crypto = new CryptoService();
  try {
    const officer = await db.user.findUniqueOrThrow({ where: { login: 'WP-CDU-0044' } });
    const counselor = await db.user.findUniqueOrThrow({ where: { login: 'CNS-0071' } });
    const legal = await db.user.findUniqueOrThrow({ where: { login: 'LGL-0012' } });
    if (![officer, counselor, legal].every((u) => u.demo)) throw new Error('Expected demo staff');
    const passwordHash = await hash(required('SEED_PASSWORD'));
    for (let i = 0; i < 4; i++) {
      const client = await db.user.upsert({
        where: { login: `PORTAL-DEMO-CLIENT-${i}` },
        update: {},
        create: {
          login: `PORTAL-DEMO-CLIENT-${i}`,
          name: `Preview client ${i + 1}`,
          role: 'USER',
          demo: true,
          verified: true,
          passwordHash,
        },
      });
      const startsAt = new Date();
      startsAt.setUTCHours(7 + i, 0, 0, 0);
      const slot = await db.counselorSlot.upsert({
        where: { counselorId_startsAt: { counselorId: counselor.id, startsAt } },
        update: {},
        create: { counselorId: counselor.id, startsAt },
      });
      const appointment = await db.counselingAppointment.upsert({
        where: { slotId: slot.id },
        update: {},
        create: {
          clientId: client.id,
          counselorId: counselor.id,
          slotId: slot.id,
          clientAlias: `Client #${4482 - i * 19}`,
          modality: i % 2 ? 'CHAT' : 'VIDEO',
          concern: [
            'Initial consultation',
            'Follow-up check-in',
            'Stress support',
            'Workplace wellbeing',
          ][i],
          status: i === 3 ? 'COMPLETED' : 'BOOKED',
        },
      });
      if (!(await db.counselingMessage.count({ where: { appointmentId: appointment.id } })))
        await db.counselingMessage.create({
          data: {
            appointmentId: appointment.id,
            senderRole: 'USER',
            bodyCipher: crypto.seal(
              'DEMONSTRATION ONLY: I would like to discuss support options at our next session.',
            ),
          },
        });
      if (i === 3 && !(await db.counselingNote.count({ where: { appointmentId: appointment.id } })))
        await db.counselingNote.create({
          data: {
            appointmentId: appointment.id,
            summaryCipher: crypto.seal(
              'DEMONSTRATION ONLY: Reviewed fictional support options and a follow-up plan.',
            ),
            cadence: 'Weekly',
            cadenceNoteCipher: crypto.seal('Fictional weekly check-in.'),
            risk: 'Low',
          },
        });
      await db.legalQuery.upsert({
        where: { id: `portal-preview-query-${i}` },
        update: {},
        create: {
          id: `portal-preview-query-${i}`,
          ownerId: client.id,
          advisorId: i ? legal.id : null,
          title:
            '[DEMO] ' +
            [
              'Cyber blackmail question',
              'Workplace rights',
              'Custody and safety planning',
              'Protection process',
            ][i],
          status: i === 3 ? 'ANSWERED' : i === 1 ? 'IN_PROGRESS' : 'NEW',
          escalated: true,
          messages: {
            create: {
              senderRole: 'USER',
              bodyCipher: crypto.seal(
                'DEMONSTRATION ONLY: A fictional request for information about available support.',
              ),
            },
          },
        },
      });
      if (i < 3)
        await db.sOSAlert.upsert({
          where: { ownerId_requestKey: { ownerId: client.id, requestKey: 'portal-preview-alert' } },
          update: {},
          create: {
            ownerId: client.id,
            requestKey: 'portal-preview-alert',
            jurisdiction: 'Colombo',
            locationState: 'AVAILABLE',
            status: 'ACTIVE',
            locations: {
              create: {
                ownerId: client.id,
                latitude: 6.88 + i * 0.02,
                longitude: 79.89 + i * 0.015,
                accuracy: 20,
                capturedAt: new Date(),
              },
            },
            events: { create: { type: 'ACTIVATED', actorId: client.id } },
          },
        });
    }
    console.log(
      'Added fictional portal clients, today sessions, private messages, notes, legal queries and SOS alerts. Existing decisions preserved.',
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
