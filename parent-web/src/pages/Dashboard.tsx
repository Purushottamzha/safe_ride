import { useMemo, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleIcon from '@mui/icons-material/People';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyChildren } from '@/services/students';
import { getTodayStatus } from '@/services/attendance';
import { getActiveTrip, getTripEvents } from '@/services/trips';
import { getNotifications } from '@/services/notifications';
import { socketService } from '@/services/socket';
import RouteProgress, { type RouteStop } from '@/components/common/RouteProgress';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Student, TodayStatus } from '@/types';

interface BusLocationData {
  busId: string;
  tripId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  driverName: string;
  routeName: string;
  occupancy: number;
  capacity: number;
  eta: string;
  nextStopName: string;
  nextStopDistance: number;
  remainingDistance: number;
  stopSequence: number;
  tripStatus: string;
}

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

interface ChildWithData extends Student {
  todayStatus?: TodayStatus;
  busNumber?: string;
  driverName?: string;
  direction?: string;
  nextStop?: string;
  nextStopDistance?: number;
  remainingDistance?: number;
  speed?: number;
  occupancy?: number;
  capacity?: number;
  eta?: string;
  tripStatus?: string;
  tripId?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function GreetingIcon() {
  const hour = new Date().getHours();
  return hour < 17 ? <WbSunnyIcon sx={{ fontSize: 28 }} /> : <NightsStayIcon sx={{ fontSize: 28 }} />;
}

function getStatusColor(status?: string): string {
  if (!status) return '#94A3B8';
  if (status === 'present') return '#10B981';
  if (status === 'absent') return '#EF4444';
  if (status === 'late') return '#F59E0B';
  if (status === 'BOARDED' || status === 'IN_TRANSIT') return '#3B82F6';
  return '#94A3B8';
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { students, selectedStudentId } = useOutletContext<OutletContext>();
  const [busLocations, setBusLocations] = useState<Record<string, BusLocationData>>({});
  const [activeTimeline, setActiveTimeline] = useState<any[]>([]);

  const { data: studentsList = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
    initialData: students,
  });

  const primaryStudent = useMemo(() => {
    if (selectedStudentId) return studentsList.find((s: any) => s.id === selectedStudentId);
    return studentsList[0] as ChildWithData | undefined;
  }, [studentsList, selectedStudentId]);

  const { data: todayStatus } = useQuery({
    queryKey: ['today-status', primaryStudent?.id],
    queryFn: () => getTodayStatus(primaryStudent!.id),
    enabled: !!primaryStudent?.id,
    refetchInterval: 30000,
  });

  const { data: activeTrip } = useQuery({
    queryKey: ['active-trip', primaryStudent?.id],
    queryFn: () => getActiveTrip(primaryStudent!.id),
    enabled: !!primaryStudent?.id,
    refetchInterval: 15000,
  });

  const { data: tripEvents } = useQuery({
    queryKey: ['trip-events', activeTrip?.id],
    queryFn: () => getTripEvents(activeTrip!.id),
    enabled: !!activeTrip?.id,
    refetchInterval: 10000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', { page: 1, limit: 5 }],
    queryFn: () => getNotifications({ page: 1, limit: 5 }),
  });

  const handleBusLocation = useCallback((data: BusLocationData) => {
    setBusLocations(prev => ({ ...prev, [data.tripId]: data }));
  }, []);

  useEffect(() => {
    socketService.on('bus:location', handleBusLocation);
    return () => { socketService.off('bus:location', handleBusLocation); };
  }, [handleBusLocation]);

  useEffect(() => {
    if (tripEvents && tripEvents.length > 0) {
      setActiveTimeline(tripEvents.map((e: any) => ({
        id: e.id,
        time: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: e.scanType === 'BOARD_IN' ? 'Student Boarded' :
               e.scanType === 'EXIT_OUT' ? 'Student Exited' :
               e.type === 'TRIP_START' ? 'Trip Started' :
               e.type === 'STOP_REACHED' ? `Reached ${e.location || 'Stop'}` :
               e.type === 'TRIP_END' ? 'Trip Completed' : e.type,
        icon: e.scanType === 'BOARD_IN' ? '🎒' : e.scanType === 'EXIT_OUT' ? '🏠' : '📍',
      })));
    }
  }, [tripEvents]);

  const live = activeTrip && busLocations[activeTrip.id!];
  const hasLiveData = !!live;

  const stats = useMemo(() => {
    const list = studentsList as ChildWithData[];
    return {
      present: list.filter((s) => s.todayStatus?.status === 'present').length,
      absent: list.filter((s) => s.todayStatus?.status === 'absent').length,
      late: list.filter((s) => s.todayStatus?.status === 'late').length,
    };
  }, [studentsList]);

  if (loadingStudents) return <LoadingScreen message="Loading your dashboard..." />;
  if (!primaryStudent) return <EmptyState title="No students linked" description="Contact your school to add your children." />;

  const student = primaryStudent as ChildWithData;
  const statusColor = getStatusColor(todayStatus?.status || student.todayStatus?.status);
  const statusMsg = todayStatus?.message || student.todayStatus?.message || 'No data';

  const routeStops: RouteStop[] = activeTrip && (activeTrip as any).routePoints?.length
    ? (activeTrip as any).routePoints.map((_: any, i: number) => ({
        id: `stop-${i}`,
        name: i === 0 ? 'First Stop' : i === (activeTrip as any).routePoints.length - 1 ? 'School' : `Stop ${i}`,
        sequence: i,
        isCurrent: live ? i === live.stopSequence - 1 : false,
        isCompleted: live ? i < live.stopSequence - 1 : false,
      }))
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 24px' }}>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <GreetingIcon />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}
        </Typography>
      </motion.div>

      <AnimatePresence mode="wait">
        {hasLiveData || activeTrip ? (
          <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card sx={{
              mb: 2.5,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: '#fff',
              overflow: 'visible',
            }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Chip icon={<MyLocationIcon sx={{ fontSize: 14 }} />} label="LIVE" size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }} />
                  <Chip label={live?.tripStatus === 'ACTIVE' || live?.tripStatus === 'DRIVING_TO_PICKUP' ? 'On Time' : live?.tripStatus || activeTrip?.status || 'Scheduled'} size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DirectionsBusIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
                      {activeTrip?.busNumber || 'Bus'} is on the way
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.25 }}>
                      ETA: {live?.eta || 'Calculating...'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { icon: <SpeedIcon sx={{ fontSize: 16 }} />, label: `${Math.round(live?.speed ?? 0)} km/h` },
                    { icon: <PeopleIcon sx={{ fontSize: 16 }} />, label: `${live?.occupancy ?? 0}/${live?.capacity ?? 40}` },
                    { icon: <RouteIcon sx={{ fontSize: 16 }} />, label: `${Math.round((live?.remainingDistance ?? 0) / 1000)} km left` },
                    { icon: <AccessTimeIcon sx={{ fontSize: 16 }} />, label: live?.eta || '' },
                  ].filter(l => l.label).map((stat, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 1.25, py: 0.5 }}>
                      {stat.icon}
                      <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.95 }}>{stat.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {hasLiveData && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, p: 1.25 }}>
                    <LocationOnIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      Next stop: {live!.nextStopName} ({Math.round(live!.nextStopDistance)}m)
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
                  <Button fullWidth variant="contained" size="small" endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/bus-tracking')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, backdropFilter: 'blur(4px)', fontWeight: 700 }}>
                    Track Live
                  </Button>
                  <Button fullWidth variant="outlined" size="small" onClick={() => navigate(`/student/${student.id}`)}
                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.08)' }, fontWeight: 600 }}>
                    View Journey
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {routeStops.length > 0 && (
              <Card sx={{ mb: 2.5, borderRadius: 3 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Route Progress</Typography>
                  <RouteProgress stops={routeStops} direction={activeTrip?.direction === 'FROM_SCHOOL' ? 'FROM_SCHOOL' : 'TO_SCHOOL'} />
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Card sx={{ mb: 2.5, borderRadius: 3, borderLeft: `4px solid ${statusColor}` }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Avatar src={student.photoUrl} sx={{ width: 44, height: 44, bgcolor: 'primary.light', fontSize: '1rem', fontWeight: 700 }}>
              {student.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>{student.name}</Typography>
              <Typography variant="caption" color="text.secondary">{student.grade}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: `${statusColor}12`, px: 1.25, py: 0.5, borderRadius: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: statusColor }}>{statusMsg}</Typography>
            </Box>
          </Box>
          {!hasLiveData && !activeTrip && (
            <Button fullWidth variant="outlined" size="small" endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`/student/${student.id}`)} sx={{ mt: 0.5 }}>
              View Today's Timeline
            </Button>
          )}
        </CardContent>
      </Card>

      {studentsList.length > 1 && (
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>{stats.present}</Typography>
              <Typography variant="caption" color="text.secondary">Present</Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>{stats.late}</Typography>
              <Typography variant="caption" color="text.secondary">Late</Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#EF4444' }}>{stats.absent}</Typography>
              <Typography variant="caption" color="text.secondary">Absent</Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTimeline.length > 0 && (
        <Card sx={{ mb: 2.5, borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Today's Timeline</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activeTimeline.slice(-6).map((event, idx) => (
                <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ minWidth: 40, fontWeight: 600, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.6rem' }}>
                      {event.time}
                    </Typography>
                    <Box sx={{ width: 2, height: 28, bgcolor: 'primary.light', borderRadius: 1 }} />
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{event.icon}</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{event.label}</Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {notifData && notifData.data.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={700}>Recent Alerts</Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/notifications')} sx={{ fontSize: '0.7rem' }}>See All</Button>
            </Box>
            {notifData.data.slice(0, 3).map((notif: any) => (
              <Box key={notif.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', opacity: notif.isRead ? 0.6 : 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: notif.isRead ? 'transparent' : 'primary.main', mt: 0.5, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: notif.isRead ? 400 : 600, fontSize: '0.8125rem' }}>{notif.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(notif.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {!hasLiveData && !activeTrip && activeTimeline.length === 0 && (!notifData || notifData.data.length === 0) && (
        <EmptyState title="No activity today" description="Your child's trip activity will appear here once the school day starts." />
      )}
    </motion.div>
  );
}
