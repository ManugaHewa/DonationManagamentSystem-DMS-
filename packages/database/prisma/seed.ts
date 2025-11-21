import { PrismaClient, UserRole, DonationType, DonationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@temple.org' },
    update: {},
    create: {
      email: 'admin@temple.org',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Admin user created');

  // Create accountant user
  const accountantPassword = await bcrypt.hash('accountant123', 10);
  await prisma.user.upsert({
    where: { email: 'accountant@temple.org' },
    update: {},
    create: {
      email: 'accountant@temple.org',
      password: accountantPassword,
      role: UserRole.ACCOUNTANT,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Accountant user created');

  // Create donation causes
  const causes = [
    { name: 'Dana', description: 'General temple donations', isTaxDeductible: true },
    { name: 'Building Fund', description: 'Temple building and maintenance', isTaxDeductible: true },
    { name: 'Aloka Puja', description: 'Light offerings and ceremonies', isTaxDeductible: true },
    { name: 'Kathina', description: 'Annual robe offering ceremony', isTaxDeductible: true },
    { name: 'Education Fund', description: 'Buddhist education programs', isTaxDeductible: true },
  ];

  for (const cause of causes) {
    await prisma.donationCause.upsert({
      where: { name: cause.name },
      update: {},
      create: cause,
    });
  }
  console.log('✅ Donation causes created');

  // Create sample donor
  const donorPassword = await bcrypt.hash('donor123', 10);
  const donorUser = await prisma.user.create({
    data: {
      email: 'donor@example.com',
      password: donorPassword,
      role: UserRole.DONOR,
      emailVerified: true,
      donor: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'donor@example.com',
          mobile: '+1-416-555-0100',
          address: '123 Main St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5H 2N2',
          country: 'Canada',
        },
      },
    },
  });
  console.log('✅ Sample donor created');

  // Create sample donation
  const danaCause = await prisma.donationCause.findUnique({ where: { name: 'Dana' } });
  if (danaCause && donorUser.donor) {
    await prisma.donation.create({
      data: {
        donorId: donorUser.donor.id,
        causeId: danaCause.id,
        type: DonationType.CASH,
        status: DonationStatus.PENDING_VALIDATION,
        amount: 100.00,
        currency: 'CAD',
        netAmount: 100.00,
        isTaxDeductible: true,
      },
    });
    console.log('✅ Sample donation created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
