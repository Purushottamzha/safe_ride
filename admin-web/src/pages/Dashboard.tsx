import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Avatar, alpha,
  Stack, useTheme, IconButton, Tooltip, Divider, List, ListItem, ListItemText, AvatarGroup,
} from '@mui/material';
import {
  PeopleAlt, DirectionsBus, Map, TrendingUp, Refresh, AccessTime, Speed, Warning,
  NotificationsActive, CheckCircle, RadioButtonChecked, Timeline, School,
  LocationOn, Person, ReportProblem, BuildCircle, Cloud, Traffic, WaterDrop,
  Celebration, Groups, WifiOff, MoreHoriz, ArrowForward, MyLocation,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import KpiCard from '../components/common/KpiCard';
import GlassCard from '../components/common/GlassCard';
import AlertBanner from '../components/common/AlertBanner';
import StatusChip from '../components/common/StatusChip';
import LiveBusMap from '../components/common/LiveBusMap';
import SimulatorPanel from '../components/simulator/SimulatorPanel';
import SosButton from '../components/common/SosButton';
import { dashboardService } from '../services/dashboard';
import { socketService, type BusLocation, type EmergencyAlert } from '../services/socket';
import { staggerContainer, staggerItem } from '../utils/animations';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8'];

interface TimelineEvent {
  id: string;
  type: 'bus_location' | 'trip_status' | 'emergency' | 'stop_reached' | 'notification';
  label: string;
  detail: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  avatar?: string;
  initials?: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getStatusColor(status: string): string {
  if (['ACTIVE', 'DRIVING_TO_PICKUP', 'DRIVING_TO_SCHOOL'].includes(status)) return '#22c55e';
  if (status === 'DELAYED') return '#f59e0b';
  if (['STOPPED', 'WAITING_AT_STOP', 'BOARDING'].includes(status)) return '#3b82f6';
  return '#94a3b8';
}

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const [liveBuses, setLiveBuses] = useState(0);
  const [delayedTrips, setDelayedTrips] = useState(0);
  const [sosAlerts, setSosAlerts] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [busStatuses, setBusStatuses] = useState<Record<string, {
    status: string; routeName: string; speed: number; occupancy: number; capacity: number; driverName: string;
  }>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const eventCounter = useRef(0);
  const updateTimestamps = useRef<number[]>([]);
  const lastSeenRef = useRef<Record<string, number>>({});
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 15000,
  });

  const addTimelineEvent = useCallback((ev: TimelineEvent) => {
    setTimeline(prev => [ev, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    let delayedCount = 0;
    let sosCount = 0;

    const unsubLocation = socketService.onBusLocation((data: BusLocation) => {
      const now = Date.now();
      lastSeenRef.current[data.busId] = now;
      updateTimestamps.current = [...updateTimestamps.current.filter(t => now - t < 60000), now];
      setLiveBuses(updateTimestamps.current.length);
      setBusStatuses(prev => ({
        ...prev,
        [data.busId]: {
          status: data.tripStatus, routeName: data.routeName, speed: data.speed,
          occupancy: data.occupancy, capacity: data.capacity, driverName: data.driverName,
        },
      }));

      eventCounter.current++;
      if (eventCounter.current % 3 === 0) {
        addTimelineEvent({
          id: `loc-${Date.now()}`,
          type: 'bus_location',
          label: `${data.routeName}`,
          detail: `${data.driverName} · ${Math.round(data.speed)} km/h · next: ${data.nextStopName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: data.speed > 60 ? 'warning' : 'info',
          initials: data.driverName?.split(' ').map((n: string) => n[0]).join('') || 'D',
        });
      }
    });

    const unsubTripStatus = socketService.onTripStatus((data) => {
      addTimelineEvent({
        id: `trip-${Date.now()}`,
        type: 'trip_status',
        label: `Trip ${data.status}`,
        detail: data.notes || `Trip ID: ${data.tripId.slice(0, 8)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: data.status === 'COMPLETED' ? 'success' : data.status === 'ACTIVE' ? 'info' : 'warning',
      });
    });

    const unsubEmergency = socketService.onEmergencyAlert((alert: EmergencyAlert) => {
      if (alert.type === 'SOS') { sosCount++; setSosAlerts(sosCount); }
      if (alert.type === 'DELAY') { delayedCount++; setDelayedTrips(delayedCount); }
      addTimelineEvent({
        id: `emergency-${Date.now()}`,
        type: 'emergency',
        label: alert.type === 'SOS' ? 'SOS Alert' : 'Trip Delayed',
        detail: alert.message || `Trip ${alert.tripId.slice(0, 8)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: alert.type === 'SOS' ? 'error' : 'warning',
      });
    });

    return () => { unsubLocation(); unsubTripStatus(); unsubEmergency(); };
  }, [addTimelineEvent]);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollTop = 0;
  }, [timeline]);

  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 300000;
      setBusStatuses(prev => {
        const stale = Object.keys(prev).filter(id => (lastSeenRef.current[id] || 0) < cutoff);
        if (stale.length === 0) return prev;
        const next = { ...prev };
        stale.forEach(id => { delete next[id]; });
        return next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalStudents = stats?.totalStudents ?? 0;
  const activeDrivers = stats?.totalDrivers ?? 0;
  const activeTrips = stats?.activeTrips ?? 0;
  const att = stats?.todayAttendance ?? { present: 0, absent: 0, late: 0, total: 0 };
  const attendancePercent = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
  const pendingIncidents = stats?.pendingIncidents ?? 0;
  const activeBusCount = Object.keys(busStatuses).length;

  const fleetSeverity = sosAlerts > 0 ? 'error' : delayedTrips > 0 ? 'warning' : 'success';
  const absentDrivers = Math.max(0, activeDrivers - activeBusCount);
  const onboardCount = Object.values(busStatuses).reduce((sum, b) => sum + b.occupancy, 0);

  const weeklyData = stats?.weeklyAttendance ?? [];

  const busUtilizationData = [
    { name: 'Mon', active: 8, idle: 2, maintenance: 1 },
    { name: 'Tue', active: 9, idle: 1, maintenance: 1 },
    { name: 'Wed', active: 7, idle: 3, maintenance: 1 },
    { name: 'Thu', active: 10, idle: 0, maintenance: 1 },
    { name: 'Fri', active: 8, idle: 2, maintenance: 0 },
    { name: 'Sat', active: 6, idle: 3, maintenance: 2 },
  ];

  const driverStatusData = [
    { name: 'On Duty', value: activeBusCount, color: '#22c55e' },
    { name: 'Available', value: Math.max(0, activeDrivers - activeBusCount), color: '#3b82f6' },
    { name: 'Off Duty', value: 3, color: '#94a3b8' },
    { name: 'Absent', value: absentDrivers > 0 ? absentDrivers : 1, color: '#ef4444' },
  ];

  return (
    <Box>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <PageHeader
          title={`${getGreeting()}, Admin`}
          subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          actions={[
            { label: 'Refresh', icon: <Refresh />, variant: 'outlined', onClick: () => refetch() },
            { label: simulatorOpen ? 'Hide Simulator' : 'Simulator', icon: <BuildCircle />, variant: 'outlined', onClick: () => setSimulatorOpen(!simulatorOpen) },
            {
              label: pendingIncidents > 0 ? `${pendingIncidents} Incidents` : 'All Clear',
              icon: <NotificationsActive />,
              variant: 'contained',
              color: pendingIncidents > 0 ? 'error' : 'primary',
              onClick: () => navigate('/incidents'),
            },
          ]}
        />

        <AnimatePresence>
          {sosAlerts > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <AlertBanner
                type="error"
                message={`${sosAlerts} SOS Alert(s) Active`}
                details="Immediate attention required. Tap to view incident details."
                action={{ label: 'View Incidents', onClick: () => navigate('/incidents') }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {simulatorOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Box sx={{ mb: 3 }}>
                <SimulatorPanel />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
            Operations Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Active Buses" value={activeBusCount} icon={<DirectionsBus />} color="#2563eb"
                  onClick={() => navigate('/buses')} subtitle="on road" />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Students Onboard" value={onboardCount} icon={<PeopleAlt />} color="#7c3aed"
                  onClick={() => navigate('/students')} />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Delayed Routes" value={delayedTrips} icon={<AccessTime />} color="#f59e0b"
                  onClick={() => navigate('/trips')} trend={delayedTrips > 0 ? { value: delayedTrips, isPositive: false, label: 'need attention' } : undefined} />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="SOS Alerts" value={sosAlerts} icon={<Warning />} color="#ef4444"
                  onClick={() => navigate('/incidents')} />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Drivers Absent" value={absentDrivers} icon={<Person />} color="#f97316"
                  onClick={() => navigate('/drivers')} />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Maintenance Due" value={stats?.maintenanceDue ?? 0} icon={<BuildCircle />} color="#64748b"
                  onClick={() => navigate('/maintenance')} />
              </motion.div>
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={12/7}>
              <motion.div variants={staggerItem}>
                <KpiCard title="Unread Alerts" value={stats?.unreadNotifications ?? 0} icon={<NotificationsActive />} color="#0ea5e9"
                  onClick={() => navigate('/notifications')} />
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={8}>
            <motion.div variants={staggerItem}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      <MyLocation sx={{ fontSize: 18, mr: 0.75, verticalAlign: 'middle', color: 'primary.main' }} />
                      Live Fleet Tracking — Kathmandu Valley
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip icon={<RadioButtonChecked sx={{ fontSize: 14 }} />} label={`${activeBusCount} active`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                      <Chip icon={<Speed sx={{ fontSize: 14 }} />} label={`${liveBuses} updates/min`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </Box>
                  </Box>
                  <LiveBusMap height={420} />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={4}>
            <motion.div variants={staggerItem}>
              <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    <Timeline sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                    Live Activity Feed
                  </Typography>
                  <Chip label={`${timeline.length} events`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                </Box>
                <Box ref={timelineRef} sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 440 }}>
                  {timeline.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Timeline sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No live events yet</Typography>
                      <Typography variant="caption" color="text.disabled">Start the simulator or wait for live data</Typography>
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
                          display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.25,
                          borderRadius: 2.5,
                          bgcolor: ev.severity === 'error' ? alpha('#ef4444', isDark ? 0.1 : 0.06) :
                                  ev.severity === 'warning' ? alpha('#f59e0b', isDark ? 0.1 : 0.06) : 'transparent',
                          borderLeft: `3px solid ${
                            ev.severity === 'error' ? '#ef4444' :
                            ev.severity === 'warning' ? '#f59e0b' :
                            ev.severity === 'success' ? '#22c55e' : 'transparent'
                          }`,
                        }}>
                          {ev.initials ? (
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                              {ev.initials}
                            </Avatar>
                          ) : (
                            <Box sx={{ mt: 0.25 }}>
                              <StatusChip status={ev.severity === 'error' ? 'emergency' : ev.severity === 'warning' ? 'delayed' : 'active'}
                                size="small" label={ev.severity === 'error' ? '!' : ev.severity === 'warning' ? '!' : '●'} />
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.3 }}>
                              {ev.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              {ev.detail}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.55rem', color: 'text.disabled' }}>
                            {ev.timestamp}
                          </Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <motion.div variants={staggerItem}>
              <GlassCard gradient>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
                  <Warning sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: sosAlerts > 0 ? 'error.main' : 'text.secondary' }} />
                  Active Incidents
                </Typography>
                {pendingIncidents > 0 ? (
                  <Stack spacing={1.5}>
                    {Array.from({ length: Math.min(pendingIncidents, 3) }).map((_, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha('#ef4444', isDark ? 0.08 : 0.04) }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Pending incident #{i + 1}</Typography>
                          <Typography variant="caption" color="text.secondary">Requires attention</Typography>
                        </Box>
                        <Button size="small" variant="text" onClick={() => navigate('/incidents')}>View</Button>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 36, color: '#22c55e', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>No active incidents</Typography>
                    <Typography variant="caption" color="text.secondary">All operations running smoothly</Typography>
                  </Box>
                )}
                <Button fullWidth size="small" variant="text" endIcon={<ArrowForward />} onClick={() => navigate('/incidents')} sx={{ mt: 1 }}>
                  View All Incidents
                </Button>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div variants={staggerItem}>
              <GlassCard gradient>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
                  <Person sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                  Driver Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ width: 100, height: 100 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={driverStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value">
                          {driverStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {driverStatusData.map((d) => (
                      <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                          <Typography variant="caption">{d.name}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{d.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Button fullWidth size="small" variant="text" endIcon={<ArrowForward />} onClick={() => navigate('/drivers')}>
                  Manage Drivers
                </Button>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div variants={staggerItem}>
              <GlassCard gradient>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
                  <DirectionsBus sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'secondary.main' }} />
                  Fleet Health
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {[
                    { label: 'Active', value: activeBusCount, color: '#22c55e' },
                    { label: 'Idle', value: Math.max(0, (stats?.totalBuses ?? 0) - activeBusCount), color: '#f59e0b' },
                    { label: 'Maintenance', value: stats?.maintenanceDue ?? 0, color: '#ef4444' },
                    { label: 'Online', value: `${liveBuses}/min`, color: '#3b82f6' },
                  ].map((item) => (
                    <Grid item xs={6} key={item.label}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(item.color, isDark ? 0.08 : 0.04), textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Button fullWidth size="small" variant="text" endIcon={<ArrowForward />} onClick={() => navigate('/fleet')}>
                  View Fleet Dashboard
                </Button>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <motion.div variants={staggerItem}>
              <GlassCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    <School sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                    Student Boarding Progress
                  </Typography>
                  <Button size="small" variant="text" onClick={() => navigate('/attendance')}>View All</Button>
                </Box>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weeklyData} barSize={20} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <RechartTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#1e293b' : '#fff' }} />
                      <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No attendance data available</Typography>
                  </Box>
                )}
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div variants={staggerItem}>
              <GlassCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    <TrendingUp sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'secondary.main' }} />
                    Bus Utilization
                  </Typography>
                  <Button size="small" variant="text" onClick={() => navigate('/analytics')}>Analytics</Button>
                </Box>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={busUtilizationData} barSize={16} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RechartTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#1e293b' : '#fff' }} />
                    <Bar dataKey="active" name="Active" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="idle" name="Idle" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      <SosButton onClick={() => navigate('/incidents')} pulse={sosAlerts > 0} />
    </Box>
  );
}
