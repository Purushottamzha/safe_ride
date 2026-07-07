import { PrismaClient, UserRole, UserStatus, TripType, BusStatus, AttendanceStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const KATHMANDU_ROUTES = [
  {
    name: 'Baneshwor Route',
    code: 'RT-BN-01',
    direction: 'School to Home',
    distance: 5.2,
    duration: 30,
    stops: [
      { name: 'Baneshwor Chowk', address: 'Baneshwor, Kathmandu', latitude: 27.6985, longitude: 85.3412 },
      { name: 'New Baneshwor', address: 'New Baneshwor, Kathmandu', latitude: 27.6945, longitude: 85.3378 },
      { name: 'Maitighar', address: 'Maitighar, Kathmandu', latitude: 27.6892, longitude: 85.3274 },
    ],
  },
  {
    name: 'Pulchowk Route',
    code: 'RT-PC-01',
    direction: 'School to Home',
    distance: 4.5,
    duration: 25,
    stops: [
      { name: 'Pulchowk Chowk', address: 'Pulchowk, Lalitpur', latitude: 27.6782, longitude: 85.3185 },
      { name: 'Lagankhel', address: 'Lagankhel, Lalitpur', latitude: 27.6725, longitude: 85.3234 },
      { name: 'Jawlakhel', address: 'Jawlakhel, Lalitpur', latitude: 27.6685, longitude: 85.3170 },
    ],
  },
  {
    name: 'Chabahil Route',
    code: 'RT-CB-01',
    direction: 'School to Home',
    distance: 6.0,
    duration: 35,
    stops: [
      { name: 'Chabahil Chowk', address: 'Chabahil, Kathmandu', latitude: 27.7165, longitude: 85.3550 },
      { name: 'Gaushala', address: 'Gaushala, Kathmandu', latitude: 27.7120, longitude: 85.3480 },
      { name: 'Min Bhawan', address: 'Min Bhawan, Kathmandu', latitude: 27.7060, longitude: 85.3400 },
    ],
  },
  {
    name: 'Kalimati Route',
    code: 'RT-KL-01',
    direction: 'School to Home',
    distance: 5.8,
    duration: 32,
    stops: [
      { name: 'Kalimati Chowk', address: 'Kalimati, Kathmandu', latitude: 27.6960, longitude: 85.2990 },
      { name: 'Kuleshwor', address: 'Kuleshwor, Kathmandu', latitude: 27.6900, longitude: 85.3050 },
      { name: 'Balkhu', address: 'Balkhu, Kathmandu', latitude: 27.6840, longitude: 85.2930 },
    ],
  },
  {
    name: 'Koteshwor Route',
    code: 'RT-KT-01',
    direction: 'School to Home',
    distance: 4.8,
    duration: 28,
    stops: [
      { name: 'Koteshwor Chowk', address: 'Koteshwor, Kathmandu', latitude: 27.6720, longitude: 85.3450 },
      { name: 'Tinkune', address: 'Tinkune, Kathmandu', latitude: 27.6810, longitude: 85.3380 },
      { name: 'Airport Gate', address: 'Sinamangal, Kathmandu', latitude: 27.6880, longitude: 85.3520 },
    ],
  },
];

const DRIVERS_DATA = [
  { firstName: 'Ram', lastName: 'Sharma', email: 'ram.driver@saferide.com', licenseExpiry: '2027-12-31' },
  { firstName: 'Hari', lastName: 'Thapa', email: 'hari.driver@saferide.com', licenseExpiry: '2027-06-15' },
  { firstName: 'Sita', lastName: 'Gurung', email: 'sita.driver@saferide.com', licenseExpiry: '2028-03-20' },
  { firstName: 'Krishna', lastName: 'Poudel', email: 'krishna.driver@saferide.com', licenseExpiry: '2027-09-10' },
  { firstName: 'Mohan', lastName: 'Bhandari', email: 'mohan.driver@saferide.com', licenseExpiry: '2026-11-25' },
];

const BUSES_DATA = [
  { plateNumber: 'BA 1 JA 1234', busNumber: 'BUS-001', model: 'Toyota Coaster', capacity: 30, year: 2022, color: 'Yellow' },
  { plateNumber: 'BA 1 JA 5678', busNumber: 'BUS-002', model: 'Ashok Leyland', capacity: 40, year: 2023, color: 'White' },
  { plateNumber: 'BA 1 JA 9012', busNumber: 'BUS-003', model: 'Tata Starbus', capacity: 35, year: 2021, color: 'Blue' },
  { plateNumber: 'BA 1 JA 3456', busNumber: 'BUS-004', model: 'Mahindra Turbo', capacity: 25, year: 2024, color: 'Green' },
  { plateNumber: 'BA 1 JA 7890', busNumber: 'BUS-005', model: 'Eicher Skyline', capacity: 50, year: 2023, color: 'Red' },
];

const STUDENTS_DATA = [
  { firstName: 'Aarav', lastName: 'Sharma', grade: '7', section: 'A', address: 'Baneshwor, Kathmandu', routeIdx: 0, stopIdx: 0 },
  { firstName: 'Gita', lastName: 'Adhikari', grade: '7', section: 'A', address: 'New Baneshwor, Kathmandu', routeIdx: 0, stopIdx: 1 },
  { firstName: 'Suman', lastName: 'Thapa', grade: '7', section: 'B', address: 'Maitighar, Kathmandu', routeIdx: 0, stopIdx: 2 },
  { firstName: 'Rita', lastName: 'Gurung', grade: '8', section: 'A', address: 'Pulchowk, Lalitpur', routeIdx: 1, stopIdx: 0 },
  { firstName: 'Krishna', lastName: 'Poudel', grade: '8', section: 'B', address: 'Lagankhel, Lalitpur', routeIdx: 1, stopIdx: 1 },
  { firstName: 'Anita', lastName: 'Shrestha', grade: '9', section: 'A', address: 'Chabahil, Kathmandu', routeIdx: 2, stopIdx: 0 },
  { firstName: 'Prakash', lastName: 'Tamang', grade: '9', section: 'B', address: 'Gaushala, Kathmandu', routeIdx: 2, stopIdx: 1 },
  { firstName: 'Sabina', lastName: 'Karki', grade: '10', section: 'A', address: 'Kalimati, Kathmandu', routeIdx: 3, stopIdx: 0 },
  { firstName: 'Ramesh', lastName: 'Bhandari', grade: '10', section: 'B', address: 'Kuleshwor, Kathmandu', routeIdx: 3, stopIdx: 1 },
  { firstName: 'Nita', lastName: 'Maharjan', grade: '8', section: 'A', address: 'Koteshwor, Kathmandu', routeIdx: 4, stopIdx: 0 },
  { firstName: 'Deepak', lastName: 'Singh', grade: '8', section: 'B', address: 'Tinkune, Kathmandu', routeIdx: 4, stopIdx: 1 },
  { firstName: 'Maya', lastName: 'Lama', grade: '7', section: 'A', address: 'Sinamangal, Kathmandu', routeIdx: 4, stopIdx: 2 },
  { firstName: 'Rajesh', lastName: 'Shahi', grade: '9', section: 'A', address: 'Kalimati, Kathmandu', routeIdx: 3, stopIdx: 2 },
  { firstName: 'Sunita', lastName: 'Rai', grade: '10', section: 'A', address: 'Pulchowk, Lalitpur', routeIdx: 1, stopIdx: 2 },
  { firstName: 'Binod', lastName: 'Chaudhary', grade: '7', section: 'B', address: 'Baneshwor, Kathmandu', routeIdx: 0, stopIdx: 0 },
];

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

  const driverUsers = [];
  for (const d of DRIVERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash,
        firstName: d.firstName,
        lastName: d.lastName,
        role: UserRole.DRIVER,
        status: UserStatus.ACTIVE,
        schoolId: school.id,
        isEmailVerified: true,
      },
    });
    driverUsers.push(user);

    await prisma.driver.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        licenseNumber: `LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        licenseExpiry: new Date(d.licenseExpiry),
        isAvailable: true,
        schoolId: school.id,
      },
    });
    console.log(`Created driver: ${d.firstName} ${d.lastName}`);
  }

  const buses = [];
  for (const b of BUSES_DATA) {
    const bus = await prisma.bus.upsert({
      where: { plateNumber: b.plateNumber },
      update: {},
      create: {
        ...b,
        status: BusStatus.ACTIVE,
        lastGpsLat: 27.68 + Math.random() * 0.04,
        lastGpsLng: 85.31 + Math.random() * 0.04,
        lastGpsUpdate: new Date(),
        schoolId: school.id,
      },
    });
    buses.push(bus);
    console.log(`Created bus: ${bus.plateNumber}`);
  }

  const routes: any[] = [];
  const allStops: { id: string; routeId: string }[] = [];

  for (let ri = 0; ri < KATHMANDU_ROUTES.length; ri++) {
    const r = KATHMANDU_ROUTES[ri];
    const route = await prisma.route.upsert({
      where: { code: r.code },
      update: {},
      create: {
        name: r.name,
        code: r.code,
        direction: r.direction,
        distance: r.distance,
        duration: r.duration,
        schoolId: school.id,
      },
    });
    routes.push(route);

    for (let si = 0; si < r.stops.length; si++) {
      const s = r.stops[si];
      const stop = await prisma.stop.create({
        data: {
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          schoolId: school.id,
        },
      });
      await prisma.routeStop.create({
        data: {
          routeId: route.id,
          stopId: stop.id,
          sequence: si + 1,
          distance: si > 0 ? 1.5 : 0,
          duration: si > 0 ? 8 : 0,
        },
      });
      allStops.push({ id: stop.id, routeId: route.id });
    }
  }
  console.log(`Created ${routes.length} routes with stops`);

  const students: any[] = [];
  for (const sd of STUDENTS_DATA) {
    const student = await prisma.student.create({
      data: {
        firstName: sd.firstName,
        lastName: sd.lastName,
        dateOfBirth: new Date(`${2013 - parseInt(sd.grade)}-06-15`),
        grade: sd.grade,
        section: sd.section,
        studentId: `STU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        qrToken: crypto.randomBytes(32).toString('hex'),
        qrExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        address: sd.address,
        schoolId: school.id,
      },
    });
    students.push(student);
  }
  console.log(`Created ${students.length} students`);

  const parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
  if (parent) {
    for (let i = 0; i < students.length; i++) {
      await prisma.studentParent.upsert({
        where: { studentId_parentId: { studentId: students[i].id, parentId: parent.id } },
        update: {},
        create: {
          studentId: students[i].id,
          parentId: parent.id,
          isPrimary: i === 0,
          relation: i === 0 ? 'MOTHER' : 'PARENT',
        },
      });
    }
  }
  console.log('Linked all students to parent');

  const assignments = [];
  const drivers = await prisma.driver.findMany({ where: { schoolId: school.id } });

  for (let ri = 0; ri < routes.length; ri++) {
    const assignment = await prisma.assignment.create({
      data: {
        name: `${KATHMANDU_ROUTES[ri].name} Assignment`,
        schoolId: school.id,
        routeId: routes[ri].id,
      },
    });
    assignments.push(assignment);

    const driver = drivers[ri % drivers.length];
    await prisma.driverAssignment.create({
      data: { assignmentId: assignment.id, driverId: driver.id, isPrimary: true },
    });

    const bus = buses[ri % buses.length];
    await prisma.busAssignment.create({
      data: { assignmentId: assignment.id, busId: bus.id, isPrimary: true },
    });

    const routeStudentIndices = STUDENTS_DATA
      .map((sd, idx) => (sd.routeIdx === ri ? idx : -1))
      .filter(idx => idx !== -1);

    for (const studentIdx of routeStudentIndices) {
      const sd = STUDENTS_DATA[studentIdx];
      const routeStops = allStops.filter(s => s.routeId === routes[ri].id);
      const stopId = routeStops[Math.min(sd.stopIdx, routeStops.length - 1)]?.id;
      await prisma.studentAssignment.create({
        data: {
          assignmentId: assignment.id,
          studentId: students[studentIdx].id,
          stopId: stopId || routeStops[0]?.id,
        },
      });
    }
  }
  console.log(`Created ${assignments.length} assignments`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const morningTrips = [];
  for (let i = 0; i < routes.length; i++) {
    const driver = drivers[i % drivers.length];
    const bus = buses[i % buses.length];
    const trip = await prisma.trip.create({
      data: {
        type: TripType.MORNING,
        scheduledAt: new Date(new Date().setHours(7, 0, 0, 0)),
        driverId: driver.userId,
        busId: bus.id,
        routeId: routes[i].id,
        assignmentId: assignments[i].id,
        schoolId: school.id,
      },
    });
    morningTrips.push(trip);

    const afternoonTrip = await prisma.trip.create({
      data: {
        type: TripType.AFTERNOON,
        scheduledAt: new Date(new Date().setHours(15, 0, 0, 0)),
        driverId: driver.userId,
        busId: bus.id,
        routeId: routes[i].id,
        assignmentId: assignments[i].id,
        schoolId: school.id,
      },
    });

    const routeStudentIds = STUDENTS_DATA
      .map((sd, idx) => (sd.routeIdx === i ? students[idx].id : null))
      .filter(id => id !== null) as string[];

    for (const studentId of routeStudentIds) {
      await prisma.attendance.create({
        data: {
          studentId,
          tripId: i === 0 ? trip.id : afternoonTrip.id,
          schoolId: school.id,
          date: today,
          type: i === 0 ? TripType.MORNING : TripType.AFTERNOON,
          boardTime: i === 0 ? new Date(new Date().setHours(7, 15, 0, 0)) : undefined,
          status: i === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.NOT_BOARDED,
        },
      });
    }
  }
  console.log(`Created ${morningTrips.length} morning trips`);

  const schoolLocation = { lat: 27.6855, lng: 85.3245 };
  await prisma.school.update({
    where: { id: school.id },
    data: {
      address: `SafeRide School, ${schoolLocation.lat}, ${schoolLocation.lng}`,
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Default Accounts:');
  console.log('  Super Admin:  admin@saferide.com / Admin@123456');
  console.log('  School Admin: school@saferide.com / Admin@123456');
  console.log('  Parent:       parent@saferide.com / Admin@123456');
  console.log('  Drivers:      ram.driver@saferide.com / Admin@123456');
  console.log('                (hari, sita, krishna, mohan).driver@saferide.com / Admin@123456');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
