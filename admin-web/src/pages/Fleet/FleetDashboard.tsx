import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton, Tabs, Tab, Alert,
  TextField, MenuItem, Stack, LinearProgress, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, alpha, useTheme, Avatar,
} from '@mui/material';
import {
  LocalGasStation, Security, Description, Refresh, Warning, CheckCircle, Schedule,
  Build, CalendarMonth, Assignment, Upload, Download, Search, FilterList,
  DirectionsBus, Speed, Person, MedicalServices, Badge, Edit,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import KpiCard from '../../components/common/KpiCard';
import GlassCard from '../../components/common/GlassCard';
import StatusChip from '../../components/common/StatusChip';
import { staggerContainer, staggerItem } from '../../utils/animations';
import api from '../../services/api';

interface VehicleHealthDoc {
  id: string;
  type: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  fileName?: string;
  status: string;
}

interface VehicleWithDocs {
  id: string;
  busNumber: string;
  plateNumber: string;
  model?: string;
  year?: number;
  capacity: number;
  status: string;
  healthScore: number;
  lastServiceDate: string;
  odometer: number;
  insurance?: VehicleHealthDoc;
  pollution?: VehicleHealthDoc;
  fitness?: VehicleHealthDoc;
  registration?: VehicleHealthDoc;
  vehicleImage?: string;
}

export default function FleetDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; busId: string; docType: string }>({ open: false, busId: '', docType: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: dashboard, isLoading: loadingDash, refetch } = useQuery({
    queryKey: ['fleet-dashboard'],
    queryFn: () => api.get('/maintenance/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['maintenance-vehicles'],
    queryFn: () => api.get<VehicleWithDocs[]>('/maintenance/vehicles').then(r => r.data),
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

  const avgHealth = vehicles && vehicles.length > 0
    ? Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length)
    : 0;

  const criticalCount = vehicles?.filter(v => v.healthScore < 50).length ?? 0;
  const upcomingServices = reminders?.filter((r: any) => r.status !== 'COMPLETED').length ?? 0;

  const filteredVehicles = vehicles?.filter(v => {
    if (search && !v.busNumber.toLowerCase().includes(search.toLowerCase()) && !v.plateNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    return true;
  }) ?? [];

  const expiringDocs = documents?.filter((d: any) => {
    if (!d.expiryDate) return false;
    const diff = new Date(d.expiryDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }) ?? [];

  const handleUpload = async () => {
    if (!selectedFile || !uploadDialog.busId) return;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadDialog.docType);
      formData.append('busId', uploadDialog.busId);
      await api.post('/maintenance/documents/upload', formData);
      refetch();
      setUploadDialog({ open: false, busId: '', docType: '' });
      setSelectedFile(null);
    } catch {}
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader
        title="Fleet Management"
        subtitle="Vehicle health, documents, insurance, and service tracking"
        actions={[{ label: 'Refresh', onClick: () => refetch(), variant: 'outlined', icon: <Refresh /> }]}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Fleet Health" value={avgHealth} icon={<Speed />} color={avgHealth >= 80 ? '#22c55e' : avgHealth >= 50 ? '#f59e0b' : '#ef4444'} subtitle="%" />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Total Buses" value={vehicles?.length ?? 0} icon={<DirectionsBus />} color="#2563eb" />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Critical Alerts" value={criticalCount} icon={<Warning />} color="#ef4444" />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Expiring Docs" value={expiringDocs.length} icon={<Description />} color="#f97316" />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Upcoming Service" value={upcomingServices} icon={<Schedule />} color="#7c3aed" />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div variants={staggerItem}>
            <KpiCard title="Fuel Cost" value={dashboard?.totalFuelCost ?? 0} icon={<LocalGasStation />} color="#22c55e" subtitle={`Rs ${((dashboard?.totalFuelCost ?? 0) / 1000).toFixed(0)}k`} />
          </motion.div>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Search by bus number or plate..."
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
          />
          <TextField select size="small" label="Status" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
          <Chip icon={<FilterList />} label={`${filteredVehicles.length} vehicles`} size="small" variant="outlined" />
        </Stack>
      </Box>

      {expiringDocs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {expiringDocs.length} document(s) expiring within 30 days
          </Typography>
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<Build />} label="Vehicle Health" iconPosition="start" />
          <Tab icon={<Description />} label="Documents" iconPosition="start" />
          <Tab icon={<Security />} label="Insurance" iconPosition="start" />
          <Tab icon={<LocalGasStation />} label="Fuel Logs" iconPosition="start" />
          <Tab icon={<Schedule />} label="Reminders" iconPosition="start" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={2.5}>
          {loadingVehicles ? Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={280} /></Grid>
          )) : filteredVehicles.length > 0 ? filteredVehicles.map((v, i) => (
            <Grid item xs={12} sm={6} lg={3} key={v.id}>
              <motion.div variants={staggerItem} custom={i}>
                <GlassCard sx={{ position: 'relative' }}>
                  {v.healthScore < 50 && (
                    <Chip icon={<Warning sx={{ fontSize: 14 }} />} label="CRITICAL" color="error" size="small"
                      sx={{ position: 'absolute', top: -8, right: 12, fontWeight: 700, fontSize: '0.6rem' }} />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <DirectionsBus />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{v.busNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.plateNumber}</Typography>
                    </Box>
                    <StatusChip status={v.status?.toLowerCase() || 'active'} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Health Score</Typography>
                  <LinearProgress variant="determinate" value={v.healthScore}
                    sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: alpha('#22c55e', 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: v.healthScore >= 80 ? '#22c55e' : v.healthScore >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 4 } }} />
                  <Stack spacing={0.75}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Model</Typography>
                      <Typography variant="caption" fontWeight={600}>{v.model || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Capacity</Typography>
                      <Typography variant="caption" fontWeight={600}>{v.capacity} seats</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Odometer</Typography>
                      <Typography variant="caption" fontWeight={600}>{v.odometer?.toLocaleString() || '-'} km</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Last Service</Typography>
                      <Typography variant="caption" fontWeight={600}>{v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString() : '-'}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {[
                      { type: 'insurance', label: 'Insurance', exists: !!v.insurance },
                      { type: 'pollution', label: 'Pollution', exists: !!v.pollution },
                      { type: 'fitness', label: 'Fitness', exists: !!v.fitness },
                      { type: 'registration', label: 'Registration', exists: !!v.registration },
                    ].map(doc => (
                      <Tooltip key={doc.type} title={doc.exists ? `${doc.label} uploaded` : `Upload ${doc.label}`}>
                        <Chip
                          icon={doc.exists ? <CheckCircle sx={{ fontSize: 12 }} /> : <Upload sx={{ fontSize: 12 }} />}
                          label={doc.label} size="small"
                          color={doc.exists ? 'success' : 'default'}
                          variant={doc.exists ? 'filled' : 'outlined'}
                          onClick={() => setUploadDialog({ open: true, busId: v.id, docType: doc.type })}
                          sx={{ fontSize: '0.6rem', height: 22, cursor: 'pointer' }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          )) : (
            <Grid item xs={12}><Alert severity="info">No vehicles found matching your criteria.</Alert></Grid>
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingDocs ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            documents?.length > 0 ? documents.map((doc: any) => {
              const expiring = doc.expiryDate && new Date(doc.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
              const expired = doc.expiryDate && new Date(doc.expiryDate).getTime() < Date.now();
              return (
                <motion.div key={doc.id} variants={staggerItem}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 2,
                        bgcolor: expired ? '#fef2f2' : expiring ? '#fffbeb' : '#e0e7ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: expired ? '#dc2626' : expiring ? '#d97706' : '#2563eb',
                      }}>
                        {doc.type === 'insurance' ? <Security /> : doc.type === 'pollution' ? <Warning /> : doc.type === 'fitness' ? <CheckCircle /> : <Description />}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {doc.bus?.busNumber || 'Bus'} — {doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.documentNumber ? `No: ${doc.documentNumber} · ` : ''}
                          {doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : `Issued: ${doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}`}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {doc.fileUrl && (
                          <Tooltip title="Download"><IconButton size="small" href={doc.fileUrl} target="_blank"><Download fontSize="small" /></IconButton></Tooltip>
                        )}
                        <Chip label={expired ? 'Expired' : expiring ? 'Expiring' : 'Active'} size="small"
                          color={expired ? 'error' : expiring ? 'warning' : 'success'} />
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }) : <Alert severity="info">No documents uploaded. Use the vehicle health tab to upload documents.</Alert>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingInsurance ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            insurance?.length > 0 ? insurance.map((p: any) => {
              const expiring = new Date(p.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
              return (
                <motion.div key={p.id} variants={staggerItem}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: expiring ? '#fef2f2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: expiring ? '#dc2626' : '#16a34a' }}>
                        <Security />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{p.bus?.busNumber} — {p.provider}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Policy: {p.policyNumber} · Expires: {new Date(p.expiryDate).toLocaleDateString()}
                          {p.premium ? ` · Premium: Rs ${p.premium.toLocaleString()}` : ''}
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

      {tabValue === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loadingFuel ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} />) : (
            fuelLogs?.length > 0 ? fuelLogs.map((log: any) => (
              <motion.div key={log.id} variants={staggerItem}>
                <Card>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                      <LocalGasStation />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{log.bus?.busNumber} — {log.liters}L @ Rs {log.costPerLiter}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.date).toLocaleDateString()} · Total: Rs {log.totalCost.toLocaleString()}
                        {log.odometer ? ` · Odometer: ${log.odometer.toLocaleString()} km` : ''}
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

      {tabValue === 4 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reminders?.length > 0 ? reminders.map((r: any) => (
            <motion.div key={r.id} variants={staggerItem}>
              <Card>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <Schedule />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{r.bus?.busNumber} — {r.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {r.type}{r.dueDate ? ` · Due: ${new Date(r.dueDate).toLocaleDateString()}` : ''}{r.dueOdometer ? ` · at ${r.dueOdometer.toLocaleString()} km` : ''}
                    </Typography>
                  </Box>
                  <Chip label={r.isRecurring ? 'Recurring' : 'One-time'} size="small" variant="outlined" />
                </CardContent>
              </Card>
            </motion.div>
          )) : <Alert severity="info">No service reminders configured.</Alert>}
        </Box>
      )}

      <Dialog open={uploadDialog.open} onClose={() => setUploadDialog({ open: false, busId: '', docType: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Upload {uploadDialog.docType?.charAt(0).toUpperCase() + uploadDialog.docType?.slice(1)} Document
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a scanned copy or photo of the document for bus {uploadDialog.busId?.slice(0, 8)}.
            </Typography>
            <Box
              sx={{
                border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 4,
                textAlign: 'center', cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
              onClick={() => document.getElementById('fleet-file-upload')?.click()}
            >
              <input
                id="fleet-file-upload"
                type="file"
                hidden
                accept="image/*,.pdf"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <>
                  <CheckCircle sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>{selectedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Click to change</Typography>
                </>
              ) : (
                <>
                  <Upload sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>Click to upload</Typography>
                  <Typography variant="caption" color="text.secondary">PDF or image files accepted</Typography>
                </>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setUploadDialog({ open: false, busId: '', docType: '' })} variant="outlined">Cancel</Button>
          <LoadingButton variant="contained" onClick={handleUpload} disabled={!selectedFile} loading={false}>
            Upload Document
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
