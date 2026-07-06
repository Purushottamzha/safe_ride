import { PrismaClient, UserRole, UserStatus, TripType, BusStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const passwordHash = await argon2.hash('Admin@123456', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@saferide.com' },
    update: {},
    create: {
      email: 'admin@saferide.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });
  console.log(`Created super admin: ${superAdmin.email}`);

  const school = await prisma.school.upsert({
    where: { code: 'SRS001' },
    update: {},
    create: {
      name: 'SafeRide School',
      code: 'SRS001',
      address: 'Kathmandu, Nepal',
      phone: '+977-1-4XXXXXX',
      email: 'info@saferideschool.edu.np',
      timezone: 'Asia/Kathmandu',
    },
  });
  console.log(`Created school: ${school.name}`);

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'school@saferide.com' },
    update: {},
    create: {
      email: 'school@saferide.com',
      passwordHash,
      firstName: 'School',
      lastName: 'Admin',
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
      isEmailVerified: true,
    },
  });
  console.log(`Created school admin: ${schoolAdmin.email}`);

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@saferide.com' },
    update: {},
    create: {
      email: 'driver@saferide.com',
      passwordHash,
      firstName: 'Ram',
      lastName: 'Driver',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
      isEmailVerified: true,
    },
  });
  console.log(`Created driver user: ${driverUser.email}`);

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      licenseNumber: `LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      licenseExpiry: new Date('2027-12-31'),
      schoolId: school.id,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@saferide.com' },
    update: {},
    create: {
      email: 'parent@saferide.com',
      passwordHash,
      firstName: 'Sita',
      lastName: 'Parent',
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      schoolId: school.id,
      isEmailVerified: true,
    },
  });
  console.log(`Created parent user: ${parentUser.email}`);

  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      emergencyContact: true,
    },
  });

  const student = await prisma.student.create({
    data: {
      firstName: 'Hari',
      lastName: 'Sharma',
      dateOfBirth: new Date('2012-05-15'),
      grade: '7',
      section: 'A',
      studentId: `STU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      qrToken: crypto.randomBytes(32).toString('hex'),
      qrExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      address: 'Baneshwor, Kathmandu',
      schoolId: school.id,
    },
  });
  console.log(`Created student: ${student.firstName} ${student.lastName}`);

  const studentsData = [
    { firstName: 'Gita', lastName: 'Adhikari', grade: '7', section: 'A', address: 'New Baneshwor, Kathmandu' },
    { firstName: 'Suman', lastName: 'Thapa', grade: '7', section: 'B', address: 'Maitighar, Kathmandu' },
    { firstName: 'Rita', lastName: 'Gurung', grade: '8', section: 'A', address: 'Pulchowk, Lalitpur' },
    { firstName: 'Krishna', lastName: 'Poudel', grade: '8', section: 'B', address: 'Balkhu, Kathmandu' },
    { firstName: 'Anita', lastName: 'Shrestha', grade: '9', section: 'A', address: 'Koteshwor, Kathmandu' },
    { firstName: 'Prakash', lastName: 'Tamang', grade: '9', section: 'B', address: 'Chabahil, Kathmandu' },
    { firstName: 'Sabina', lastName: 'Karki', grade: '10', section: 'A', address: 'Buddhanagar, Kathmandu' },
    { firstName: 'Ramesh', lastName: 'Bhandari', grade: '10', section: 'B', address: 'Dillibazar, Kathmandu' },
  ];

  for (const s of studentsData) {
    await prisma.student.create({
      data: {
        ...s,
        dateOfBirth: new Date('2011-01-01'),
        studentId: `STU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        qrToken: crypto.randomBytes(32).toString('hex'),
        qrExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        schoolId: school.id,
      },
    });
  }

  const parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (parent) {
    await prisma.studentParent.upsert({
      where: { studentId_parentId: { studentId: student.id, parentId: parent.id } },
      update: {},
      create: {
        studentId: student.id,
        parentId: parent.id,
        isPrimary: true,
        relation: 'MOTHER',
      },
    });
  }

  const bus = await prisma.bus.create({
    data: {
      plateNumber: 'BA 1 JA 1234',
      busNumber: 'BUS-001',
      model: 'Toyota Coaster',
      capacity: 30,
      year: 2022,
      color: 'Yellow',
      status: BusStatus.ACTIVE,
      schoolId: school.id,
    },
  });
  console.log(`Created bus: ${bus.plateNumber}`);

  const route = await prisma.route.create({
    data: {
      name: 'Baneshwor Route',
      code: 'RT-BN-01',
      direction: 'School to Home',
      distance: 5.2,
      duration: 30,
      schoolId: school.id,
    },
  });
  console.log(`Created route: ${route.name}`);

  await prisma.trip.create({
    data: {
      type: TripType.MORNING,
      scheduledAt: new Date(new Date().setHours(7, 0, 0, 0)),
      driverId: driverUser.id,
      busId: bus.id,
      routeId: route.id,
      schoolId: school.id,
    },
  });

  await prisma.trip.create({
    data: {
      type: TripType.AFTERNOON,
      scheduledAt: new Date(new Date().setHours(15, 0, 0, 0)),
      driverId: driverUser.id,
      busId: bus.id,
      routeId: route.id,
      schoolId: school.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Default Accounts:');
  console.log('  Super Admin:  admin@saferide.com / Admin@123456');
  console.log('  School Admin: school@saferide.com / Admin@123456');
  console.log('  Driver:       driver@saferide.com / Admin@123456');
  console.log('  Parent:       parent@saferide.com / Admin@123456');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
