import { useState } from 'react';
import {
  Box, Grid, Typography, Chip, ToggleButtonGroup, ToggleButton,
  Skeleton, Alert, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Stack, Rating,
} from '@mui/material';
import {
  Refresh, TrendingUp, TrendingDown, School, DirectionsBus, Speed,
  AccessTime, People, Star, Route, Assessment,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Line, AreaChart, Area,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { analyticsService } from '../../services/analytics';

function StatCard({ title, value, subtitle, icon, color, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; color: string; trend?: { value: number; positive: boolean };
}) {
  return (
    <GlassCard sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        {trend && (
          <Chip
            icon={trend.positive ? <TrendingUp /> : <TrendingDown />}
            label={`${trend.value}%`}
            size="small"
            color={trend.positive ? 'success' : 'error'}
            variant="outlined"
            sx={{ height: 22, fontSize: '0.6rem', fontWeight: 600 }}
          />
        )}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.25 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.disabled">{subtitle}</Typography>}
    </GlassCard>
  );
}

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${color}` }}>
          <Typography variant="body1" sx={{ fontWeight: 800, color, fontSize: '1.1rem' }}>{Math.round(value)}%</Typography>
        </Box>
      </Box>
      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>{label}</Typography>
    </Box>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);

  const { data: overview, error: ovError, refetch: refetchOv } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview(),
    refetchInterval: 30000,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => analyticsService.getAttendanceTrends(undefined, days),
  });

  const { data: driverRanking, isLoading: drLoading } = useQuery({
    queryKey: ['analytics-drivers'],
    queryFn: () => analyticsService.getDriverRanking(),
  });

  const { data: delayMetrics, isLoading: delayLoading } = useQuery({
    queryKey: ['analytics-delay'],
    queryFn: () => analyticsService.getDelayMetrics(),
  });

  const { data: fleetUtilization, isLoading: fleetLoading } = useQuery({
    queryKey: ['analytics-fleet'],
    queryFn: () => analyticsService.getFleetUtilization(),
  });

  if (ovError) {
    return (
      <Box>
        <PageHeader title="School Analytics" subtitle="Executive dashboard" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetchOv()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load analytics data
        </Alert>
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="School Analytics"
        subtitle="Executive dashboard & performance metrics"
        actions={[
          { label: 'Refresh', onClick: () => refetchOv(), variant: 'outlined', icon: <Refresh /> },
        ]}
      />

      {overview && (
        <Box sx={{ mb: 3 }}>
          <GlassCard sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', mb: 2.5, backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Assessment sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  School Transportation Health: {overview.todayStats.attendanceRate >= 95 && overview.trips.onTimeRate >= 90 ? 'Excellent' : overview.todayStats.attendanceRate >= 85 ? 'Good' : 'Needs Attention'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {overview.activeTrips} active trips · {overview.todayStats.present} students transported today · {overview.pendingIncidents > 0 ? `${overview.pendingIncidents} pending incidents` : 'No incidents'}
                </Typography>
              </Box>
              <Chip label={overview.todayStats.attendanceRate >= 95 && overview.trips.onTimeRate >= 90 ? 'Excellent' : overview.todayStats.attendanceRate >= 85 ? 'Good' : 'Fair'} color={overview.todayStats.attendanceRate >= 95 ? 'success' : overview.todayStats.attendanceRate >= 85 ? 'warning' : 'error'} sx={{ fontWeight: 700 }} />
            </Box>
          </GlassCard>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title="Students Transported" value={overview.todayStats.present} icon={<People />} color="#2563eb" subtitle={`${overview.totalStudents} total enrolled`} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title="Attendance Rate" value={`${overview.todayStats.attendanceRate}%`} icon={<School />} color="#22c55e" subtitle={`${overview.todayStats.absent} absent`} trend={overview.todayStats.attendanceRate >= 90 ? { value: 3, positive: true } : undefined} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title="On-Time Trips" value={`${overview.trips.onTimeRate}%`} icon={<AccessTime />} color="#f59e0b" subtitle={`${overview.trips.delayed} delayed`} trend={overview.trips.onTimeRate >= 85 ? { value: 5, positive: true } : undefined} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title="Fleet Utilization" value={`${overview.fleetUtilization}%`} icon={<DirectionsBus />} color="#7c3aed" subtitle={`${overview.activeTrips}/${overview.activeBuses} buses`} />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title="Safety Score" value={`${Math.round(overview.safetyScore)}`} icon={<Speed />} color="#0891b2" subtitle="Driver average" trend={overview.safetyScore >= 90 ? { value: 2, positive: true } : undefined} />
            </Grid>
          </Grid>
        </Box>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={7}>
          <GlassCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                <TrendingUp sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                Attendance Trends
              </Typography>
              <ToggleButtonGroup size="small" value={days} exclusive onChange={(_, v) => v && setDays(v)}>
                <ToggleButton value={7} sx={{ fontSize: '0.65rem', px: 1 }}>7D</ToggleButton>
                <ToggleButton value={30} sx={{ fontSize: '0.65rem', px: 1 }}>30D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {trendsLoading ? (
              <Skeleton variant="rounded" height={280} />
            ) : !trends || trends.length === 0 ? (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">No attendance data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <RechartTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="present" name="Present" stroke="#22c55e" fill="url(#presentGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="rate" name="Rate %" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <GlassCard sx={{ height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
              <Star sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
              Driver Ranking
            </Typography>
            {drLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" sx={{ mb: 1 }} />)
            ) : !driverRanking || driverRanking.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No driver data</Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {driverRanking.slice(0, 6).map((d, i) => (
                  <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 0.75, borderRadius: 2, bgcolor: i === 0 ? '#f0fdf4' : 'transparent' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : 'text.secondary', minWidth: 20 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {d.driver.firstName} {d.driver.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.completedTrips} completed trips
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={700} color={d.overallScore >= 95 ? '#22c55e' : d.overallScore >= 85 ? '#f59e0b' : '#ef4444'}>
                        {Math.round(d.overallScore)}
                      </Typography>
                      <Rating value={d.overallScore / 20} readOnly size="small" max={5} precision={0.5} sx={{ fontSize: '0.7rem' }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <GlassCard>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
              <Route sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
              Delay Metrics by Route
            </Typography>
            {delayLoading ? (
              <Skeleton variant="rounded" height={240} />
            ) : !delayMetrics || delayMetrics.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No route delay data</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Route</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Trips</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Avg Delay</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Max Delay</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">On-Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {delayMetrics.map((r) => (
                      <TableRow key={r.routeId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.78rem' }}>{r.routeName}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.stopCount} stops</Typography>
                        </TableCell>
                        <TableCell align="center"><Typography variant="body2">{r.tripCount}</Typography></TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color={r.avgDelay <= 2 ? '#22c55e' : r.avgDelay <= 5 ? '#f59e0b' : '#ef4444'}>
                            {r.avgDelay} min
                          </Typography>
                        </TableCell>
                        <TableCell align="center"><Typography variant="body2">{r.maxDelay} min</Typography></TableCell>
                        <TableCell align="center">
                          <Chip label={`${r.onTimeRate}%`} size="small" color={r.onTimeRate >= 90 ? 'success' : r.onTimeRate >= 70 ? 'warning' : 'error'} sx={{ fontSize: '0.6rem', fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <GlassCard>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
              <DirectionsBus sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
              Fleet Utilization
            </Typography>
            {fleetLoading ? (
              <Skeleton variant="rounded" height={240} />
            ) : !fleetUtilization || fleetUtilization.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No fleet data</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {fleetUtilization.map((b) => (
                  <Box key={b.busId}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.78rem' }}>
                        {b.busNumber} - {b.plateNumber}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color={b.utilization >= 80 ? '#22c55e' : b.utilization >= 50 ? '#f59e0b' : '#94a3b8'}>
                        {b.utilization}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={b.utilization} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: b.utilization >= 80 ? '#22c55e' : b.utilization >= 50 ? '#f59e0b' : '#94a3b8' } }} />
                    <Typography variant="caption" color="text.secondary">{b.completedTrips} trips · capacity {b.capacity}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreGauge value={overview?.todayStats.attendanceRate ?? 0} label="Attendance" color="#22c55e" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreGauge value={overview?.trips.onTimeRate ?? 0} label="On-Time Rate" color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreGauge value={overview?.fleetUtilization ?? 0} label="Fleet Utilization" color="#7c3aed" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreGauge value={overview?.safetyScore ?? 0} label="Driver Safety" color="#0891b2" />
        </Grid>
      </Grid>
    </motion.div>
  );
}
