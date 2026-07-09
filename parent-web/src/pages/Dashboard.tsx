import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccessTime,
  ArrowForward,
  CalendarMonth,
  Call,
  DirectionsBus,
  EventAvailable,
  FamilyRestroom,
  HealthAndSafety,
  Home,
  LocationOn,
  Map,
  NotificationsOutlined,
  Person,
  QrCode2,
  ReportProblem,
  Route,
  School,
  Speed,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyChildren } from '@/services/students';
import { getStudentAttendance, getTodayStatus } from '@/services/attendance';
import { getActiveTrip, getTripEvents } from '@/services/trips';
import { getNotifications } from '@/services/notifications';
import { socketService } from '@/services/socket';
import LiveBusMap, { type BusLocationData } from '@/components/common/LiveBusMap';
import RouteProgress, { type RouteStop } from '@/components/common/RouteProgress';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Attendance, Student, TodayStatus } from '@/types';

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function statusMeta(status?: TodayStatus['status'] | string) {
  if (status === 'present' || status === 'BOARDED' || status === 'IN_TRANSIT') {
    return { label: 'On Bus', color: '#16a34a' };
  }
  if (status === 'late') return { label: 'Late', color: '#d97706' };
  if (status === 'absent') return { label: 'Absent', color: '#dc2626' };
  return { label: 'Waiting', color: '#64748b' };
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', mt: 0.2 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 800 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function buildFallbackTimeline(todayStatus?: TodayStatus, activeTrip?: any) {
  const events = [
    {
      time: activeTrip?.startedAt ? formatTime(activeTrip.startedAt) : '7:30',
      label: 'Bus started',
      complete: !!activeTrip,
    },
    {
      time: todayStatus?.lastScanTime ? formatTime(todayStatus.lastScanTime) : '-',
      label: todayStatus?.currentTripStatus === 'BOARDED' ? 'Child boarded' : 'Waiting for boarding',
      complete: todayStatus?.currentTripStatus === 'BOARDED' || todayStatus?.status === 'present',
    },
    {
      time: '-',
      label: 'Bus near school',
      complete: false,
    },
    {
      time: '-',
      label: 'Child dropped',
      complete: todayStatus?.currentTripStatus === 'COMPLETED',
    },
  ];

  return events;
}

function attendanceAnalytics(records: Attendance[]) {
  const total = records.length;
  const present = records.filter((record) => record.status === 'present').length;
  const late = records.filter((record) => record.isLate || record.status === 'late').length;
  return {
    total,
    present,
    late,
    attendanceRate: total ? Math.round((present / total) * 100) : 0,
  };
}

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { students, selectedStudentId } = useOutletContext<OutletContext>();
  const [busLocation, setBusLocation] = useState<BusLocationData | undefined>();

  const { data: studentsList = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
    initialData: students,
  });

  const student = useMemo(() => {
    if (selectedStudentId) return studentsList.find((item) => item.id === selectedStudentId);
    return studentsList[0];
  }, [selectedStudentId, studentsList]);

  const { data: todayStatus } = useQuery({
    queryKey: ['today-status', student?.id],
    queryFn: () => getTodayStatus(student!.id),
    enabled: !!student?.id,
    refetchInterval: 30000,
  });

  const { data: activeTrip } = useQuery({
    queryKey: ['active-trip', student?.id],
    queryFn: () => getActiveTrip(student!.id),
    enabled: !!student?.id,
    refetchInterval: 15000,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-history', student?.id, 'dashboard'],
    queryFn: () => getStudentAttendance(student!.id, { limit: 30 }),
    enabled: !!student?.id,
  });

  const { data: tripEvents = [] } = useQuery({
    queryKey: ['trip-events', activeTrip?.id],
    queryFn: () => getTripEvents(activeTrip!.id),
    enabled: !!activeTrip?.id,
    refetchInterval: 10000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications', { page: 1, limit: 5 }],
    queryFn: () => getNotifications({ page: 1, limit: 5 }),
  });

  const handleBusLocation = useCallback(
    (data: BusLocationData) => {
      if (!activeTrip?.id || data.tripId === activeTrip.id) {
        setBusLocation(data);
      }
    },
    [activeTrip?.id],
  );

  useEffect(() => {
    socketService.on('bus:location', handleBusLocation);
    return () => {
      socketService.off('bus:location', handleBusLocation);
    };
  }, [handleBusLocation]);

  if (loadingStudents) return <LoadingScreen message="Loading parent dashboard..." />;
  if (!student) return <EmptyState title="No students linked" description="Contact your school to add your children." />;

  const status = statusMeta(todayStatus?.status || student.todayStatus?.status || activeTrip?.status);
  const attendanceRecords = attendanceData?.data ?? [];
  const analytics = attendanceAnalytics(attendanceRecords);
  const currentSpeed = Math.round(busLocation?.speed ?? 0);
  const occupancy = `${busLocation?.occupancy ?? 0} / ${busLocation?.capacity ?? 45}`;
  const eta = busLocation?.eta || 'Calculating';
  const routePath = activeTrip?.routePoints ?? [];
  const routeStops: RouteStop[] = routePath.length
    ? routePath.map((_, index) => ({
        id: `route-${index}`,
        name: index === 0 ? student.stop?.name || 'Pickup Stop' : index === routePath.length - 1 ? 'School' : `Stop ${index + 1}`,
        sequence: index + 1,
        isCurrent: busLocation ? index + 1 === busLocation.stopSequence : index === 0,
        isCompleted: busLocation ? index + 1 < busLocation.stopSequence : false,
      }))
    : [
        { id: 'pickup', name: student.stop?.name || 'Pickup Stop', sequence: 1, isCurrent: !busLocation, isCompleted: !!busLocation },
        { id: 'school', name: student.school || 'School', sequence: 2, isCurrent: !!busLocation, isCompleted: false },
      ];

  const timeline = tripEvents.length
    ? tripEvents.slice(-4).map((event) => ({
        time: formatTime(event.timestamp),
        label: event.type === 'BOARD_IN' ? 'Child boarded' : event.type === 'EXIT_OUT' ? 'Child dropped' : event.type,
        complete: true,
      }))
    : buildFallbackTimeline(todayStatus, activeTrip);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 16px 28px' }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
            {getGreeting()}, {user?.name || 'Parent'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live transport summary for {student.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" startIcon={<Call />} href={student.driver?.phone ? `tel:${student.driver.phone}` : undefined}>
            Call Driver
          </Button>
          <Button variant="contained" startIcon={<ReportProblem />} onClick={() => navigate('/profile')}>
            Emergency
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              mb: 2.5,
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: '#fff',
            }}
          >
            <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={status.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800 }} />
                    <Chip label={busLocation ? 'Live GPS' : 'Waiting for GPS'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.8rem' }, lineHeight: 1 }}>
                    {eta}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.9 }}>
                    Bus arriving estimate. Updates automatically when GPS data is received.
                  </Typography>
                </Box>

                <Grid container spacing={1.25} sx={{ maxWidth: { md: 420 } }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                      <Speed fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{currentSpeed} km/h</Typography>
                      <Typography variant="caption">Current speed</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                      <DirectionsBus fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{student.bus?.busNumber || 'Bus'}</Typography>
                      <Typography variant="caption">Assigned bus</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                      <Person fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{student.driver?.name || 'Driver'}</Typography>
                      <Typography variant="caption">Driver</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatTime(todayStatus?.lastScanTime)}</Typography>
                      <Typography variant="caption">Last scan</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ height: 380, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', position: 'relative' }}>
                  <LiveBusMap
                    busLocation={busLocation}
                    routePath={routePath}
                    schoolPosition={[27.6855, 85.3245]}
                    studentName={student.name}
                  />
                  <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 500 }}>
                    <Chip icon={<Map />} label="Live Tracking" color="primary" sx={{ fontWeight: 800 }} />
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={2.5}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Today's Trip
                    </Typography>
                    <Stack spacing={1.75}>
                      <InfoRow icon={<School fontSize="small" />} label="Route" value={busLocation?.routeName || student.route?.name} />
                      <InfoRow icon={<Home fontSize="small" />} label="Pickup stop" value={student.stop?.name} />
                      <InfoRow icon={<LocationOn fontSize="small" />} label="Next stop" value={busLocation?.nextStopName || 'Waiting for live update'} />
                      <InfoRow icon={<DirectionsBus fontSize="small" />} label="Occupancy" value={occupancy} />
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Route View
                    </Typography>
                    <RouteProgress stops={routeStops} direction={activeTrip?.direction === 'FROM_SCHOOL' ? 'FROM_SCHOOL' : 'TO_SCHOOL'} />
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          <Card sx={{ mt: 2.5, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Trip Timeline
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate(`/student/${student.id}/trips`)}>
                  History
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {timeline.map((event, index) => (
                  <Box key={`${event.label}-${index}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ width: 52, fontWeight: 800, color: 'text.secondary' }}>
                      {event.time}
                    </Typography>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: event.complete ? 'success.main' : 'grey.300',
                        boxShadow: event.complete ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.14)}` : 'none',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar src={student.photoUrl} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 900 }}>
                    {student.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Class {student.grade}{student.section ? ` - Section ${student.section}` : ''}
                    </Typography>
                    <Chip
                      size="small"
                      label={status.label}
                      sx={{ mt: 0.75, color: status.color, borderColor: status.color, fontWeight: 800 }}
                      variant="outlined"
                    />
                  </Box>
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <InfoRow icon={<QrCode2 fontSize="small" />} label="Student ID" value={student.studentId || student.id.slice(0, 8)} />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow icon={<HealthAndSafety fontSize="small" />} label="QR status" value="Valid" />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow icon={<FamilyRestroom fontSize="small" />} label="Guardian" value={user?.name} />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow icon={<EventAvailable fontSize="small" />} label="Attendance" value={`${analytics.attendanceRate}%`} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Driver and Bus
                </Typography>
                <Stack spacing={1.75}>
                  <InfoRow icon={<Person fontSize="small" />} label="Driver" value={student.driver?.name || busLocation?.driverName} />
                  <InfoRow icon={<Call fontSize="small" />} label="Phone" value={student.driver?.phone} />
                  <InfoRow icon={<DirectionsBus fontSize="small" />} label="Bus number" value={student.bus?.busNumber || busLocation?.busId} />
                  <InfoRow icon={<Route fontSize="small" />} label="Today's route" value={student.route?.name || busLocation?.routeName} />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Parent Analytics
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Metric label="Attendance" value={`${analytics.attendanceRate}%`} icon={<CalendarMonth fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6}>
                    <Metric label="Late count" value={analytics.late} icon={<AccessTime fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6}>
                    <Metric label="Trips" value={analytics.total} icon={<Timeline fontSize="small" />} />
                  </Grid>
                  <Grid item xs={6}>
                    <Metric label="Present" value={analytics.present} icon={<EventAvailable fontSize="small" />} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Notifications
                  </Typography>
                  <Button size="small" onClick={() => navigate('/notifications')}>See all</Button>
                </Stack>
                <Stack spacing={1.25}>
                  {(notifications?.data ?? []).slice(0, 4).map((notification) => (
                    <Box key={notification.id} sx={{ display: 'flex', gap: 1.25 }}>
                      <NotificationsOutlined fontSize="small" color={notification.isRead ? 'disabled' : 'primary'} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: notification.isRead ? 500 : 800 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {(notifications?.data ?? []).length === 0 && (
                    <Alert severity="info">No notifications yet. Boarding and drop-off alerts will appear here.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Emergency Contacts
                </Typography>
                <Stack spacing={1}>
                  <Button fullWidth variant="outlined" startIcon={<Call />} href={student.driver?.phone ? `tel:${student.driver.phone}` : undefined}>
                    Call Driver
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<School />}>
                    School Transport Office
                  </Button>
                  <Button fullWidth variant="contained" color="error" startIcon={<ReportProblem />}>
                    Emergency Help
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </motion.div>
  );
}
