const { PrismaClient, TripStatus, TripType, AttendanceStatus, NotificationChannel, NotificationType, IncidentSeverity, IncidentStatus, DeliveryStatus, MaintenanceType, MaintenancePriority, ServiceStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTIF_TITLES = [
  'Bus BA 1 JA 3456 departed',
  'Student Aarav Sharma boarded',
  'Heavy traffic detected',
  'Route delayed',
  'Trip completed',
];
const INC_TITLES = [
  'Minor traffic delay',
  'Student felt unwell',
  'Road blockage',
];

async function main() {
  const schools = await prisma.school.findMany();
  const schoolId = schools[0].id;

  const students = await prisma.student.findMany({ where: { deletedAt: null, isActive: true } });
  const drivers = await prisma.driver.findMany({ include: { user: true } });
  const buses = await prisma.bus.findMany();
  const trips = await prisma.trip.findMany();
  const parents = await prisma.user.findMany({ where: { role: 'PARENT', deletedAt: null } });

  console.log(`schools=${schools.length} students=${students.length} drivers=${drivers.length} buses=${buses.length} trips=${trips.length} parents=${parents.length}`);

  // ---------- TASK 4: Demo trips ----------
  const morning = trips.filter((t) => t.type === 'MORNING');
  const afternoon = trips.filter((t) => t.type === 'AFTERNOON');
  const now = new Date();

  const setTrip = async (trip, status) => {
    const data = { status };
    if (status === 'ACTIVE' || status === 'COMPLETED') data.startedAt = new Date(now.getTime() - 30 * 60000);
    if (status === 'COMPLETED') {
      data.completedAt = new Date(now.getTime() - 5 * 60000);
      data.completedStops = trip.totalStops || 5;
      data.stopSequence = trip.totalStops || 5;
    }
    if (status === 'ACTIVE') { data.stopSequence = 2; data.completedStops = 2; }
    await prisma.trip.update({ where: { id: trip.id }, data });
  };
  for (let i = 0; i < morning.length; i++) await setTrip(morning[i], i < 3 ? 'COMPLETED' : i < 5 ? 'ACTIVE' : 'SCHEDULED');
  for (let i = 0; i < afternoon.length; i++) await setTrip(afternoon[i], i < 3 ? 'COMPLETED' : i < 5 ? 'ACTIVE' : 'SCHEDULED');

  // re-fetch fresh statuses for linking
  const freshTrips = await prisma.trip.findMany();
  const activeMorning = freshTrips.filter((t) => t.type === 'MORNING' && (t.status === 'ACTIVE' || t.status === 'COMPLETED'));
  console.log(`Trips updated. activeMorning=${activeMorning.length}`);

  // ---------- cleanup prior demo rows (idempotent) ----------
  await prisma.notification.deleteMany({ where: { title: { in: NOTIF_TITLES } } });
  await prisma.incident.deleteMany({ where: { title: { in: INC_TITLES } } });
  await prisma.maintenanceRecord.deleteMany({ where: { vendor: 'Kathmandu Auto Works' } });
  await prisma.attendance.deleteMany({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, type: TripType.MORNING } });

  // ---------- TASK 5: Demo attendance (today) ----------
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const present = students.slice(0, 62);
  const absent = students.slice(62, 66);
  const late = students.slice(66, 68);
  // students 68,69 left without records -> missed (noRecord=2)

  const makeAtt = async (stu, status, isLate, trip) => {
    const boardTime = new Date(now.getTime() - Math.floor(Math.random() * 40 + 5) * 60000);
    await prisma.attendance.create({
      data: {
        studentId: stu.id, schoolId: stu.schoolId, date: today, type: TripType.MORNING,
        status, isLate: !!isLate, lateMinutes: isLate ? Math.floor(Math.random() * 20 + 5) : 0,
        boardTime: status === AttendanceStatus.ABSENT ? null : boardTime,
        tripId: trip ? trip.id : null,
      },
    });
  };
  for (const s of present) await makeAtt(s, AttendanceStatus.PRESENT, false, activeMorning[Math.floor(Math.random() * activeMorning.length)]);
  for (const s of absent) await makeAtt(s, AttendanceStatus.ABSENT, false, null);
  for (const s of late) await makeAtt(s, AttendanceStatus.LATE, true, activeMorning[Math.floor(Math.random() * activeMorning.length)]);
  console.log(`Attendance: present=${present.length} absent=${absent.length} late=${late.length} missed=2`);

  // ---------- TASK 3: Demo notifications ----------
  const notifDefs = [
    { title: NOTIF_TITLES[0], body: 'Morning trip has started from the first stop.', type: NotificationType.TRIP_UPDATE },
    { title: NOTIF_TITLES[1], body: 'Aarav Sharma has boarded the bus successfully.', type: NotificationType.ATTENDANCE },
    { title: NOTIF_TITLES[2], body: 'Heavy traffic detected on the Kalimati route. ETA delayed by 10 minutes.', type: NotificationType.TRIP_UPDATE },
    { title: NOTIF_TITLES[3], body: 'The Pulchowk route is delayed due to road work near Chabahil.', type: NotificationType.TRIP_UPDATE },
    { title: NOTIF_TITLES[4], body: 'Afternoon trip completed successfully. All students dropped safely.', type: NotificationType.TRIP_UPDATE },
  ];
  for (let i = 0; i < notifDefs.length; i++) {
    const p = parents[i % parents.length];
    const dt = new Date(now.getTime() - (notifDefs.length - i) * 600000);
    await prisma.notification.create({
      data: {
        userId: p.id, schoolId: p.schoolId, type: notifDefs[i].type, channel: NotificationChannel.IN_APP,
        title: notifDefs[i].title, body: notifDefs[i].body,
        isRead: i > 2, readAt: i > 2 ? dt : null,
        sentAt: dt, deliveredAt: dt, deliveryStatus: DeliveryStatus.DELIVERED, createdAt: dt,
      },
    });
  }
  console.log('Notifications created: 5');

  // ---------- TASK 3: Demo incidents ----------
  const incDriver = drivers[0];
  const incBus = buses[0];
  const incTrip = activeMorning[0];
  const incidents = [
    { title: INC_TITLES[0], desc: 'Bus delayed 12 minutes due to heavy traffic near Kalimati.', sev: IncidentSeverity.LOW, status: IncidentStatus.RESOLVED },
    { title: INC_TITLES[1], desc: 'A student reported feeling unwell during the morning trip; monitored by driver.', sev: IncidentSeverity.MEDIUM, status: IncidentStatus.INVESTIGATING },
    { title: INC_TITLES[2], desc: 'Temporary road blockage on the Pulchowk route; alternate path taken.', sev: IncidentSeverity.LOW, status: IncidentStatus.REPORTED },
  ];
  for (let i = 0; i < incidents.length; i++) {
    const inc = incidents[i];
    await prisma.incident.create({
      data: {
        title: inc.title, description: inc.desc, severity: inc.sev, status: inc.status,
        reportedById: incDriver.userId, busId: incBus.id, tripId: incTrip.id,
        latitude: 27.69, longitude: 85.31, location: 'Kathmandu Route',
        resolution: inc.status === IncidentStatus.RESOLVED ? 'Resolved by driver on duty.' : null,
        resolvedAt: inc.status === IncidentStatus.RESOLVED ? new Date(now.getTime() - 600000) : null,
        resolvedById: inc.status === IncidentStatus.RESOLVED ? incDriver.userId : null,
        createdAt: new Date(now.getTime() - (incidents.length - i) * 1800000),
      },
    });
  }
  console.log('Incidents created: 3');

  // ---------- TASK 3: Demo maintenance ----------
  const maint = [
    { type: MaintenanceType.ROUTINE, desc: 'Scheduled oil change and routine servicing.', cost: 4500 },
    { type: MaintenanceType.BRAKE_SERVICE, desc: 'Brake pad inspection and replacement.', cost: 12000 },
  ];
  for (const m of maint) {
    await prisma.maintenanceRecord.create({
      data: {
        busId: buses[Math.floor(Math.random() * buses.length)].id, schoolId: schoolId,
        type: m.type, description: m.desc, priority: MaintenancePriority.MEDIUM,
        status: ServiceStatus.COMPLETED, scheduledAt: new Date(now.getTime() - 5 * 86400000),
        completedAt: new Date(now.getTime() - 3 * 86400000), cost: m.cost,
        odometer: 32000 + Math.floor(Math.random() * 1000), vendor: 'Kathmandu Auto Works',
      },
    });
  }
  console.log('Maintenance records created: 2');

  const notifCount = await prisma.notification.count();
  const incCount = await prisma.incident.count();
  const maintCount = await prisma.maintenanceRecord.count();
  const attCount = await prisma.attendance.count({ where: { date: today } });
  const activeTrips = await prisma.trip.count({ where: { status: TripStatus.ACTIVE } });
  const completedTrips = await prisma.trip.count({ where: { status: TripStatus.COMPLETED } });

  console.log('\n=== SUMMARY ===');
  console.log('notifications=' + notifCount);
  console.log('incidents=' + incCount);
  console.log('maintenance=' + maintCount);
  console.log('attendanceToday=' + attCount);
  console.log('tripsActive=' + activeTrips + ' tripsCompleted=' + completedTrips);
}

main()
  .catch((e) => { console.error('ERROR', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
