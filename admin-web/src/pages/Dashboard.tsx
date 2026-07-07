import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Button, Alert,
  Chip, Tooltip,
} from '@mui/material';
import {
  PeopleAlt, AirportShuttle, DirectionsBus, Map, TrendingUp,
  Refresh, AccessTime, Speed, Warning,
  NotificationsActive, Download, Timeline,
  CheckCircle, RadioButtonChecked,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import LiveBusMap from '../components/common/LiveBusMap';
import SimulatorPanel from '../components/simulator/SimulatorPanel';
import { dashboardService } from '../services/dashboard';
import { socketService, type BusLocation, type EmergencyAlert } from '../services/socket';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8'];

interface TimelineEvent {
  id: string;
  type: 'bus_location' | 'trip_status' | 'emergency' | 'stop_reached';
  icon: string;
  label: string;
  detail: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

function getStatusColor(status: string): string {
  if (status === 'ACTIVE' || status === 'DRIVING_TO_PICKUP' || status === 'DRIVING_TO_SCHOOL') return '#22c55e';
  if (status === 'DELAYED') return '#f59e0b';
  if (status === 'STOPPED' || status === 'WAITING_AT_STOP') return '#3b82f6';
  return '#94a3b8';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [liveBuses, setLiveBuses] = useState(0);
  const [delayedTrips, setDelayedTrips] = useState(0);
  const [sosAlerts, setSosAlerts] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [busStatuses, setBusStatuses] = useState<Record<string, { status: string; routeName: string; speed: number; occupancy: number; capacity: number }>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const eventCounter = useRef(0);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 15000,
  });

  const addTimelineEvent = useCallback((ev: TimelineEvent) => {
    setTimeline(prev => {
      const next = [ev, ...prev];
      return next.slice(0, 100);
    });
  }, []);

  useEffect(() => {
    let delayedCount = 0;
    let sosCount = 0;

    const unsubLocation = socketService.onBusLocation((data: BusLocation) => {
      setBusStatuses(prev => ({
        ...prev,
        [data.busId]: { status: data.tripStatus, routeName: data.routeName, speed: data.speed, occupancy: data.occupancy, capacity: data.capacity },
      }));
      setLiveBuses(prev => prev + 1);

      eventCounter.current++;
      if (eventCounter.current % 5 === 0) {
        addTimelineEvent({
          id: `loc-${Date.now()}`,
          type: 'bus_location',
          icon: '🚌',
          label: `${data.routeName}`,
          detail: `${data.driverName} — speed: ${Math.round(data.speed)} km/h | next: ${data.nextStopName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          severity: data.speed > 60 ? 'warning' : 'info',
        });
      }
    });

    const unsubTripStatus = socketService.onTripStatus((data) => {
      addTimelineEvent({
        id: `trip-${Date.now()}`,
        type: 'trip_status',
        icon: data.status === 'COMPLETED' ? '✅' : data.status === 'ACTIVE' ? '🟢' : '🔄',
        label: `Trip ${data.status}`,
        detail: `${data.notes || data.tripId.slice(0, 8)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: data.status === 'COMPLETED' ? 'success' : 'info',
      });
    });

    const unsubEmergency = socketService.onEmergencyAlert((alert: EmergencyAlert) => {
      if (alert.type === 'SOS') { sosCount++; setSosAlerts(sosCount); }
      if (alert.type === 'DELAY') { delayedCount++; setDelayedTrips(delayedCount); }
      addTimelineEvent({
        id: `emergency-${Date.now()}`,
        type: 'emergency',
        icon: alert.type === 'SOS' ? '🆘' : '⏰',
        label: alert.type === 'SOS' ? 'SOS Alert' : 'Trip Delayed',
        detail: alert.message || `Trip ${alert.tripId.slice(0, 8)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: alert.type === 'SOS' ? 'error' : 'warning',
      });
    });

    return () => { unsubLocation(); unsubTripStatus(); unsubEmergency(); };
  }, [addTimelineEvent]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = 0;
    }
  }, [timeline]);

  const totalStudents = stats?.totalStudents ?? 0;
  const activeDrivers = stats?.totalDrivers ?? 0;
  const activeTrips = stats?.activeTrips ?? 0;
  const att = stats?.todayAttendance ?? { present: 0, absent: 0, late: 0, total: 0 };
  const attendancePercent = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
  const pendingIncidents = stats?.pendingIncidents ?? 0;
  const activeBusCount = Object.keys(busStatuses).length;

  const fleetStatus = activeBusCount > 0 && delayedTrips === 0 && sosAlerts === 0 ? 'All operations nominal' :
    delayedTrips > 0 && sosAlerts === 0 ? `${delayedTrips} trip(s) delayed` :
    sosAlerts > 0 ? `${sosAlerts} SOS alert(s) active` : 'No active bus data';

  const fleetSeverity = sosAlerts > 0 ? 'error' : delayedTrips > 0 ? 'warning' : 'success';

  const statCards = [
    { key: 'students', title: 'Total Students', value: totalStudents, icon: <PeopleAlt />, color: '#2563eb', link: '/students' },
    { key: 'activeTrips', title: 'Active Trips', value: activeTrips, icon: <Map />, color: '#f59e0b', link: '/trips' },
    { key: 'drivers', title: 'Available Drivers', value: activeDrivers, icon: <AirportShuttle />, color: '#7c3aed', link: '/drivers' },
    { key: 'running', title: 'Buses Running', value: activeBusCount, icon: <DirectionsBus />, color: '#0ea5e9', link: '/buses' },
    { key: 'delayed', title: 'Delayed Trips', value: delayedTrips, icon: <AccessTime />, color: '#f97316' },
    { key: 'attendance', title: "Today's Attendance", value: attendancePercent, suffix: '%', icon: <TrendingUp />, color: '#22c55e', link: '/attendance' },
    { key: 'sos', title: 'SOS Alerts', value: sosAlerts, icon: <Warning />, color: '#ef4444' },
  ];

  const pieData = [
    { name: 'Present', value: att.present },
    { name: 'Absent', value: att.absent },
    { name: 'Late', value: att.late },
    { name: 'Unmarked', value: Math.max(0, (stats?.totalStudents ?? 0) - att.total) },
  ];

  const weeklyData = stats?.weeklyAttendance ?? [];

  if (error) {
    return (
      <Box>
        <PageHeader title="Dashboard" subtitle="Operations Control Center" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load dashboard data
        </Alert>
      </Box>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Fleet Operations Center"
        subtitle="Real-time fleet monitoring and management"
        actions={[
          { label: 'Reports', onClick: () => navigate('/reports'), variant: 'outlined', icon: <Download /> },
          { label: pendingIncidents > 0 ? `${pendingIncidents} Incidents` : 'All Clear', onClick: () => navigate('/incidents'), variant: 'contained', icon: <NotificationsActive /> },
        ]}
      />

      <AnimatePresence>
        {activeBusCount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert
              severity={fleetSeverity}
              icon={fleetSeverity === 'success' ? <CheckCircle /> : fleetSeverity === 'warning' ? <AccessTime /> : <Warning />}
              sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}
              action={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip icon={<DirectionsBus />} label={`${activeBusCount} live`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                  <Chip icon={<Speed />} label={`${liveBuses} updates/min`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>
              }
            >
              {fleetStatus}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={4} md={3} lg={1.71} key={card.key}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  cursor: card.link ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': card.link ? { transform: 'translateY(-3px)', boxShadow: 6 } : {},
                }}
                onClick={() => card.link && navigate(card.link)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ color: card.color }}>{card.icon}</Box>
                    <Chip
                      label={card.key === 'sos' && sosAlerts > 0 ? `ALERT` : card.key === 'delayed' && delayedTrips > 0 ? `${delayedTrips}` : 'OK'}
                      size="small"
                      color={card.key === 'sos' && sosAlerts > 0 ? 'error' : card.key === 'delayed' && delayedTrips > 0 ? 'warning' : 'success'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {isLoading ? <Skeleton width={60} /> : <AnimatedCounter value={card.value as number} suffix={card.suffix || ''} />}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    <Map sx={{ fontSize: 18, mr: 0.75, verticalAlign: 'middle' }} />
                    Live Fleet Tracking
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {Object.entries(busStatuses).slice(0, 4).map(([busId, bs]) => (
                      <Tooltip key={busId} title={`${bs.routeName} (${bs.status})`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getStatusColor(bs.status) }} />
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontFamily: 'monospace' }}>{busId.slice(0, 4)}</Typography>
                        </Box>
                      </Tooltip>
                    ))}
                    <Chip icon={<RadioButtonChecked sx={{ fontSize: 14 }} />} label={`${activeBusCount} active`} color="primary" size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                </Box>
                <LiveBusMap height={420} />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div variants={itemVariants}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    <Timeline sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Live Event Feed
                  </Typography>
                  <Chip label={`${timeline.length} events`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                </Box>
                <Box ref={timelineRef} sx={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {timeline.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No live events yet.<br />Start the simulator.
                      </Typography>
                    </Box>
                  )}
                  <AnimatePresence initial={false}>
                    {timeline.map((ev) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          p: 0.75,
                          borderRadius: 1.5,
                          bgcolor: ev.severity === 'error' ? '#fef2f2' :
                                   ev.severity === 'warning' ? '#fffbeb' :
                                   ev.type === 'stop_reached' ? '#f0fdf4' : 'transparent',
                          borderLeft: ev.severity === 'error' ? '3px solid #ef4444' :
                                      ev.severity === 'warning' ? '3px solid #f59e0b' :
                                      ev.type === 'stop_reached' ? '3px solid #22c55e' : '3px solid transparent',
                        }}>
                          <Typography variant="caption" sx={{ minWidth: 56, fontFamily: 'monospace', fontSize: '0.55rem', color: 'text.secondary', mt: 0.25 }}>
                            {ev.timestamp}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{ev.icon}</Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3 }} noWrap>
                              {ev.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }} noWrap>
                              {ev.detail}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <SimulatorPanel />
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <motion.div variants={itemVariants}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
                  Weekly Attendance Overview
                </Typography>
                {isLoading ? (
                  <Skeleton variant="rounded" height={300} />
                ) : weeklyData.length === 0 ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No attendance data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData} barSize={24} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <RechartTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
                      Today's Attendance
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Box sx={{ width: 140, height: 140 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData.filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              dataKey="value"
                            >
                              {pieData.filter(d => d.value > 0).map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        {pieData.map((d, i) => (
                          <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i] }} />
                              <Typography variant="body2">{d.name}</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={600}>{d.value}</Typography>
                          </Box>
                        ))}
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Button variant="text" size="small" onClick={() => navigate('/attendance')}>
                            View Full Attendance
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
                      Recent Activity
                    </Typography>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} variant="text" sx={{ mb: 1.5 }} />
                      ))
                    ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {stats.recentActivity.slice(0, 5).map((activity: any) => (
                          <Box
                            key={activity.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: 'grey.50',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'grey.100' },
                            }}
                            onClick={() => activity.tripId && navigate(`/trips/${activity.tripId}`)}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: activity.scanType === 'BOARD_IN' ? '#dcfce7' : '#fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: activity.scanType === 'BOARD_IN' ? '#16a34a' : '#d97706',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {activity.scanType === 'BOARD_IN' ? 'B' : 'E'}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {activity.student?.firstName} {activity.student?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.createdAt).toLocaleTimeString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={activity.scanType === 'BOARD_IN' ? 'Boarded' : 'Exited'}
                              size="small"
                              color={activity.scanType === 'BOARD_IN' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </motion.div>
  );
}
