import { prisma } from '@dms/database';

// Adjust these to the accounts you want to keep
const KEEP_EMAILS = ['admin@temple.org', 'accountant@temple.org', 'donor@example.com'];
const KEEP_USERNAMES = ['admin', 'accountant', 'donor'];

async function main() {
  const usersToDelete = await prisma.user.findMany({
    where: {
      NOT: {
        OR: [
          { email: { in: KEEP_EMAILS } },
          { username: { in: KEEP_USERNAMES } },
        ],
      },
    },
    select: { id: true },
  });

  if (usersToDelete.length === 0) {
    console.log('No users to delete.');
    return;
  }

  const userIds = usersToDelete.map((u) => u.id);

  // Find donors linked to those users
  const donorsToDelete = await prisma.donor.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const donorIds = donorsToDelete.map((d) => d.id);

  await prisma.$transaction(async (tx) => {
    // Clean dependent data
    await tx.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await tx.auditLog.deleteMany({ where: { userId: { in: userIds } } });

    if (donorIds.length > 0) {
      await tx.receipt.deleteMany({ where: { donorId: { in: donorIds } } });
      await tx.donation.updateMany({
        where: { donorId: { in: donorIds } },
        data: { donorId: null },
      });
      await tx.donor.deleteMany({ where: { id: { in: donorIds } } });
    }

    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });

  console.log(`Deleted ${userIds.length} users and ${donorIds.length} donors.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
