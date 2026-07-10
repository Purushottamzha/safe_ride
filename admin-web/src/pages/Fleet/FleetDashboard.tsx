import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton, Tabs, Tab, Alert,
} from '@mui/material';
import {
  LocalGasStation, Security, Description, Refresh, Warning, CheckCircle, Schedule,
  Build, CalendarMonth, Assignment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FleetDashboard() {
  const [tabValue, setTabValue] = useState(0);

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['fleet-dashboard'],
    queryFn: () => api.get('/maintenance/dashboard').then(r => r.data),
  });

  const { data: fuelLogs, isLoading: loadingFuel } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: () => api.get('/maintenance/fuel').then(r => r.data),
  });

  const { data: insurance, isLoading: loadingInsurance } = useQuery({
    queryKey: ['insurance-policies'],
    queryFn: () => api.get('/maintenance/insurance').then(r => r.data),
  });

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ['vehicle-documents'],
    queryFn: () => api.get('/maintenance/documents').then(r => r.data),
  });

  const { data: reminders } = useQuery({
    queryKey: ['service-reminders'],
    queryFn: () => api.get('/maintenance/reminders').then(r => r.data),
  });

  const statCards = loadingDash ? [] : [
    { label: 'Total Buses', value: dashboard?.totalBuses ?? 0, icon: <Build />, color: '#2563eb' },
    { label: 'Active Maintenance', value: dashboard?.activeMaintenance ?? 0, icon: <Build />, color: '#f59e0b' },
    { label: 'Upcoming Services', value: dashboard?.upcomingServices ?? 0, icon: <CalendarMonth />, color: '#7c3aed' },
    { label: 'Expiring Insurance', value: dashboard?.expiringInsurance ?? 0, icon: <Security />, color: '#ef4444' },
    { label: 'Expiring Documents', value: dashboard?.expiringDocuments ?? 0, icon: <Description />, color: '#f97316' },
    { label: 'Total Fuel Cost', value: `Rs ${(dashboard?.totalFuelCost ?? 0).toLocaleString()}`, icon: <LocalGasStation />, color: '#22c55e' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Fleet Management"
        subtitle="Fuel, insurance, documents, and service reminders"
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {loadingDash ? Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={100} /></Grid>
        )) : statCards.map((stat, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<LocalGasStation />} label="Fuel Logs" iconPosition="start" />
          <Tab icon={<Security />} label="Insurance" iconPosition="start" />
          <Tab icon={<Description />} label="Documents" iconPosition="start" />
          <Tab icon={<Schedule />} label="Reminders" iconPosition="start" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingFuel ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            fuelLogs?.length > 0 ? fuelLogs.map((log: any) => (
              <motion.div key={log.id} variants={itemVariants}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                      <LocalGasStation />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{log.bus?.busNumber} — {log.liters}L @ Rs {log.costPerLiter}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.date).toLocaleDateString()} &middot; Total: Rs {log.totalCost.toLocaleString()}{log.odometer ? ` &middot; Odometer: ${log.odometer.toLocaleString()} km` : ''}{log.station ? ` &middot; ${log.station}` : ''}
                      </Typography>
                    </Box>
                    <Chip label={log.fuelType} size="small" color="primary" variant="outlined" />
                  </CardContent>
                </Card>
              </motion.div>
            )) : <Alert severity="info">No fuel logs recorded.</Alert>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingInsurance ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            insurance?.length > 0 ? insurance.map((p: any) => {
              const expiring = new Date(p.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
              return (
                <motion.div key={p.id} variants={itemVariants}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: expiring ? '#fef2f2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: expiring ? '#dc2626' : '#16a34a' }}>
                        <Security />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{p.bus?.busNumber} — {p.provider}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Policy: {p.policyNumber} &middot; Expires: {new Date(p.expiryDate).toLocaleDateString()}{p.premium ? ` &middot; Premium: Rs ${p.premium.toLocaleString()}` : ''}
                        </Typography>
                      </Box>
                      <Chip label={expiring ? 'Expiring Soon' : 'Active'} size="small" color={expiring ? 'error' : 'success'} />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }) : <Alert severity="info">No insurance policies recorded.</Alert>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingDocs ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            documents?.length > 0 ? documents.map((doc: any) => {
              const expiring = doc.expiryDate && new Date(doc.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
              return (
                <motion.div key={doc.id} variants={itemVariants}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: expiring ? '#fef2f2' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: expiring ? '#dc2626' : '#2563eb' }}>
                        <Description />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{doc.bus?.busNumber} — {doc.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.documentNumber ? `No: ${doc.documentNumber} &middot; ` : ''}
                          {doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : `Issued: ${doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}`}
                        </Typography>
                      </Box>
                      <Chip label={doc.type} size="small" color={expiring ? 'error' : 'primary'} variant="outlined" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }) : <Alert severity="info">No vehicle documents uploaded.</Alert>
          )}
        </Box>
      )}

      {tabValue === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reminders?.length > 0 ? reminders.map((r: any) => (
            <motion.div key={r.id} variants={itemVariants}>
              <Card>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <Schedule />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{r.bus?.busNumber} — {r.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {r.type}{r.dueDate ? ` &middot; Due: ${new Date(r.dueDate).toLocaleDateString()}` : ''}{r.dueOdometer ? ` &middot; at ${r.dueOdometer.toLocaleString()} km` : ''}
                    </Typography>
                  </Box>
                  <Chip label={r.isRecurring ? 'Recurring' : 'One-time'} size="small" variant="outlined" />
                </CardContent>
              </Card>
            </motion.div>
          )) : <Alert severity="info">No service reminders configured.</Alert>}
        </Box>
      )}
    </motion.div>
  );
}
