import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Typography, Button, Chip, Stack, alpha, useTheme, Avatar, AvatarGroup,
  LinearProgress, Divider,
} from '@mui/material';
import {
  TodayOutlined, DirectionsBus, PeopleAlt, Map, AccessTime, Warning,
  CheckCircle, Person, BuildCircle, NotificationsActive, School,
  TrendingUp, MoreHoriz, Refresh, ArrowForward, MyLocation,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import GlassCard from '../components/common/GlassCard';
import KpiCard from '../components/common/KpiCard';
import AlertBanner from '../components/common/AlertBanner';
import StatusChip from '../components/common/StatusChip';
import SosButton from '../components/common/SosButton';
import { dashboardService } from '../services/dashboard';
import { staggerContainer, staggerItem } from '../utils/animations';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DailyOperations() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  });

  const todayTrips = stats?.activeTrips ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const activeDrivers = stats?.totalDrivers ?? 0;
  const att = stats?.todayAttendance ?? { present: 0, absent: 0, late: 0, total: 0 };
  const presentCount = att.present;
  const absentCount = att.absent;
  const lateCount = att.late;
  const yetToBoard = Math.max(0, totalStudents - presentCount - absentCount - lateCount);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader
        title={`${getGreeting()}, Operations Team`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Daily Operations Center`}
        actions={[
          { label: 'Refresh', icon: <Refresh />, variant: 'outlined' },
          { label: 'Incidents', icon: <NotificationsActive />, variant: 'contained', onClick: () => navigate('/incidents') },
        ]}
      />

      <AlertBanner
        type="info"
        message="Today's Operations Summary"
        details={`${todayTrips} trips scheduled · ${activeDrivers} drivers on duty · ${presentCount} students boarded`}
        dismissable={false}
        icon={false}
      />

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Today's Trips" value={todayTrips} icon={<Map />} color="#2563eb" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Trips Started" value={stats?.activeTrips ?? 0} icon={<TrendingUp />} color="#22c55e" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Trips Completed" value={stats?.completedTrips ?? 0} icon={<CheckCircle />} color="#64748b" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Drivers Present" value={activeDrivers} icon={<Person />} color="#22c55e" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Drivers Absent" value={Math.max(0, (stats?.totalDrivers ?? 0) - activeDrivers)} icon={<Person />} color="#ef4444" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Maintenance Due" value={stats?.maintenanceDue ?? 0} icon={<BuildCircle />} color="#f59e0b" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Yet to Board" value={yetToBoard} icon={<School />} color="#f97316" />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.5}>
            <motion.div variants={staggerItem}>
              <KpiCard title="Unread Alerts" value={stats?.unreadNotifications ?? 0} icon={<NotificationsActive />} color="#0ea5e9" />
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <motion.div variants={staggerItem}>
            <GlassCard gradient>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
                <DirectionsBus sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                Today's Trips
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { type: 'Morning', time: '7:00 AM', bus: 'BA 1 KHA 1234', route: 'Pulchowk - School', status: 'active' },
                  { type: 'Morning', time: '7:30 AM', bus: 'BA 1 KHA 5678', route: 'Jawlakhel - School', status: 'active' },
                  { type: 'Afternoon', time: '2:00 PM', bus: 'BA 1 KHA 1234', route: 'School - Pulchowk', status: 'scheduled' },
                  { type: 'Afternoon', time: '2:30 PM', bus: 'BA 1 KHA 5678', route: 'School - Jawlakhel', status: 'scheduled' },
                ].map((trip, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, isDark ? 0.3 : 0.5) }}>
                    <StatusChip status={trip.status} size="small" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{trip.type} · {trip.time}</Typography>
                      <Typography variant="caption" color="text.secondary">{trip.bus} · {trip.route}</Typography>
                    </Box>
                    <Button size="small" variant="text" sx={{ minWidth: 0, p: 0.5 }} onClick={() => navigate('/trips')}>
                      <ArrowForward fontSize="small" />
                    </Button>
                  </Box>
                ))}
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div variants={staggerItem}>
            <GlassCard gradient>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
                <School sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'secondary.main' }} />
                Student Boarding Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Boarding Progress</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{presentCount}/{totalStudents}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha('#22c55e', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                />
              </Box>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Boarded', value: presentCount, color: '#22c55e' },
                  { label: 'Absent', value: absentCount, color: '#ef4444' },
                  { label: 'Late', value: lateCount, color: '#f59e0b' },
                  { label: 'Pending', value: yetToBoard, color: '#94a3b8' },
                ].map((item) => (
                  <Grid item xs={3} key={item.label}>
                    <Box sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: alpha(item.color, isDark ? 0.08 : 0.04) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </GlassCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div variants={staggerItem}>
            <GlassCard gradient>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
                <Warning sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: 'warning.main' }} />
                Alerts & Late Buses
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha('#f59e0b', isDark ? 0.08 : 0.04), borderLeft: '3px solid #f59e0b' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Bus BA 1 KHA 5678 — Delayed 12 min</Typography>
                  <Typography variant="caption" color="text.secondary">Traffic on Pulchowk - Jawlakhel route</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha('#3b82f6', isDark ? 0.08 : 0.04), borderLeft: '3px solid #3b82f6' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>3 students yet to board morning trip</Typography>
                  <Typography variant="caption" color="text.secondary">Contact parents for pickup confirmation</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha('#22c55e', isDark ? 0.08 : 0.04), borderLeft: '3px solid #22c55e' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>All morning trips started on time</Typography>
                  <Typography variant="caption" color="text.secondary">No major delays reported</Typography>
                </Box>
              </Stack>
              <Button fullWidth size="small" variant="text" endIcon={<ArrowForward />} onClick={() => navigate('/trips')} sx={{ mt: 1.5 }}>
                View All Trips
              </Button>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      <SosButton onClick={() => navigate('/incidents')} />
    </motion.div>
  );
}
