const { PrismaClient, UserRole, UserStatus, TripType, TripStatus, BusStatus, AttendanceStatus, IncidentSeverity, IncidentStatus, NotificationChannel, NotificationType, ScanType, FuelType, MaintenanceType, MaintenancePriority, ServiceStatus, DocumentType, DeliveryStatus } = require('@prisma/client');
const argon2 = require('argon2');
const crypto = require('crypto');

const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function futureDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d; }

const SCHOOLS = [
  { name: 'SafeRide School', code: 'SRS001', address: 'Kathmandu, Nepal', phone: '+977-1-4XXXXXX', email: 'info@saferideschool.edu.np' },
  { name: 'Valley View Academy', code: 'VVA001', address: 'Lalitpur, Nepal', phone: '+977-1-5YYYYYY', email: 'info@valleyview.edu.np' },
];

const BUSES_DATA = [
  { plateNumber: 'BA 1 JA 1234', busNumber: 'BUS-001', model: 'Toyota Coaster', capacity: 30, year: 2022, color: 'Yellow' },
  { plateNumber: 'BA 1 JA 5678', busNumber: 'BUS-002', model: 'Ashok Leyland', capacity: 40, year: 2023, color: 'White' },
  { plateNumber: 'BA 1 JA 9012', busNumber: 'BUS-003', model: 'Tata Starbus', capacity: 35, year: 2021, color: 'Blue' },
  { plateNumber: 'BA 1 JA 3456', busNumber: 'BUS-004', model: 'Mahindra Turbo', capacity: 25, year: 2024, color: 'Green' },
  { plateNumber: 'BA 1 JA 7890', busNumber: 'BUS-005', model: 'Eicher Skyline', capacity: 50, year: 2023, color: 'Red' },
  { plateNumber: 'BA 1 JA 1122', busNumber: 'BUS-006', model: 'Toyota Coaster', capacity: 30, year: 2022, color: 'Orange' },
  { plateNumber: 'BA 1 JA 3344', busNumber: 'BUS-007', model: 'Tata Winger', capacity: 20, year: 2023, color: 'Silver' },
  { plateNumber: 'BA 1 JA 5566', busNumber: 'BUS-008', model: 'Ashok Leyland', capacity: 45, year: 2024, color: 'Blue' },
  { plateNumber: 'BA 1 JA 7788', busNumber: 'BUS-009', model: 'Eicher Skyline', capacity: 35, year: 2022, color: 'White' },
  { plateNumber: 'BA 1 JA 9900', busNumber: 'BUS-010', model: 'Mahindra Turbo', capacity: 28, year: 2024, color: 'Yellow' },
];

const DRIVER_NAMES = [
  { first: 'Ram', last: 'Sharma' }, { first: 'Hari', last: 'Thapa' }, { first: 'Sita', last: 'Gurung' },
  { first: 'Krishna', last: 'Poudel' }, { first: 'Mohan', last: 'Bhandari' }, { first: 'Gita', last: 'Adhikari' },
  { first: 'Prakash', last: 'Tamang' }, { first: 'Sabina', last: 'Karki' }, { first: 'Ramesh', last: 'Shahi' },
  { first: 'Deepak', last: 'Singh' },
];

const NEPALI_FIRST = ['Aarav','Aanya','Abhishek','Aditi','Ajay','Amit','Anjali','Anil','Anita','Arjun','Ashok','Asha','Bharat','Bhavani','Binod','Deepa','Deepak','Devi','Dinesh','Durga','Ganesh','Gita','Gopal','Harish','Indra','Jaya','Kabin','Kailash','Kamala','Kiran','Krishna','Kumar','Laxmi','Madan','Maya','Mohan','Mina','Nabin','Nisha','Nita','Om','Pawan','Pooja','Prakash','Pramod','Radha','Rajesh','Raju','Ram','Ramesh','Ranjit','Rashmi','Rita','Rohan','Roshani','Sabina','Sagar','Sajani','Samir','Sanjay','Sarita','Shanti','Shiva','Shyam','Sita','Sneha','Sonia','Sudip','Suman','Sunita','Suraj','Sushma','Usha'];
const NEPALI_LAST = ['Adhikari','Acharya','Bajracharya','Basnet','Bhandari','Bhatta','Bhattarai','Chaudhary','Dahal','Devkota','Gautam','Ghale','Gurung','KC','Koirala','Lama','Maharjan','Malla','Neupane','Ojha','Pandey','Pathak','Paudel','Pokharel','Pradhan','Rai','Regmi','Sapkota','Shah','Shakya','Sharma','Sherpa','Shrestha','Singh','Subedi','Tamang','Thapa','Tiwari','Upadhyay','Yadav'];

const ROUTES_CONFIG = [
  { name: 'Baneshwor Route', code: 'RT-BN-01', direction: 'School to Home', distance: 5.2, duration: 30, stops: [{ name: 'Maitighar', address: 'Maitighar Kathmandu', lat: 27.6892, lng: 85.3274 },{ name: 'Baneshwor Chowk', address: 'Baneshwor Kathmandu', lat: 27.6985, lng: 85.3412 },{ name: 'New Baneshwor', address: 'New Baneshwor Kathmandu', lat: 27.6945, lng: 85.3378 }] },
  { name: 'Pulchowk Route', code: 'RT-PC-01', direction: 'School to Home', distance: 4.5, duration: 25, stops: [{ name: 'Pulchowk Chowk', address: 'Pulchowk Lalitpur', lat: 27.6782, lng: 85.3185 },{ name: 'Lagankhel', address: 'Lagankhel Lalitpur', lat: 27.6725, lng: 85.3234 },{ name: 'Jawlakhel', address: 'Jawlakhel Lalitpur', lat: 27.6685, lng: 85.3170 }] },
  { name: 'Chabahil Route', code: 'RT-CB-01', direction: 'School to Home', distance: 6.0, duration: 35, stops: [{ name: 'Chabahil Chowk', address: 'Chabahil Kathmandu', lat: 27.7165, lng: 85.3550 },{ name: 'Gaushala', address: 'Gaushala Kathmandu', lat: 27.7120, lng: 85.3480 },{ name: 'Min Bhawan', address: 'Min Bhawan Kathmandu', lat: 27.7060, lng: 85.3400 }] },
  { name: 'Kalimati Route', code: 'RT-KL-01', direction: 'School to Home', distance: 5.8, duration: 32, stops: [{ name: 'Kalimati Chowk', address: 'Kalimati Kathmandu', lat: 27.6960, lng: 85.2990 },{ name: 'Kuleshwor', address: 'Kuleshwor Kathmandu', lat: 27.6900, lng: 85.3050 },{ name: 'Balkhu', address: 'Balkhu Kathmandu', lat: 27.6840, lng: 85.2930 }] },
  { name: 'Koteshwor Route', code: 'RT-KT-01', direction: 'School to Home', distance: 4.8, duration: 28, stops: [{ name: 'Koteshwor Chowk', address: 'Koteshwor Kathmandu', lat: 27.6720, lng: 85.3450 },{ name: 'Tinkune', address: 'Tinkune Kathmandu', lat: 27.6810, lng: 85.3380 },{ name: 'Airport Gate', address: 'Sinamangal Kathmandu', lat: 27.6880, lng: 85.3520 }] },
  { name: 'Kupondole Route', code: 'RT-KP-01', direction: 'Home to School', distance: 3.8, duration: 22, stops: [{ name: 'Kupondole Chowk', address: 'Kupondole Lalitpur', lat: 27.6820, lng: 85.3100 },{ name: 'Thapagaun', address: 'Thapagaun Lalitpur', lat: 27.6740, lng: 85.3120 }] },
  { name: 'Sanepa Route', code: 'RT-SN-01', direction: 'Home to School', distance: 4.2, duration: 24, stops: [{ name: 'Sanepa Chowk', address: 'Sanepa Lalitpur', lat: 27.6760, lng: 85.3060 },{ name: 'Khumaltar', address: 'Khumaltar Lalitpur', lat: 27.6690, lng: 85.3080 }] },
  { name: 'Bouddha Route', code: 'RT-BD-01', direction: 'School to Home', distance: 7.5, duration: 40, stops: [{ name: 'Bouddha Chowk', address: 'Bouddha Kathmandu', lat: 27.7215, lng: 85.3610 },{ name: 'Jorpati', address: 'Jorpati Kathmandu', lat: 27.7180, lng: 85.3560 },{ name: 'Gokarna Chowk', address: 'Gokarna Kathmandu', lat: 27.7280, lng: 85.3660 }] },
  { name: 'Thamel Route', code: 'RT-TH-01', direction: 'Home to School', distance: 5.0, duration: 30, stops: [{ name: 'Thamel Chowk', address: 'Thamel Kathmandu', lat: 27.7140, lng: 85.3100 },{ name: 'Lazimpat', address: 'Lazimpat Kathmandu', lat: 27.7080, lng: 85.3200 },{ name: 'Durbarmarg', address: 'Durbarmarg Kathmandu', lat: 27.6990, lng: 85.3150 }] },
  { name: 'Bhakta Durbar Route', code: 'RT-BK-01', direction: 'School to Home', distance: 6.5, duration: 38, stops: [{ name: 'Bhaktapur Durbar Sq', address: 'Bhaktapur', lat: 27.6720, lng: 85.4280 },{ name: 'Suryabinayak', address: 'Suryabinayak Bhaktapur', lat: 27.6800, lng: 85.4000 },{ name: 'Kamalbinayak', address: 'Kamalbinayak Bhaktapur', lat: 27.6700, lng: 85.4200 }] },
];

async function main() {
  console.log('Seeding database...');

  const passwordHash = await argon2.hash('Admin@123456', { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

  // 1. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@saferide.com' },
    update: {},
    create: { email: 'admin@saferide.com', passwordHash, firstName: 'Super', lastName: 'Admin', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, isEmailVerified: true },
  });
  console.log('Created super admin: ' + superAdmin.email);

  // 2. Schools
  const schoolRecords = [];
  for (const s of SCHOOLS) {
    const school = await prisma.school.upsert({
      where: { code: s.code },
      update: {},
      create: { name: s.name, code: s.code, address: s.address, phone: s.phone, email: s.email, timezone: 'Asia/Kathmandu' },
    });
    schoolRecords.push(school);
    console.log('Created school: ' + school.name);

    // School Admin per school
    const adminEmail = 'admin.' + s.code.toLowerCase() + '@saferide.com';
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, passwordHash, firstName: s.name.split(' ')[0], lastName: 'Admin', role: UserRole.SCHOOL_ADMIN, status: UserStatus.ACTIVE, schoolId: school.id, isEmailVerified: true },
    });
  }

  // 3. Drivers (10 total, split across schools)
  const allDrivers = [];
  let driverEmailCounter = 1;
  for (const dn of DRIVER_NAMES) {
    const schoolIdx = (driverEmailCounter - 1) % schoolRecords.length;
    const email = dn.first.toLowerCase() + '.' + dn.last.toLowerCase() + '.driver@saferide.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, firstName: dn.first, lastName: dn.last, role: UserRole.DRIVER, status: UserStatus.ACTIVE, schoolId: schoolRecords[schoolIdx].id, isEmailVerified: true },
    });
    const driver = await prisma.driver.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, licenseNumber: 'LIC-' + crypto.randomBytes(4).toString('hex').toUpperCase(), licenseExpiry: futureDate(randomInt(180, 730)), isAvailable: true, schoolId: schoolRecords[schoolIdx].id },
    });
    allDrivers.push({ ...driver, userId: user.id, schoolIdx, email });
    driverEmailCounter++;
  }
  console.log('Created ' + allDrivers.length + ' drivers');

  // 4. Buses (10 total, split across schools)
  const allBuses = [];
  for (let bi = 0; bi < BUSES_DATA.length; bi++) {
    const bd = BUSES_DATA[bi];
    const schoolIdx = bi % schoolRecords.length;
    const bus = await prisma.bus.upsert({
      where: { plateNumber: bd.plateNumber },
      update: {},
      create: { plateNumber: bd.plateNumber, busNumber: bd.busNumber, model: bd.model, capacity: bd.capacity, year: bd.year, color: bd.color, status: BusStatus.ACTIVE, lastGpsLat: 27.68 + Math.random() * 0.05, lastGpsLng: 85.31 + Math.random() * 0.05, lastGpsUpdate: new Date(), schoolId: schoolRecords[schoolIdx].id },
    });
    allBuses.push({ ...bus, schoolIdx });
  }
  console.log('Created ' + allBuses.length + ' buses');

  // 5. Routes with Stops (10 routes)
  const allRoutes = [];
  const allStops = [];
  for (let ri = 0; ri < ROUTES_CONFIG.length; ri++) {
    const rc = ROUTES_CONFIG[ri];
    const schoolIdx = ri % schoolRecords.length;
    const route = await prisma.route.upsert({
      where: { code: rc.code },
      update: {},
      create: { name: rc.name, code: rc.code, direction: rc.direction, distance: rc.distance, duration: rc.duration, schoolId: schoolRecords[schoolIdx].id },
    });
    allRoutes.push({ ...route, schoolIdx });

    for (let si = 0; si < rc.stops.length; si++) {
      const s = rc.stops[si];
      const stop = await prisma.stop.create({
        data: { name: s.name, address: s.address, latitude: s.lat, longitude: s.lng, schoolId: schoolRecords[schoolIdx].id },
      });
      await prisma.routeStop.create({
        data: { routeId: route.id, stopId: stop.id, sequence: si + 1, distance: si > 0 ? randomFloat(1, 3) : 0, duration: si > 0 ? randomInt(5, 12) : 0 },
      });
      allStops.push({ id: stop.id, routeId: route.id, schoolIdx });
    }
  }
  console.log('Created ' + allRoutes.length + ' routes with stops');

  // 6. Students & Parents (70 total, 35 per school)
  const allStudents = [];
  let studentCounter = 1;
  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    for (let i = 0; i < 35; i++) {
      const firstName = pick(NEPALI_FIRST);
      const lastName = pick(NEPALI_LAST);
      const grade = String(randomInt(1, 10));
      const section = pick(['A', 'B', 'C']);
      const sid = 'STU-' + String(studentCounter++).padStart(5, '0');

      const student = await prisma.student.create({
        data: {
          firstName, lastName,
          dateOfBirth: new Date((2017 - parseInt(grade)) + '-' + String(randomInt(1, 12)).padStart(2, '0') + '-' + String(randomInt(1, 28)).padStart(2, '0')),
          grade, section, studentId: sid, qrToken: sid, qrExpiresAt: futureDate(365),
          address: pick(['Baneshwor', 'Pulchowk', 'Chabahil', 'Kalimati', 'Koteshwor', 'Jawlakhel', 'Lagankhel', 'Gaushala', 'Kupondole', 'New Baneshwor']) + ', ' + pick(['Kathmandu', 'Lalitpur', 'Bhaktapur']),
          schoolId: school.id,
        },
      });

      const parentEmail = 'parent.' + sid.toLowerCase() + '@saferide.com';
      const parentUser = await prisma.user.upsert({
        where: { email: parentEmail },
        update: {},
        create: { email: parentEmail, passwordHash, firstName: pick(NEPALI_FIRST), lastName, role: UserRole.PARENT, status: UserStatus.ACTIVE, schoolId: school.id, isEmailVerified: true, phone: '+977-98' + randomInt(40000000, 99999999) },
      });
      const parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: { userId: parentUser.id, emergencyContact: Math.random() > 0.7 },
      });
      await prisma.studentParent.create({ data: { studentId: student.id, parentId: parent.id, isPrimary: true, relation: pick(['FATHER', 'MOTHER', 'GUARDIAN']) } });
      allStudents.push(student);
    }
  }
  console.log('Created ' + allStudents.length + ' students with parents');

  // 7. Assignments linking routes, drivers, buses, students
  const allAssignments = [];
  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolRoutes = allRoutes.filter(function(r) { return r.schoolIdx === si; });
    const schoolBuses = allBuses.filter(function(b) { return b.schoolIdx === si; });
    const schoolDrivers = allDrivers.filter(function(d) { return d.schoolIdx === si; });
    const schoolStudents = allStudents.filter(function(s) { return s.schoolId === school.id; });

    for (let ri = 0; ri < schoolRoutes.length; ri++) {
      const route = schoolRoutes[ri];
      const assignment = await prisma.assignment.create({
        data: { name: route.name + ' Assignment', schoolId: school.id, routeId: route.id },
      });
      allAssignments.push({ ...assignment, schoolIdx: si, routeId: route.id });

      const driver = schoolDrivers[ri % schoolDrivers.length];
      await prisma.driverAssignment.create({ data: { assignmentId: assignment.id, driverId: driver.id, isPrimary: true } });

      const bus = schoolBuses[ri % schoolBuses.length];
      await prisma.busAssignment.create({ data: { assignmentId: assignment.id, busId: bus.id, isPrimary: true } });

      const studentsPerRoute = Math.ceil(schoolStudents.length / schoolRoutes.length);
      const startIdx = ri * studentsPerRoute;
      const routeStudents = schoolStudents.slice(startIdx, startIdx + studentsPerRoute);

      const routeStops = allStops.filter(function(s) { return s.routeId === route.id && s.schoolIdx === si; });
      for (let si2 = 0; si2 < routeStudents.length; si2++) {
        const stop = routeStops[si2 % routeStops.length];
        await prisma.studentAssignment.create({
          data: { assignmentId: assignment.id, studentId: routeStudents[si2].id, stopId: stop ? stop.id : null },
        });
      }
    }
  }
  console.log('Created ' + allAssignments.length + ' assignments');

  // 8. Today's Trips
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let si = 0; si < schoolRecords.length; si++) {
    const school = schoolRecords[si];
    const schoolAssignments = allAssignments.filter(function(a) { return a.schoolIdx === si; });
    const schoolDrivers = allDrivers.filter(function(d) { return d.schoolIdx === si; });
    const schoolBuses = allBuses.filter(function(b) { return b.schoolIdx === si; });

    for (let ai = 0; ai < schoolAssignments.length; ai++) {
      const assignment = schoolAssignments[ai];
      const driver = schoolDrivers[ai % schoolDrivers.length];
      const bus = schoolBuses[ai % schoolBuses.length];
      const route = allRoutes.find(function(r) { return r.id === assignment.routeId; });

      await prisma.trip.create({
        data: {
          type: TripType.MORNING, status: TripStatus.SCHEDULED,
          scheduledAt: new Date(new Date().setHours(7, 0, 0, 0)),
          driverId: driver.userId, busId: bus.id, routeId: route.id,
          assignmentId: assignment.id, schoolId: school.id,
        },
      });
      await prisma.trip.create({
        data: {
          type: TripType.AFTERNOON, status: TripStatus.SCHEDULED,
          scheduledAt: new Date(new Date().setHours(15, 0, 0, 0)),
          driverId: driver.userId, busId: bus.id, routeId: route.id,
          assignmentId: assignment.id, schoolId: school.id,
        },
      });
    }
  }
  console.log('Created today\'s trips');

  console.log('\nSeed completed successfully!');
  console.log('');
  console.log('Default Accounts:');
  console.log('  Super Admin:  admin@saferide.com / Admin@123456');
  console.log('  Schools:      admin.srs001@saferide.com, admin.vva001@saferide.com / Admin@123456');
  console.log('  Drivers:      ram.sharma.driver@saferide.com etc. / Admin@123456');
}

main()
  .catch(function(e) {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async function() {
    await prisma.$disconnect();
  });
