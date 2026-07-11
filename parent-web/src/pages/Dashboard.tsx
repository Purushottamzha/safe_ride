import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography,
  alpha, useTheme, Fab, Tooltip,
} from '@mui/material';
import {
  AccessTime, ArrowForward, Call, DirectionsBus, EventAvailable,
  HealthAndSafety, Home, LocationOn, Map, NotificationsOutlined,
  Person, QrCode2, Route, School, Speed, Timeline, Warning,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
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
import { staggerContainer, staggerItem } from '@/utils/animations';
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
    return { label: 'On Bus', color: '#16a34a', bg: alpha('#16a34a', 0.1) };
  }
  if (status === 'late') return { label: 'Late', color: '#d97706', bg: alpha('#d97706', 0.1) };
  if (status === 'absent') return { label: 'Absent', color: '#dc2626', bg: alpha('#dc2626', 0.1) };
  return { label: 'Waiting', color: '#64748b', bg: alpha('#64748b', 0.1) };
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
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

function buildFallbackTimeline(todayStatus?: TodayStatus, activeTrip?: any) {
  return [
    { time: activeTrip?.startedAt ? formatTime(activeTrip.startedAt) : '7:30', label: 'Bus started', complete: !!activeTrip },
    { time: todayStatus?.lastScanTime ? formatTime(todayStatus.lastScanTime) : '-', label: todayStatus?.currentTripStatus === 'BOARDED' ? 'Child boarded' : 'Waiting for boarding', complete: todayStatus?.currentTripStatus === 'BOARDED' || todayStatus?.status === 'present' },
    { time: '-', label: 'Bus near school', complete: false },
    { time: '-', label: 'Child dropped', complete: todayStatus?.currentTripStatus === 'COMPLETED' },
  ];
}

function attendanceAnalytics(records: Attendance[]) {
  const total = records.length;
  const present = records.filter((record) => record.status === 'present').length;
  const late = records.filter((record) => record.isLate || record.status === 'late').length;
  return { total, present, late, attendanceRate: total ? Math.round((present / total) * 100) : 0 };
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

  const handleBusLocation = useCallback((data: BusLocationData) => {
    if (!activeTrip?.id || data.tripId === activeTrip.id) {
      setBusLocation(data);
    }
  }, [activeTrip?.id]);

  useEffect(() => {
    socketService.on('bus:location', handleBusLocation);
    return () => { socketService.off('bus:location', handleBusLocation); };
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
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 16px 100px' }}
    >
      <motion.div variants={staggerItem}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live transport summary for {student.name}
          </Typography>
        </Box>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card
          sx={{
            mb: 2.5, borderRadius: 3, overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: '#fff',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={status.label}
                    size="small"
                    sx={{ bgcolor: alpha('#ffffff', 0.2), color: '#fff', fontWeight: 800, backdropFilter: 'blur(4px)' }}
                  />
                  <Chip
                    icon={<Speed sx={{ fontSize: 14 }} />}
                    label={busLocation ? 'Live GPS' : 'Waiting...'}
                    size="small"
                    sx={{ bgcolor: alpha('#ffffff', 0.14), color: '#fff', fontWeight: 700, backdropFilter: 'blur(4px)' }}
                  />
                </Stack>
                <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1 }}>
                  {eta}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.85 }}>
                  Estimated arrival · Updates automatically with live GPS
                </Typography>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Call />}
                    href={student.driver?.phone ? `tel:${student.driver.phone}` : undefined}
                    sx={{ bgcolor: alpha('#ffffff', 0.2), color: '#fff', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: alpha('#ffffff', 0.3) } }}
                  >
                    Call Driver
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<Warning />}
                    onClick={() => navigate('/student/' + student.id + '/emergency')}
                    sx={{ backdropFilter: 'blur(4px)' }}
                  >
                    Emergency
                  </Button>
                </Stack>
              </Box>

              <Grid container spacing={1.25} sx={{ maxWidth: { md: 420 } }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#ffffff', 0.14), color: '#fff', backdropFilter: 'blur(4px)' }}>
                    <Speed fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{currentSpeed} km/h</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Current speed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#ffffff', 0.14), color: '#fff', backdropFilter: 'blur(4px)' }}>
                    <DirectionsBus fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{student.bus?.busNumber || busLocation?.busId || 'Bus'}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Assigned bus</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#ffffff', 0.14), color: '#fff', backdropFilter: 'blur(4px)' }}>
                    <Person fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{student.driver?.name || busLocation?.driverName || 'Driver'}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Driver</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#ffffff', 0.14), color: '#fff', backdropFilter: 'blur(4px)' }}>
                    <AccessTime fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatTime(todayStatus?.lastScanTime)}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Last scan</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={staggerItem}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Card sx={{ height: 340, borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', position: 'relative' }}>
                    <LiveBusMap
                      busLocation={busLocation}
                      routePath={routePath}
                      schoolPosition={[27.6855, 85.3245]}
                      studentName={student.name}
                    />
                    <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 500 }}>
                      <Chip icon={<Map />} label="Live Tracking" color="primary" sx={{ fontWeight: 800, backdropFilter: 'blur(4px)' }} />
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={2.5}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.9rem' }}>
                        <Route sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Today's Trip
                      </Typography>
                      <Stack spacing={1.5}>
                        <InfoRow icon={<School fontSize="small" />} label="Route" value={busLocation?.routeName || student.route?.name} />
                        <InfoRow icon={<Home fontSize="small" />} label="Pickup stop" value={student.stop?.name} />
                        <InfoRow icon={<LocationOn fontSize="small" />} label="Next stop" value={busLocation?.nextStopName || 'Waiting for live update'} />
                        <InfoRow icon={<DirectionsBus fontSize="small" />} label="Occupancy" value={occupancy} />
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.9rem' }}>
                        <Timeline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Route View
                      </Typography>
                      <RouteProgress stops={routeStops} direction={activeTrip?.direction === 'FROM_SCHOOL' ? 'FROM_SCHOOL' : 'TO_SCHOOL'} />
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card sx={{ mt: 2.5, borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    <Timeline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
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
                          width: 12, height: 12, borderRadius: '50%',
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
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5}>
            <motion.div variants={staggerItem}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar
                      src={student.photoUrl}
                      sx={{
                        width: 64, height: 64, bgcolor: status.color, fontWeight: 900,
                        boxShadow: `0 0 0 3px ${status.bg}`,
                      }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class {student.grade}{student.section ? ` - ${student.section}` : ''}
                      </Typography>
                      <Chip size="small" label={status.label} sx={{ mt: 0.75, color: status.color, borderColor: status.color, fontWeight: 800, bgcolor: status.bg }} variant="outlined" />
                    </Box>
                  </Stack>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <InfoRow icon={<QrCode2 fontSize="small" />} label="Student ID" value={student.studentId || student.id.slice(0, 8)} />
                    </Grid>
                    <Grid item xs={6}>
                      <InfoRow icon={<HealthAndSafety fontSize="small" />} label="QR status" value="Valid" />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoRow icon={<EventAvailable fontSize="small" />} label="Attendance" value={`${analytics.attendanceRate}% (${analytics.present}/${analytics.total} days)`} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.9rem' }}>
                    <Person sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Driver & Bus
                  </Typography>
                  <Stack spacing={1.5}>
                    <InfoRow icon={<Person fontSize="small" />} label="Driver" value={student.driver?.name || busLocation?.driverName} />
                    <InfoRow icon={<Call fontSize="small" />} label="Phone" value={student.driver?.phone} />
                    <InfoRow icon={<DirectionsBus fontSize="small" />} label="Bus number" value={student.bus?.busNumber || busLocation?.busId} />
                    <InfoRow icon={<Route fontSize="small" />} label="Today's route" value={student.route?.name || busLocation?.routeName} />
                  </Stack>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="outlined" size="small" startIcon={<Call />} href={student.driver?.phone ? `tel:${student.driver.phone}` : undefined}>
                      Call
                    </Button>
                    <Button fullWidth variant="outlined" size="small" onClick={() => navigate(`/student/${student.id}/driver`)}>
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.9rem' }}>
                    <NotificationsOutlined sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Recent Alerts
                  </Typography>
                  <Stack spacing={1.25}>
                    {(notifications?.data ?? []).slice(0, 3).map((notification) => (
                      <Box key={notification.id} sx={{ display: 'flex', gap: 1.25, p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <NotificationsOutlined fontSize="small" color={notification.isRead ? 'disabled' : 'primary'} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: notification.isRead ? 500 : 700, fontSize: '0.8rem' }}>
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(notification.createdAt)}</Typography>
                        </Box>
                      </Box>
                    ))}
                    {(notifications?.data ?? []).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                        No recent alerts
                      </Typography>
                    )}
                  </Stack>
                  <Button fullWidth size="small" variant="text" endIcon={<ArrowForward />} onClick={() => navigate('/notifications')} sx={{ mt: 1 }}>
                    View All Notifications
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card sx={{ borderRadius: 3, borderColor: alpha(theme.palette.error.main, 0.2) }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.9rem', color: 'error.main' }}>
                    <Warning sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Emergency Contacts
                  </Typography>
                  <Stack spacing={1}>
                    <Button fullWidth variant="outlined" startIcon={<Call />} href={student.driver?.phone ? `tel:${student.driver.phone}` : undefined}>
                      Call Driver
                    </Button>
                    <Button fullWidth variant="outlined" startIcon={<School />} onClick={() => navigate(`/student/${student.id}/emergency`)}>
                      School Transport Office
                    </Button>
                    <Button fullWidth variant="contained" color="error" startIcon={<Warning />} onClick={() => navigate(`/student/${student.id}/emergency`)}>
                      Emergency Help
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>

      <AnimatePresence>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1200 }}
        >
          <Tooltip title="Emergency SOS" placement="left">
            <Fab
              color="error"
              onClick={() => navigate(`/student/${student.id}/emergency`)}
              sx={{
                width: 56, height: 56,
                boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.4)}`,
              }}
            >
              <Warning sx={{ fontSize: 28 }} />
            </Fab>
          </Tooltip>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
