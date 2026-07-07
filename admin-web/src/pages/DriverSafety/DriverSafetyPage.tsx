import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton, Alert,
  LinearProgress, IconButton,
} from '@mui/material';
import {
  Warning, Star,
  Refresh, Person, Route,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { driverSafetyService } from '../../services/driverSafety';
import { useAuthStore } from '../../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  const stars = score >= 90 ? 5 : score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{ height: 10, borderRadius: 5, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }}
        />
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 36, color }}>{score}%</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 64 }}>
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      </Typography>
    </Box>
  );
}

const eventColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  OVERSPEED: 'error',
  ROUTE_DEVIATION: 'warning',
  LONG_IDLE: 'info',
  MISSED_STOP: 'warning',
  HARD_BRAKE: 'error',
  GPS_DISCONNECTED: 'warning',
  EMERGENCY_TRIGGERED: 'error',
};

export default function DriverSafetyPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const { data: scores, isLoading, refetch } = useQuery({
    queryKey: ['driver-safety-scores'],
    queryFn: () => driverSafetyService.getAllScores(user?.schoolId),
    refetchInterval: 30000,
  });

  const { data: events } = useQuery({
    queryKey: ['driver-safety-events', selectedDriver],
    queryFn: () => driverSafetyService.getEvents(selectedDriver!, 20),
    enabled: !!selectedDriver,
  });

  const avgScore = scores && scores.length > 0
    ? Math.round(scores.reduce((s, d) => s + d.overallScore, 0) / scores.length)
    : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Driver Safety"
        subtitle="Monitor driver safety scores and incidents"
        actions={[{ label: 'Refresh', onClick: () => refetch(), variant: 'outlined', icon: <Refresh /> }]}
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Average Safety Score', value: avgScore, suffix: '%', icon: <Star />, color: avgScore >= 90 ? '#22c55e' : '#f59e0b' },
          { label: 'Drivers Monitored', value: scores?.length ?? 0, icon: <Person />, color: '#2563eb' },
          { label: 'Total Trips', value: scores?.reduce((s, d) => s + d.tripCount, 0) ?? 0, icon: <Route />, color: '#7c3aed' },
          { label: 'Total Incidents', value: scores?.reduce((s, d) => s + d.overspeedCount + d.deviationCount + d.hardBrakeCount + d.emergencyCount, 0) ?? 0, icon: <Warning />, color: '#ef4444' },
        ].map((stat, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {isLoading ? <Skeleton width={60} /> : `${stat.value}${stat.suffix ?? ''}`}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={selectedDriver ? 7 : 12}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Driver Safety Scores</Typography>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)
                ) : scores && scores.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {scores.map((s) => (
                      <Box
                        key={s.driverId}
                        onClick={() => setSelectedDriver(selectedDriver === s.driverId ? null : s.driverId)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: selectedDriver === s.driverId ? 'primary.50' : 'grey.50',
                          cursor: 'pointer',
                          border: selectedDriver === s.driverId ? '2px solid' : '1px solid transparent',
                          borderColor: selectedDriver === s.driverId ? 'primary.main' : 'divider',
                          '&:hover': { bgcolor: selectedDriver === s.driverId ? 'primary.50' : 'grey.100' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: s.overallScore >= 90 ? '#dcfce7' : s.overallScore >= 70 ? '#fef3c7' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {s.driver.firstName[0]}{s.driver.lastName[0]}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{s.driver.firstName} {s.driver.lastName}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip icon={<Route />} label={`${s.tripCount} trips`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                            {s.emergencyCount > 0 && <Chip label={`${s.emergencyCount} SOS`} size="small" color="error" sx={{ fontSize: '0.6rem', height: 20 }} />}
                          </Box>
                        </Box>
                        <ScoreGauge score={s.overallScore} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No driver safety data available yet.</Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {selectedDriver && (
          <Grid item xs={12} lg={5}>
            <motion.div variants={itemVariants} key={selectedDriver}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Events</Typography>
                    <IconButton size="small" onClick={() => setSelectedDriver(null)}>✕</IconButton>
                  </Box>
                  {events && events.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {events.slice(0, 10).map((ev) => (
                        <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                          <Chip label={ev.eventType} size="small" color={eventColors[ev.eventType] ?? 'default'} variant="outlined" sx={{ fontSize: '0.55rem', height: 22 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" noWrap>{ev.description}</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              {new Date(ev.createdAt).toLocaleTimeString()}
                              {ev.speed && ` · ${Math.round(ev.speed)} km/h`}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No recent safety events</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
}
