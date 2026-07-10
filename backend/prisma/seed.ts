import { PrismaClient, UserRole, UserStatus, TripType, TripStatus, BusStatus, AttendanceStatus, IncidentSeverity, IncidentStatus, NotificationChannel, NotificationType, ScanType, FuelType, MaintenanceType, MaintenancePriority, ServiceStatus, DocumentType, DeliveryStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SCHOOLS = [
  { name: 'SafeRide School', code: 'SRS001', address: 'Kathmandu, Nepal', phone: '+977-1-4XXXXXX', email: 'info@saferideschool.edu.np' },
  { name: 'Valley View Academy', code: 'VVA001', address: 'Lalitpur, Nepal', phone: '+977-1-5YYYYYY', email: 'info@valleyview.edu.np' },
  { name: 'Mountain Heights School', code: 'MHS001', address: 'Bhaktapur, Nepal', phone: '+977-1-6ZZZZZZ', email: 'info@mountainheights.edu.np' },
  { name: 'Riverside Public School', code: 'RPS001', address: 'Pokhara, Nepal', phone: '+977-61-4AAAAA', email: 'info@riverside.edu.np' },
  { name: 'Horizon International', code: 'HIS001', address: 'Biratnagar, Nepal', phone: '+977-21-5BBBBB', email: 'info@horizon.edu.np' },
];

const BUSES_DATA = [
  { plateNum: 'BA 1 JA 1234', busNum: 'BUS-001', model: 'Toyota Coaster', capacity: 30, color: 'Yellow' },
  { plateNum: 'BA 1 JA 5678', busNum: 'BUS-002', model: 'Ashok Leyland', capacity: 40, color: 'White' },
  { plateNum: 'BA 1 JA 9012', busNum: 'BUS-003', model: 'Tata Starbus', capacity: 35, color: 'Blue' },
  { plateNum: 'BA 1 JA 3456', busNum: 'BUS-004', model: 'Mahindra Turbo', capacity: 25, color: 'Green' },
  { plateNum: 'BA 1 JA 7890', busNum: 'BUS-005', model: 'Eicher Skyline', capacity: 50, color: 'Red' },
  { plateNum: 'BA 1 JA 1122', busNum: 'BUS-006', model: 'Toyota Coaster', capacity: 30, color: 'Orange' },
  { plateNum: 'BA 1 JA 3344', busNum: 'BUS-007', model: 'Tata Winger', capacity: 20, color: 'Silver' },
  { plateNum: 'BA 1 JA 5566', busNum: 'BUS-008', model: 'Ashok Leyland', capacity: 45, color: 'Blue' },
  { plateNum: 'BA 1 JA 7788', busNum: 'BUS-009', model: 'Eicher Skyline', capacity: 35, color: 'White' },
  { plateNum: 'BA 1 JA 9900', busNum: 'BUS-010', model: 'Mahindra Turbo', capacity: 28, color: 'Yellow' },
  { plateNum: 'BA 2 JA 1111', busNum: 'BUS-011', model: 'Tata Starbus', capacity: 35, color: 'Green' },
  { plateNum: 'BA 2 JA 2222', busNum: 'BUS-012', model: 'Toyota Coaster', capacity: 30, color: 'Red' },
  { plateNum: 'BA 2 JA 3333', busNum: 'BUS-013', model: 'Ashok Leyland', capacity: 40, color: 'White' },
  { plateNum: 'BA 2 JA 4444', busNum: 'BUS-014', model: 'Mahindra Turbo', capacity: 25, color: 'Blue' },
  { plateNum: 'BA 2 JA 5555', busNum: 'BUS-015', model: 'Eicher Skyline', capacity: 50, color: 'Yellow' },
];

const DRIVER_NAMES = [
  { first: 'Ram', last: 'Sharma' }, { first: 'Hari', last: 'Thapa' }, { first: 'Sita', last: 'Gurung' },
  { first: 'Krishna', last: 'Poudel' }, { first: 'Mohan', last: 'Bhandari' }, { first: 'Gita', last: 'Adhikari' },
  { first: 'Prakash', last: 'Tamang' }, { first: 'Sabina', last: 'Karki' }, { first: 'Ramesh', last: 'Shahi' },
  { first: 'Deepak', last: 'Singh' }, { first: 'Maya', last: 'Lama' }, { first: 'Rajesh', last: 'Chaudhary' },
  { first: 'Sunita', last: 'Rai' }, { first: 'Binod', last: 'Maharjan' }, { first: 'Anita', last: 'Shrestha' },
  { first: 'Suman', last: 'Thapa' }, { first: 'Nita', last: 'Poudel' }, { first: 'Aarav', last: 'Sharma' },
  { first: 'Rita', last: 'Gurung' }, { first: 'Pawan', last: 'Khanal' },
];

const NEPALI_NAMES = {
  first: ['Aarav', 'Aanya', 'Abhishek', 'Aditi', 'Ajay', 'Amit', 'Anjali', 'Anil', 'Anita', 'Arjun', 'Ashok', 'Asha', 'Bharat', 'Bhavani', 'Binod', 'Deepa', 'Deepak', 'Devi', 'Dinesh', 'Durga', 'Ganesh', 'Gita', 'Gopal', 'Harish', 'Indra', 'Jaya', 'Kabin', 'Kailash', 'Kamala', 'Kiran', 'Krishna', 'Kumar', 'Laxmi', 'Madan', 'Maya', 'Mohan', 'Mina', 'Nabin', 'Nisha', 'Nita', 'Om', 'Pawan', 'Pooja', 'Prakash', 'Pramod', 'Radha', 'Rajesh', 'Raju', 'Ram', 'Ramesh', 'Ranjit', 'Rashmi', 'Rita', 'Rohan', 'Roshani', 'Sabina', 'Sagar', 'Sajani', 'Samir', 'Sanjay', 'Sarita', 'Shanti', 'Shiva', 'Shyam', 'Sita', 'Sneha', 'Sonia', 'Sudip', 'Suman', 'Sunita', 'Suraj', 'Sushma', 'Usha'],
  last: ['Adhikari', 'Acharya', 'Bajracharya', 'Basnet', 'Bhandari', 'Bhatta', 'Bhattarai', 'Chaudhary', 'Dahal', 'Devkota', 'Gautam', 'Ghale', 'Gurung', 'KC', 'Koirala', 'Lama', 'Maharjan', 'Malla', 'Neupane', 'Ojha', 'Pandey', 'Pathak', 'Paudel', 'Pokharel', 'Pradhan', 'Rai', 'Regmi', 'Sapkota', 'Shah', 'Shakya', 'Sharma', 'Sherpa', 'Shrestha', 'Singh', 'Subedi', 'Tamang', 'Thapa', 'Tiwari', 'Upadhyay', 'Yadav'],
};

const STOP_NAMES = [
  { name: 'Maitighar', address: 'Maitighar, Kathmandu', lat: 27.6892, lng: 85.3274 },
  { name: 'Baneshwor Chowk', address: 'Baneshwor, Kathmandu', lat: 27.6985, lng: 85.3412 },
  { name: 'New Baneshwor', address: 'New Baneshwor, Kathmandu', lat: 27.6945, lng: 85.3378 },
  { name: 'Pulchowk', address: 'Pulchowk, Lalitpur', lat: 27.6782, lng: 85.3185 },
  { name: 'Lagankhel', address: 'Lagankhel, Lalitpur', lat: 27.6725, lng: 85.3234 },
  { name: 'Jawlakhel', address: 'Jawlakhel, Lalitpur', lat: 27.6685, lng: 85.3170 },
  { name: 'Chabahil', address: 'Chabahil, Kathmandu', lat: 27.7165, lng: 85.3550 },
  { name: 'Gaushala', address: 'Gaushala, Kathmandu', lat: 27.7120, lng: 85.3480 },
  { name: 'Min Bhawan', address: 'Min Bhawan, Kathmandu', lat: 27.7060, lng: 85.3400 },
  { name: 'Kalimati', address: 'Kalimati, Kathmandu', lat: 27.6960, lng: 85.2990 },
  { name: 'Kuleshwor', address: 'Kuleshwor, Kathmandu', lat: 27.6900, lng: 85.3050 },
  { name: 'Balkhu', address: 'Balkhu, Kathmandu', lat: 27.6840, lng: 85.2930 },
  { name: 'Koteshwor', address: 'Koteshwor, Kathmandu', lat: 27.6720, lng: 85.3450 },
  { name: 'Tinkune', address: 'Tinkune, Kathmandu', lat: 27.6810, lng: 85.3380 },
  { name: 'Sinamangal', address: 'Sinamangal, Kathmandu', lat: 27.6880, lng: 85.3520 },
  { name: 'Kupondole', address: 'Kupondole, Lalitpur', lat: 27.6815, lng: 85.3145 },
  { name: 'Bhadrakali', address: 'Bhadrakali, Kathmandu', lat: 27.7000, lng: 85.3210 },
  { name: 'Jamal', address: 'Jamal, Kathmandu', lat: 27.6990, lng: 85.3110 },
  { name: 'Kantipath', address: 'Kantipath, Kathmandu', lat: 27.7020, lng: 85.3070 },
  { name: 'New Road', address: 'New Road, Kathmandu', lat: 27.7035, lng: 85.3130 },
];

const SCHOOL_LOCATIONS = [
  { lat: 27.6855, lng: 85.3245 },
  { lat: 27.6650, lng: 85.3110 },
  { lat: 27.6720, lng: 85.3420 },
  { lat: 28.2096, lng: 83.9856 },
  { lat: 26.4525, lng: 87.2718 },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomFloat(min: number, max: number, decimals = 1): number { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }

function futureDate(daysAhead: number): Date { const d = new Date(); d.setDate(d.getDate() + daysAhead); return d; }

function pastDate(daysAgo: number): Date { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(0, 0, 0, 0); return d; }

function pastDays(days: number): Date[] { return Array.from({ length: days }, (_, i) => pastDate(days - i - 1)); }

function hourDate(h: number, m = 0): Date { const d = new Date(); d.setHours(h, m, 0, 0); return d; }

function dbg(msg: string): void { console.log(msg); }

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  SafeRide Nepal - Database Seed');
  console.log('========================================\n');

  // Clean existing data in dependency order
  console.log('Cleaning existing data...');
  await prisma.tripWaypoint.deleteMany();
  await prisma.tripEvent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.rawLocation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.serviceReminder.deleteMany();
  await prisma.serviceSchedule.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.busTelemetry.deleteMany();
  await prisma.driverSafetyEvent.deleteMany();
  await prisma.driverSafetyScore.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.pendingStudentRequest.deleteMany();
  await prisma.studentAssignment.deleteMany();
  await prisma.busAssignment.deleteMany();
  await prisma.driverAssignment.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: UserRole.SUPER_ADMIN } } });
  await prisma.school.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  console.log('Done cleaning.\n');

  const passwordHash = await argon2.hash('Admin@123456', { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

  // 1. SUPER ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@saferide.com' },
    update: {},
    create: { email: 'admin@saferide.com', passwordHash, firstName: 'Super', lastName: 'Admin', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, isEmailVerified: true },
  });
  dbg(`✓ Super admin: ${superAdmin.email}`);

  // 2. SCHOOLS
  const schoolRecords: any[] = [];
  for (const s of SCHOOLS) {
    const school = await prisma.school.upsert({ where: { code: s.code }, update: {}, create: s });
    schoolRecords.push(school);
    dbg(`✓ School: ${school.name} (${school.code})`);

    const admin = await prisma.user.upsert({
      where: { email: `admin.${s.code.toLowerCase()}@saferide.com` },
      update: {},
      create: { email: `admin.${s.code.toLowerCase()}@saferide.com`, passwordHash, firstName: `${s.name.split(' ')[0]}`, lastName: 'Admin', role: UserRole.SCHOOL_ADMIN, status: UserStatus.ACTIVE, schoolId: school.id, isEmailVerified: true },
    });
    dbg(`  └ Admin: ${admin.email}`);
  }

  // 3. DRIVERS + BUSES per school
  const allDrivers: any[] = [];
  const allBuses: any[] = [];
  let driverIdx = 0;

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const busCount = si === 0 ? 5 : si < 3 ? 3 : 2; // 5 for first school, 3 for next two, 2 for others = 15
    const driverCount = busCount + (si < 2 ? 1 : 0);

    for (let i = 0; i < driverCount && driverIdx < DRIVER_NAMES.length; i++) {
      const d = DRIVER_NAMES[driverIdx++];
      const user = await prisma.user.upsert({
        where: { email: `${d.first.toLowerCase()}.driver${si}@saferide.com` },
        update: {},
        create: { email: `${d.first.toLowerCase()}.driver${si}@saferide.com`, passwordHash, firstName: d.first, lastName: d.last, role: UserRole.DRIVER, status: UserStatus.ACTIVE, schoolId: school.id, isEmailVerified: true },
      });
      const driver = await prisma.driver.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, licenseNumber: `LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, licenseExpiry: futureDate(randomInt(180, 730)), isAvailable: true, schoolId: school.id, emergencyContact: `+977-98${randomInt(40000000, 99999999)}` },
      });
      allDrivers.push({ ...driver, user, schoolIdx: si });
    }

    // Buses
    const busStartIdx = si === 0 ? 0 : si === 1 ? 5 : si === 2 ? 8 : si === 3 ? 11 : 13;
    for (let i = 0; i < busCount; i++) {
      const b = BUSES_DATA[busStartIdx + i];
      const bus = await prisma.bus.upsert({
        where: { plateNumber: b.plateNum },
        update: {},
        create: {
          plateNumber: b.plateNum, busNumber: b.busNum, model: b.model, capacity: b.capacity, year: randomInt(2020, 2024),
          color: b.color, status: BusStatus.ACTIVE, schoolId: school.id,
          lastGpsLat: SCHOOL_LOCATIONS[si].lat + randomFloat(-0.03, 0.03, 4),
          lastGpsLng: SCHOOL_LOCATIONS[si].lng + randomFloat(-0.03, 0.03, 4),
          lastGpsUpdate: new Date(),
        },
      });
      allBuses.push({ ...bus, schoolIdx: si });
    }
    dbg(`✓ ${school.name}: ${driverCount} drivers, ${busCount} buses`);
  }

  // 4. ROUTES + STOPS per school
  const allRoutes: any[] = [];
  const allStops: any[] = [];
  let routeIdx = 0;

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const routeCount = si === 0 ? 5 : 3; // 5 routes for first school, 3 for others = 17 routes

    for (let r = 0; r < routeCount; r++) {
      const ri = routeIdx % KATHMANDU_ROUTES.length;
      const base = KATHMANDU_ROUTES[ri];
      const code = `RT-${school.code}-${String(r + 1).padStart(2, '0')}`;
      const route = await prisma.route.upsert({
        where: { code },
        update: {},
        create: { name: `${base.name}`, code, direction: 'TO_SCHOOL', distance: randomFloat(3, 8), duration: randomInt(20, 45), schoolId: school.id },
      });
      allRoutes.push({ ...route, schoolIdx: si });

      // 3 stops per route
      const stopCount = 3;
      for (let s = 0; s < stopCount; s++) {
        const sn = STOP_NAMES[(routeIdx * 3 + s) % STOP_NAMES.length];
        const stop = await prisma.stop.create({
          data: { name: sn.name, address: sn.address, latitude: sn.lat + randomFloat(-0.005, 0.005, 5), longitude: sn.lng + randomFloat(-0.005, 0.005, 5), schoolId: school.id },
        });
        await prisma.routeStop.create({ data: { routeId: route.id, stopId: stop.id, sequence: s + 1, distance: s > 0 ? randomFloat(1, 3) : 0, duration: s > 0 ? randomInt(5, 12) : 0 } });
        allStops.push({ id: stop.id, routeId: route.id, schoolIdx: si });
      }
      routeIdx++;
    }
  }
  dbg(`✓ Created ${allRoutes.length} routes with ${allStops.length} stops`);

  // 5. STUDENTS + PARENTS per school
  const allStudents: any[] = [];
  const allParents: any[] = [];
  let studentCounter = 1;

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolRoutes = allRoutes.filter(r => r.schoolIdx === si);
    const studentCount = si === 0 ? 40 : si < 3 ? 25 : 20; // 40 + 25 + 25 + 20 + 20 = 130

    const studentsCreated: any[] = [];

    for (let i = 0; i < studentCount; i++) {
      const firstName = pick(NEPALI_NAMES.first);
      const lastName = pick(NEPALI_NAMES.last);
      const grade = String(randomInt(1, 10));
      const section = pick(['A', 'B', 'C']);
      const sid = `STU-${String(studentCounter++).padStart(5, '0')}`;

      const student = await prisma.student.create({
        data: {
          firstName, lastName, dateOfBirth: new Date(`${2017 - parseInt(grade)}-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`),
          grade, section, studentId: sid, qrToken: sid, qrExpiresAt: futureDate(365), address: `${pick(['Baneshwor', 'Pulchowk', 'Chabahil', 'Kalimati', 'Koteshwor', 'Jawlakhel', 'Lagankhel', 'Gaushala', 'Kupondole', 'New Baneshwor'])}, ${pick(['Kathmandu', 'Lalitpur', 'Bhaktapur'])}`,
          isActive: true, schoolId: school.id,
        },
      });
      studentsCreated.push(student);

      // Parent user
      const parentEmail = `parent.${sid.toLowerCase()}@saferide.com`;
      const parentUser = await prisma.user.upsert({
        where: { email: parentEmail },
        update: {},
        create: { email: parentEmail, passwordHash, firstName: pick(NEPALI_NAMES.first), lastName, role: UserRole.PARENT, status: UserStatus.ACTIVE, schoolId: school.id, isEmailVerified: true, phone: `+977-98${randomInt(40000000, 99999999)}` },
      });
      const parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: { userId: parentUser.id, emergencyContact: Math.random() > 0.7 },
      });
      await prisma.studentParent.create({ data: { studentId: student.id, parentId: parent.id, isPrimary: true, relation: pick(['FATHER', 'MOTHER', 'GUARDIAN']) } });

      allParents.push(parent);
    }
    allStudents.push(...studentsCreated);
    dbg(`✓ ${school.name}: ${studentsCreated.length} students with parents`);
  }
  dbg(`  Total: ${allStudents.length} students, ${allParents.length} parents`);

  // 6. ASSIGNMENTS linking routes, drivers, buses, students
  const allAssignments: any[] = [];

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolRoutes = allRoutes.filter(r => r.schoolIdx === si);
    const schoolBuses = allBuses.filter(b => b.schoolIdx === si);
    const schoolDrivers = allDrivers.filter(d => d.schoolIdx === si);
    const schoolStudents = allStudents.filter(s => s.schoolId === school.id);

    for (let ri = 0; ri < schoolRoutes.length; ri++) {
      const route = schoolRoutes[ri];
      const assignment = await prisma.assignment.create({
        data: { name: `${route.name} Assignment`, schoolId: school.id, routeId: route.id },
      });
      allAssignments.push({ ...assignment, schoolIdx: si, routeId: route.id });

      // Assign driver
      const driver = schoolDrivers[ri % schoolDrivers.length];
      await prisma.driverAssignment.create({ data: { assignmentId: assignment.id, driverId: driver.id, isPrimary: true } });

      // Assign bus
      const bus = schoolBuses[ri % schoolBuses.length];
      await prisma.busAssignment.create({ data: { assignmentId: assignment.id, busId: bus.id, isPrimary: true } });

      // Assign students (evenly distributed across routes)
      const studentsPerRoute = Math.ceil(schoolStudents.length / schoolRoutes.length);
      const startIdx = ri * studentsPerRoute;
      const routeStudents = schoolStudents.slice(startIdx, startIdx + studentsPerRoute);

      const routeStops = allStops.filter(s => s.routeId === route.id && s.schoolIdx === si);
      for (let si2 = 0; si2 < routeStudents.length; si2++) {
        const stop = routeStops[si2 % routeStops.length];
        await prisma.studentAssignment.create({
          data: { assignmentId: assignment.id, studentId: routeStudents[si2].id, stopId: stop?.id || null, isActive: true },
        });
      }
    }
  }
  dbg(`✓ Created ${allAssignments.length} assignments`);

  // 7. TODAY'S TRIPS
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tripRecords: any[] = [];

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolAssignments = allAssignments.filter(a => a.schoolIdx === si);
    const schoolDrivers = allDrivers.filter(d => d.schoolIdx === si);
    const schoolBuses = allBuses.filter(b => b.schoolIdx === si);

    for (let i = 0; i < schoolAssignments.length; i++) {
      const a = schoolAssignments[i];
      const driver = schoolDrivers[i % schoolDrivers.length];
      const bus = schoolBuses[i % schoolBuses.length];

      // Morning trip (SCHEDULED or ACTIVE)
      const morningStatus = Math.random() > 0.3 ? TripStatus.ACTIVE : TripStatus.SCHEDULED;
      const morning = await prisma.trip.create({
        data: {
          type: TripType.MORNING, status: morningStatus, scheduledAt: hourDate(7, 0),
          startedAt: morningStatus === TripStatus.ACTIVE ? hourDate(7, 5) : null,
          driverId: driver.userId, busId: bus.id, routeId: a.routeId, assignmentId: a.id, schoolId: school.id,
          stopSequence: 0, totalStops: 3, completedStops: 0,
        },
      });
      tripRecords.push(morning);

      // Afternoon trip (SCHEDULED)
      await prisma.trip.create({
        data: {
          type: TripType.AFTERNOON, status: TripStatus.SCHEDULED, scheduledAt: hourDate(15, 0),
          driverId: driver.userId, busId: bus.id, routeId: a.routeId, assignmentId: a.id, schoolId: school.id,
          stopSequence: 0, totalStops: 3, completedStops: 0,
        },
      });
    }
  }
  dbg(`✓ Created ${tripRecords.length} active/upcoming trips`);

  // 8. TODAY'S QR SCANS (board-in for active trips)
  let scanCount = 0;
  for (const trip of tripRecords) {
    if (trip.status !== TripStatus.ACTIVE) continue;
    const school = schoolRecords.find(s => s.id === trip.schoolId);
    const assignment = allAssignments.find(a => a.id === trip.assignmentId);
    if (!assignment) continue;

    const schoolStudents = allStudents.filter(s => s.schoolId === trip.schoolId);
    const studentsToScan = schoolStudents.slice(0, Math.ceil(schoolStudents.length * randomFloat(0.6, 0.9)));

    for (let si = 0; si < studentsToScan.length; si++) {
      const student = studentsToScan[si];
      await prisma.tripEvent.create({
        data: {
          eventId: `EVT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          tripId: trip.id, studentId: student.id, scanType: ScanType.BOARD_IN,
          latitude: SCHOOL_LOCATIONS[schoolRecords.indexOf(school!)].lat + randomFloat(-0.01, 0.01, 5),
          longitude: SCHOOL_LOCATIONS[schoolRecords.indexOf(school!)].lng + randomFloat(-0.01, 0.01, 5),
          faceVerified: Math.random() > 0.15 ? 'VERIFIED' as any : 'PENDING' as any,
          createdAt: new Date(Date.now() - randomInt(60000, 3600000)),
        },
      });

      await prisma.attendance.upsert({
        where: { studentId_schoolId_date_type: { studentId: student.id, schoolId: trip.schoolId, date: today, type: TripType.MORNING } },
        update: { status: AttendanceStatus.BOARDED, boardTime: new Date(Date.now() - randomInt(60000, 3600000)), tripId: trip.id },
        create: { studentId: student.id, tripId: trip.id, schoolId: trip.schoolId, date: today, type: TripType.MORNING, status: AttendanceStatus.BOARDED, boardTime: new Date(Date.now() - randomInt(60000, 3600000)) },
      });
      scanCount++;
    }
  }
  dbg(`✓ ${scanCount} today's QR scans recorded`);

  // 9. HISTORICAL ATTENDANCE (last 30 days)
  const days = pastDays(30);
  let histCount = 0;
  for (const student of allStudents) {
    const school = schoolRecords.find(s => s.id === student.schoolId)!;
    for (const day of days) {
      if (day.getDay() === 0 || day.getDay() === 6) continue; // Skip weekends
      const status = Math.random() > 0.08 ? AttendanceStatus.PRESENT : Math.random() > 0.5 ? AttendanceStatus.ABSENT : AttendanceStatus.LATE;
      const boardHour = pick([7, 7, 7, 7, 8]);
      const boardMin = randomInt(5, 45);
      await prisma.attendance.upsert({
        where: { studentId_schoolId_date_type: { studentId: student.id, schoolId: school.id, date: day, type: TripType.MORNING } },
        update: { status, boardTime: status === AttendanceStatus.ABSENT ? null : new Date(day.setHours(boardHour, boardMin, 0, 0)), isLate: status === AttendanceStatus.LATE, lateMinutes: status === AttendanceStatus.LATE ? randomInt(10, 45) : 0 },
        create: { studentId: student.id, schoolId: school.id, date: day, type: TripType.MORNING, status, boardTime: status === AttendanceStatus.ABSENT ? null : new Date(day.setHours(boardHour, boardMin, 0, 0)), isLate: status === AttendanceStatus.LATE, lateMinutes: status === AttendanceStatus.LATE ? randomInt(10, 45) : 0 },
      });
      histCount++;
    }
  }
  dbg(`✓ ${histCount} historical attendance records (30 days)`);

  // 10. GPS WAYPOINTS for active trips
  let waypointCount = 0;
  for (const trip of tripRecords) {
    if (trip.status !== TripStatus.ACTIVE) continue;
    const schoolIdx = schoolRecords.findIndex(s => s.id === trip.schoolId);
    const schoolLoc = SCHOOL_LOCATIONS[schoolIdx];
    const waypoints = randomInt(5, 15);

    for (let w = 0; w < waypoints; w++) {
      await prisma.tripWaypoint.create({
        data: {
          tripId: trip.id,
          latitude: schoolLoc.lat + randomFloat(-0.02, 0.02, 5),
          longitude: schoolLoc.lng + randomFloat(-0.02, 0.02, 5),
          speed: randomFloat(10, 45), heading: randomFloat(0, 359), occupancy: randomInt(5, 30),
          timestamp: new Date(Date.now() - (waypoints - w) * randomInt(10000, 60000)),
        },
      });
      waypointCount++;
    }
  }
  dbg(`✓ ${waypointCount} GPS waypoints for active trips`);

  // 11. BUS TELEMETRY (heartbeats)
  for (const bus of allBuses) {
    const school = schoolRecords.find(s => s.id === bus.schoolId)!;
    await prisma.busTelemetry.upsert({
      where: { busId: bus.id },
      update: {
        batteryLevel: randomFloat(25, 98), storageFree: randomFloat(500, 4000), gpsAccuracy: randomFloat(2, 20),
        mqttSignal: randomInt(-75, -45), wifiSignal: randomInt(-80, -50), scannerStatus: Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE',
        firmwareVersion: `v2.${randomInt(0, 5)}.${randomInt(0, 9)}`, lastHeartbeatAt: new Date(Date.now() - randomInt(0, 120000)),
        lastQrScanAt: Math.random() > 0.3 ? new Date(Date.now() - randomInt(60000, 3600000)) : null,
        schoolId: school.id,
      },
      create: {
        busId: bus.id, schoolId: school.id, batteryLevel: randomFloat(25, 98), storageFree: randomFloat(500, 4000),
        gpsAccuracy: randomFloat(2, 20), mqttSignal: randomInt(-75, -45), wifiSignal: randomInt(-80, -50),
        scannerStatus: Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE', firmwareVersion: `v2.${randomInt(0, 5)}.${randomInt(0, 9)}`,
        lastHeartbeatAt: new Date(Date.now() - randomInt(0, 120000)),
        lastQrScanAt: Math.random() > 0.3 ? new Date(Date.now() - randomInt(60000, 3600000)) : null,
      },
    });
  }
  dbg(`✓ Bus telemetry for ${allBuses.length} buses`);

  // 12. FUEL LOGS (last 60 days, weekly)
  let fuelCount = 0;
  for (const bus of allBuses) {
    const school = schoolRecords.find(s => s.id === bus.schoolId)!;
    const logsCount = randomInt(4, 8);
    for (let i = 0; i < logsCount; i++) {
      await prisma.fuelLog.create({
        data: {
          busId: bus.id, schoolId: school.id, date: pastDate(randomInt(1, 60)),
          liters: randomFloat(15, bus.capacity === 50 ? 60 : bus.capacity === 40 ? 50 : 35),
          costPerLiter: randomFloat(150, 180), totalCost: 0,
          fuelType: pick(['DIESEL', 'PETROL', 'DIESEL', 'DIESEL'] as FuelType[]),
          station: pick(['NOC Pump', 'Nepal Oil', 'Lubricants Nepal', 'Bharat Petroleum', 'Indian Oil']),
          odometer: randomInt(5000, 80000), notes: null,
        },
      });
      fuelCount++;
    }
  }
  dbg(`✓ ${fuelCount} fuel log entries`);

  // 13. MAINTENANCE RECORDS
  let maintCount = 0;
  for (const bus of allBuses) {
    const school = schoolRecords.find(s => s.id === bus.schoolId)!;
    const recordsCount = randomInt(1, 4);
    for (let i = 0; i < recordsCount; i++) {
      await prisma.maintenanceRecord.create({
        data: {
          busId: bus.id, schoolId: school.id, type: pick(['ROUTINE', 'REPAIR', 'BRAKE_SERVICE', 'ENGINE_SERVICE', 'TYRE_REPLACEMENT', 'ELECTRICAL', 'BODY_WORK'] as MaintenanceType[]),
          description: pick(['Regular servicing', 'Oil change', 'Brake pad replacement', 'Tyre rotation', 'Battery replacement', 'Engine tune-up', 'AC repair', 'Body work']),
          priority: pick(['LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'MEDIUM'] as MaintenancePriority[]),
          status: pick(['COMPLETED', 'COMPLETED', 'COMPLETED', 'SCHEDULED'] as ServiceStatus[]),
          scheduledAt: pastDate(randomInt(1, 90)), completedAt: Math.random() > 0.25 ? pastDate(randomInt(0, 60)) : null,
          cost: randomInt(2000, 50000), odometer: randomInt(10000, 80000), vendor: pick(['Doko Motors', 'Nagarik Service', 'Kathmandu Auto', 'Lalitpur Garage', 'Bharat Auto Works']),
          notes: Math.random() > 0.5 ? pick(['All OK', 'Needs follow-up in 3 months', 'Parts replaced under warranty', 'Recommended next service at 5000km']) : null,
        },
      });
      maintCount++;
    }
  }
  dbg(`✓ ${maintCount} maintenance records`);

  // 14. SERVICE REMINDERS
  let reminderCount = 0;
  for (const bus of allBuses) {
    const school = schoolRecords.find(s => s.id === bus.schoolId)!;
    const count = randomInt(1, 3);
    for (let i = 0; i < count; i++) {
      await prisma.serviceReminder.create({
        data: {
          busId: bus.id, schoolId: school.id, type: pick(['ROUTINE', 'BRAKE_SERVICE', 'ENGINE_SERVICE', 'TYRE_REPLACEMENT', 'INSPECTION'] as MaintenanceType[]),
          description: pick(['Oil change due', 'Brake inspection', 'Tyre pressure check', 'Coolant top-up', 'Battery check', 'General inspection']),
          dueDate: futureDate(randomInt(1, 60)), dueOdometer: randomInt(1000, 10000),
          odometerInterval: randomInt(3000, 8000), isRecurring: true, isActive: true,
        },
      });
      reminderCount++;
    }
  }
  dbg(`✓ ${reminderCount} service reminders`);

  // 15. INSURANCE POLICIES
  let insCount = 0;
  for (const bus of allBuses) {
    const school = schoolRecords.find(s => s.id === bus.schoolId)!;
    await prisma.insurancePolicy.create({
      data: {
        busId: bus.id, schoolId: school.id, provider: pick(['Nepal Insurance', 'Himalayan Life', 'Sagarmatha Insurance', 'National Insurance', 'Shikhar Insurance']),
        policyNumber: `POL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, startDate: pastDate(randomInt(30, 365)),
        expiryDate: futureDate(randomInt(30, 365)), coverage: pick(['Third Party', 'Comprehensive', 'Comprehensive + Theft']),
        premium: randomInt(15000, 80000),       status: 'SCHEDULED' as ServiceStatus,
      },
    });
    insCount++;
  }
  dbg(`✓ ${insCount} insurance policies`);

  // 16. INCIDENTS (historical and active)
  let incCount = 0;
  const incidentTypes = [
    { title: 'Tire Burst', desc: 'Rear left tire burst during transit', sev: 'HIGH' as IncidentSeverity },
    { title: 'Engine Overheating', desc: 'Engine temperature exceeded normal range', sev: 'MEDIUM' as IncidentSeverity },
    { title: 'Minor Accident', desc: 'Bus was involved in a minor side collision', sev: 'HIGH' as IncidentSeverity },
    { title: 'Student Illness', desc: 'Student reported feeling unwell during trip', sev: 'MEDIUM' as IncidentSeverity },
    { title: 'Brake Failure', desc: 'Brake pedal went to the floor', sev: 'CRITICAL' as IncidentSeverity },
    { title: 'Route Blockage', desc: 'Road construction blocking the usual route', sev: 'LOW' as IncidentSeverity },
    { title: 'Late Departure', desc: 'Bus departed 20 minutes late due to traffic', sev: 'LOW' as IncidentSeverity },
    { title: 'GPS Signal Lost', desc: 'GPS module stopped reporting position', sev: 'MEDIUM' as IncidentSeverity },
  ];

  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolDrivers2 = allDrivers.filter(d => d.schoolIdx === si);
    const schoolBuses2 = allBuses.filter(b => b.schoolIdx === si);
    const incCountPerSchool = randomInt(2, 5);

    for (let i = 0; i < incCountPerSchool; i++) {
      const incType = pick(incidentTypes);
      const isResolved = Math.random() > 0.3;
      const daysAgo = randomInt(0, 30);
      const schoolTrips = tripRecords.filter(t => t.schoolId === school.id);
      const selectedTrip = schoolTrips.length > 0 ? pick(schoolTrips) : null;

      await prisma.incident.create({
        data: {
          title: incType.title, description: incType.desc, severity: incType.sev,
          status: isResolved ? IncidentStatus.RESOLVED : pick([IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING]),
          latitude: SCHOOL_LOCATIONS[si].lat + randomFloat(-0.015, 0.015, 5),
          longitude: SCHOOL_LOCATIONS[si].lng + randomFloat(-0.015, 0.015, 5),
          location: pick(['Near Baneshwor', 'Ring Road', 'Pulchowk Area', 'Chabahil Chowk', 'Koteshwor']),
          reportedById: pick(schoolDrivers2).userId, tripId: selectedTrip?.id || undefined,
          busId: pick(schoolBuses2).id, imageUrls: [],
          resolution: isResolved ? pick(['Issue resolved by on-call mechanic', 'Student taken to hospital, all OK', 'Replacement bus arranged', 'Route changed temporarily', 'GPS module replaced']) : null,
          resolvedAt: isResolved ? pastDate(randomInt(0, daysAgo)) : null,
          resolvedById: isResolved ? superAdmin.id : null,
          createdAt: pastDate(daysAgo),
        },
      });
      incCount++;
    }
  }
  dbg(`✓ ${incCount} incidents recorded`);

  // 17. NOTIFICATIONS (historical)
  let notifCount = 0;
  for (const parent of allParents.slice(0, 30)) { // 30 parents get history
    const studentParent = await prisma.studentParent.findFirst({ where: { parentId: parent.id }, include: { student: true } });
    if (!studentParent) continue;
    const school = schoolRecords.find(s => s.id === studentParent.student.schoolId)!;
    const daysAgo = randomInt(0, 14);

    for (const notifType of ['ATTENDANCE', 'TRIP_UPDATE'] as NotificationType[]) {
      if (Math.random() > 0.5) continue;
      await prisma.notification.create({
        data: {
          type: notifType, channel: NotificationChannel.IN_APP,
          title: notifType === 'ATTENDANCE' ? 'Student Boarded Bus' : 'Trip Update',
          body: notifType === 'ATTENDANCE'
            ? `${studentParent.student.firstName} ${studentParent.student.lastName} has boarded the bus.`
            : `Your child's bus has started the morning trip.`,
          userId: (await prisma.parent.findUnique({ where: { id: parent.id }, include: { user: true } }))!.userId,
          schoolId: school.id, isRead: Math.random() > 0.3, readAt: Math.random() > 0.3 ? pastDate(randomInt(0, daysAgo)) : null,
          sentAt: pastDate(daysAgo), deliveredAt: pastDate(daysAgo), deliveryStatus: DeliveryStatus.DELIVERED,
          createdAt: pastDate(daysAgo),
        },
      });
      notifCount++;
    }
  }
  dbg(`✓ ${notifCount} notification records`);

  // 18. DRIVER SAFETY SCORES
  for (let si = 0; si < schoolRecords.length; si++) {
    const schoolDrivers3 = allDrivers.filter(d => d.schoolIdx === si);
    for (const driver of schoolDrivers3) {
      await prisma.driverSafetyScore.upsert({
        where: { driverId: driver.userId },
        update: {},
        create: {
          driverId: driver.userId, overallScore: randomFloat(65, 98, 1),
          tripCount: randomInt(20, 180), totalDistance: randomFloat(200, 3000, 1),
          overspeedCount: randomInt(0, 15), deviationCount: randomInt(0, 8), idleEventCount: randomInt(0, 20),
          missedStopCount: randomInt(0, 5), hardBrakeCount: randomInt(0, 12), gpsDropCount: randomInt(0, 6), emergencyCount: randomInt(0, 3),
        },
      });
    }
  }
  dbg(`✓ Driver safety scores for ${allDrivers.length} drivers`);

  // 19. UPDATE SCHOOL LOCATIONS
  for (let si = 0; si < schoolRecords.length; si++) {
    await prisma.school.update({
      where: { id: schoolRecords[si].id },
      data: { address: `${schoolRecords[si].name}, ${SCHOOL_LOCATIONS[si].lat}, ${SCHOOL_LOCATIONS[si].lng}` },
    });
  }

  console.log('\n========================================');
  console.log('  Seed completed successfully!');
  console.log('========================================\n');
  console.log('Default Accounts (password: Admin@123456):');
  console.log('  Super Admin:  admin@saferide.com');
  console.log('  Schools:      admin.srs001@saferide.com, admin.vva001@saferide.com, admin.mhs001@saferide.com');
  console.log('  Parents:      parent.stu_00001@saferide.com ... (one per student)');
  console.log('  Drivers:      ram.driver0@saferide.com, hari.driver0@saferide.com, ...');
  console.log('');
  console.log('  Schools:');
  for (const s of schoolRecords) {
    const sc = allStudents.filter(st => st.schoolId === s.id);
    const sb = allBuses.filter(b => b.schoolId === s.id);
    console.log(`    ${s.name}: ${sc.length} students, ${sb.length} buses`);
  }
}

const KATHMANDU_ROUTES = [
  { name: 'Baneshwor Route', dir: 'TO_SCHOOL' },
  { name: 'Pulchowk Route', dir: 'TO_SCHOOL' },
  { name: 'Chabahil Route', dir: 'TO_SCHOOL' },
  { name: 'Kalimati Route', dir: 'TO_SCHOOL' },
  { name: 'Koteshwor Route', dir: 'TO_SCHOOL' },
];

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
