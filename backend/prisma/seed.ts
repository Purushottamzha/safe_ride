import { PrismaClient, UserRole, UserStatus, TripType, BusStatus, AttendanceStatus } from '@prisma/client';
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

  const bus2 = await prisma.bus.create({
    data: {
      plateNumber: 'BA 1 JA 5678',
      busNumber: 'BUS-002',
      model: 'Ashok Leyland',
      capacity: 40,
      year: 2023,
      color: 'White',
      status: BusStatus.ACTIVE,
      schoolId: school.id,
    },
  });
  console.log(`Created bus: ${bus2.plateNumber}`);

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

  const route2 = await prisma.route.create({
    data: {
      name: 'Pulchowk Route',
      code: 'RT-PC-01',
      direction: 'School to Home',
      distance: 4.5,
      duration: 25,
      schoolId: school.id,
    },
  });
  console.log(`Created route: ${route2.name}`);

  const stop1 = await prisma.stop.create({
    data: { name: 'Baneshwor Stop 1', address: 'Baneshwor, Kathmandu', schoolId: school.id },
  });
  const stop2 = await prisma.stop.create({
    data: { name: 'Baneshwor Stop 2', address: 'New Baneshwor, Kathmandu', schoolId: school.id },
  });
  const stop3 = await prisma.stop.create({
    data: { name: 'Maitighar Stop', address: 'Maitighar, Kathmandu', schoolId: school.id },
  });
  const stop4 = await prisma.stop.create({
    data: { name: 'Pulchowk Stop', address: 'Pulchowk, Lalitpur', schoolId: school.id },
  });
  console.log('Created stops');

  await prisma.routeStop.create({ data: { routeId: route.id, stopId: stop1.id, sequence: 1 } });
  await prisma.routeStop.create({ data: { routeId: route.id, stopId: stop2.id, sequence: 2 } });
  await prisma.routeStop.create({ data: { routeId: route.id, stopId: stop3.id, sequence: 3 } });
  await prisma.routeStop.create({ data: { routeId: route2.id, stopId: stop4.id, sequence: 1 } });

  const assignment = await prisma.assignment.create({
    data: {
      name: 'Baneshwor Morning Assignment',
      schoolId: school.id,
      routeId: route.id,
    },
  });
  console.log(`Created assignment: ${assignment.name}`);

  const assignment2 = await prisma.assignment.create({
    data: {
      name: 'Pulchowk Morning Assignment',
      schoolId: school.id,
      routeId: route2.id,
    },
  });
  console.log(`Created assignment: ${assignment2.name}`);

  const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
  if (driver) {
    await prisma.driverAssignment.create({
      data: { assignmentId: assignment.id, driverId: driver.id, isPrimary: true },
    });
    await prisma.busAssignment.create({
      data: { assignmentId: assignment.id, busId: bus.id, isPrimary: true },
    });
    await prisma.driverAssignment.create({
      data: { assignmentId: assignment2.id, driverId: driver.id, isPrimary: true },
    });
    await prisma.busAssignment.create({
      data: { assignmentId: assignment2.id, busId: bus2.id, isPrimary: true },
    });
  }

  const allStudents = await prisma.student.findMany({ where: { schoolId: school.id } });

  for (let i = 0; i < allStudents.length; i++) {
    const s = allStudents[i];
    const targetAssignment = i < 5 ? assignment : assignment2;
    const targetStop = i < 3 ? stop1 : i < 5 ? stop2 : stop4;

    await prisma.studentAssignment.create({
      data: {
        assignmentId: targetAssignment.id,
        studentId: s.id,
        stopId: targetStop.id,
      },
    });

    if (parent) {
      const exists = await prisma.studentParent.findUnique({
        where: { studentId_parentId: { studentId: s.id, parentId: parent.id } },
      });
      if (!exists) {
        await prisma.studentParent.create({
          data: {
            studentId: s.id,
            parentId: parent.id,
            isPrimary: i === 0,
            relation: i === 0 ? 'MOTHER' : 'PARENT',
          },
        });
      }
    }
  }
  console.log('Linked all students to parent and assignments');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const morningTrip = await prisma.trip.create({
    data: {
      type: TripType.MORNING,
      scheduledAt: new Date(new Date().setHours(7, 0, 0, 0)),
      driverId: driverUser.id,
      busId: bus.id,
      routeId: route.id,
      assignmentId: assignment.id,
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

  await prisma.attendance.create({
    data: {
      studentId: student.id,
      tripId: morningTrip.id,
      schoolId: school.id,
      date: today,
      type: TripType.MORNING,
      boardTime: new Date(new Date().setHours(7, 15, 0, 0)),
      status: AttendanceStatus.PRESENT,
    },
  });
  console.log('Created today attendance record for Hari Sharma');

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
