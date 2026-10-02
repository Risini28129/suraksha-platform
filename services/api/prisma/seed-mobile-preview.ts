import '../src/core/env';
import { Db } from '../src/core/db';
import { required } from '../src/core/env';
import { hash } from 'argon2';
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Development preview only');
  const db = new Db();
  try {
    await db.user.upsert({
      where: { login: 'MOBILE-DEMO-01' },
      update: {},
      create: {
        login: 'MOBILE-DEMO-01',
        name: 'Amaya Demo',
        role: 'USER',
        verified: true,
        demo: true,
        passwordHash: await hash(required('SEED_PASSWORD')),
        pinHash: await hash('123456'),
      },
    });
    const counselor = await db.user.findUniqueOrThrow({ where: { login: 'CNS-0071' } });
    if (!counselor.demo) throw new Error('Expected demo counselor');
    for (let i = 1; i <= 3; i++) {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + i);
      startsAt.setHours(10, 15, 0, 0);
      await db.counselorSlot.upsert({
        where: { counselorId_startsAt: { counselorId: counselor.id, startsAt } },
        update: {},
        create: { counselorId: counselor.id, startsAt },
      });
    }
    console.log(
      'Mobile preview account ready: MOBILE-DEMO-01; existing SEED_PASSWORD; demo PIN 123456.',
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
