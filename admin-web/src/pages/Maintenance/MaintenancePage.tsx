import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton, LinearProgress,
  Tabs, Tab, Alert,
} from '@mui/material';
import {
  Build, Warning, CheckCircle, Schedule, Speed, Refresh,
  LocalShipping, CalendarMonth, Assignment, Engineering,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';

interface VehicleHealth {
  id: string;
  busNumber: string;
  plateNumber: string;
  healthScore: number;
  lastServiceDate: string;
  nextServiceDate: string;
  odometer: number;
  tirePressure: 'good' | 'fair' | 'critical';
  brakeHealth: 'good' | 'fair' | 'critical';
  engineHealth: 'good' | 'fair' | 'critical';
  hasActiveIssue: boolean;
}

interface ServiceSchedule {
  id: string;
  busNumber: string;
  plateNumber: string;
  serviceType: string;
  scheduledDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

interface Inspection {
  id: string;
  busNumber: string;
  plateNumber: string;
  date: string;
  inspector: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  notes?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.100',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 36, color }}>
        {score}%
      </Typography>
    </Box>
  );
}

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  good: 'success', fair: 'warning', critical: 'error',
};

function getStatusColor(val: string, type: 'pass' | 'score') {
  if (type === 'score') {
    const n = Number(val);
    return n >= 80 ? 'success' : n >= 50 ? 'warning' : 'error';
  }
  if (val === 'PASS') return 'success';
  if (val === 'FAIL') return 'error';
  return 'warning';
}

export default function MaintenancePage() {
  const [tabValue, setTabValue] = useState(0);

  const { data: vehicles, isLoading: loadingVehicles, refetch: refetchVehicles } = useQuery({
    queryKey: ['maintenance-vehicles'],
    queryFn: () => api.get<VehicleHealth[]>('/maintenance/vehicles').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: () => api.get<ServiceSchedule[]>('/maintenance/schedules').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: inspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['maintenance-inspections'],
    queryFn: () => api.get<Inspection[]>('/maintenance/inspections').then(r => r.data),
  });

  const avgHealth = vehicles && vehicles.length > 0
    ? Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length)
    : 0;

  const criticalCount = vehicles?.filter(v => v.hasActiveIssue || v.healthScore < 50).length ?? 0;
  const upcomingServices = schedules?.filter(s => s.status !== 'COMPLETED').length ?? 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Maintenance Dashboard"
        subtitle="Fleet vehicle health, service schedules, and inspections"
        actions={[{ label: 'Refresh', onClick: () => refetchVehicles(), variant: 'outlined', icon: <Refresh /> }]}
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Fleet Health Score', value: avgHealth, suffix: '%', icon: <Speed />, color: avgHealth >= 80 ? '#22c55e' : '#f59e0b' },
          { label: 'Vehicles Monitored', value: vehicles?.length ?? 0, icon: <LocalShipping />, color: '#2563eb' },
          { label: 'Critical Alerts', value: criticalCount, icon: <Warning />, color: '#ef4444' },
          { label: 'Upcoming Services', value: upcomingServices, icon: <Schedule />, color: '#7c3aed' },
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
                    {loadingVehicles ? <Skeleton width={60} /> : `${stat.value}${stat.suffix ?? ''}`}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<Build />} label="Vehicle Health" iconPosition="start" />
          <Tab icon={<CalendarMonth />} label="Service Schedule" iconPosition="start" />
          <Tab icon={<Assignment />} label="Inspections" iconPosition="start" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={2.5}>
          {loadingVehicles ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={3} key={i}>
                <Skeleton variant="rounded" height={200} />
              </Grid>
            ))
          ) : vehicles && vehicles.length > 0 ? (
            vehicles.map((v) => (
              <Grid item xs={12} sm={6} lg={3} key={v.id}>
                <motion.div variants={itemVariants}>
                  <Card sx={{ position: 'relative', overflow: 'visible' }}>
                    {v.hasActiveIssue && (
                      <Chip
                        icon={<Warning sx={{ fontSize: 14 }} />}
                        label="ISSUE"
                        color="error"
                        size="small"
                        sx={{ position: 'absolute', top: -8, right: 12, fontWeight: 700, fontSize: '0.6rem' }}
                      />
                    )}
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={700}>{v.busNumber}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        {v.plateNumber}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Overall Health
                      </Typography>
                      <HealthGauge score={v.healthScore} />

                      <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5 }}>
                        {(['engineHealth', 'brakeHealth', 'tirePressure'] as const).map((key) => (
                          <Chip
                            key={key}
                            label={key === 'engineHealth' ? 'Engine' : key === 'brakeHealth' ? 'Brake' : 'Tires'}
                            size="small"
                            color={statusColors[v[key]]}
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 22 }}
                          />
                        ))}
                      </Box>

                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Last service: {new Date(v.lastServiceDate).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Odometer: {v.odometer.toLocaleString()} km
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">No vehicle health data available.</Alert>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingSchedules ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />)
          ) : schedules && schedules.length > 0 ? (
            schedules.map((s) => (
              <motion.div key={s.id} variants={itemVariants}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: s.status === 'COMPLETED' ? '#dcfce7' : s.status === 'IN_PROGRESS' ? '#fef3c7' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.status === 'COMPLETED' ? '#16a34a' : s.status === 'IN_PROGRESS' ? '#d97706' : '#2563eb' }}>
                      {s.status === 'COMPLETED' ? <CheckCircle /> : <Build />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {s.busNumber} - {s.serviceType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scheduled: {new Date(s.scheduledDate).toLocaleDateString()} &middot; {s.plateNumber}
                      </Typography>
                    </Box>
                    <Chip label={s.status} size="small" color={s.status === 'COMPLETED' ? 'success' : s.status === 'IN_PROGRESS' ? 'warning' : 'primary'} />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Alert severity="info">No service schedules found.</Alert>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingInspections ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />)
          ) : inspections && inspections.length > 0 ? (
            inspections.map((ins) => (
              <motion.div key={ins.id} variants={itemVariants}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: ins.result === 'PASS' ? '#dcfce7' : ins.result === 'FAIL' ? '#fef2f2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ins.result === 'PASS' ? '#16a34a' : ins.result === 'FAIL' ? '#dc2626' : '#d97706' }}>
                      <Engineering />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {ins.busNumber} - {ins.plateNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(ins.date).toLocaleDateString()} &middot; Inspector: {ins.inspector}
                      </Typography>
                      {ins.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Notes: {ins.notes}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={ins.result} size="small" color={getStatusColor(ins.result, 'pass')} />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Alert severity="info">No inspection records found.</Alert>
          )}
        </Box>
      )}
    </motion.div>
  );
}
