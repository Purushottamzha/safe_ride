import { useState, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, MenuItem, Button,
  Stepper, Step, StepLabel, StepContent, Alert, Stack, Chip, Avatar,
  Divider, IconButton, alpha, useTheme, Paper, List, ListItem, ListItemIcon,
  ListItemText, LinearProgress,
} from '@mui/material';
import {
  PersonAdd, FamilyRestroom, DirectionsBus, Route, AirportShuttle,
  QrCode, CheckCircle, ArrowBack, ArrowForward, Celebration,
  School, Home, LocationOn, Check, Edit, Close, People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from '@mui/lab';
import { studentService } from '../services/students';
import { parentService } from '../services/parents';
import { assignmentService } from '../services/assignments';
import { qrManagementService } from '../services/qrManagement';
import { busService } from '../services/buses';
import { driverService } from '../services/drivers';
import { routeService } from '../services/routes';
import { schoolService } from '../services/schools';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/common/PageHeader';
import GlassCard from '../components/common/GlassCard';
import StatusChip from '../components/common/StatusChip';

const steps = [
  { label: 'Student Details', icon: <PersonAdd /> },
  { label: 'Parent Details', icon: <FamilyRestroom /> },
  { label: 'Transport Request', icon: <DirectionsBus /> },
  { label: 'Route & Stop', icon: <Route /> },
  { label: 'Assign Bus', icon: <AirportShuttle /> },
  { label: 'Assign Driver', icon: <People /> },
  { label: 'Generate QR', icon: <QrCode /> },
  { label: 'Complete', icon: <Celebration /> },
];

interface WorkflowState {
  step: number;
  student: {
    firstName: string; lastName: string; studentId: string;
    grade: string; section: string; dateOfBirth: string;
    address: string; schoolId: string; phone: string;
    createdId?: string;
  };
  parent: {
    firstName: string; lastName: string; email: string; phone: string;
    emergencyContact: boolean; createdId?: string;
  };
  transport: {
    required: boolean; pickupAddress: string; nearestStop: string;
  };
  route: { routeId: string; routeName: string; stopId: string; stopName: string };
  bus: { busId: string; busNumber: string };
  driver: { driverId: string; driverName: string };
  qr: { generated: boolean; qrImage?: string };
  completed: boolean;
}

const initialState: WorkflowState = {
  step: 0, student: { firstName: '', lastName: '', studentId: '', grade: '', section: '', dateOfBirth: '', address: '', schoolId: '', phone: '' },
  parent: { firstName: '', lastName: '', email: '', phone: '', emergencyContact: false },
  transport: { required: true, pickupAddress: '', nearestStop: '' },
  route: { routeId: '', routeName: '', stopId: '', stopName: '' },
  bus: { busId: '', busNumber: '' },
  driver: { driverId: '', driverName: '' },
  qr: { generated: false },
  completed: false,
};

export default function GuidedWorkflow() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [state, setState] = useState<WorkflowState>(initialState);
  const [error, setError] = useState('');

  const { data: schools } = useQuery({ queryKey: ['schools'], queryFn: () => schoolService.list({ limit: 200 }) });
  const { data: routes } = useQuery({ queryKey: ['routes'], queryFn: () => routeService.list({ limit: 100 }) });
  const { data: buses } = useQuery({ queryKey: ['buses'], queryFn: () => busService.list({ limit: 100 }) });
  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: () => driverService.list({ limit: 100 }) });

  const filteredRoutes = routes?.data?.filter(r => !state.student.schoolId || r.schoolId === state.student.schoolId) ?? [];
  const filteredBuses = buses?.data?.filter(b => !state.student.schoolId || b.schoolId === state.student.schoolId) ?? [];
  const filteredDrivers = drivers?.data?.filter(d => d.isAvailable) ?? [];

  const studentMutation = useMutation({
    mutationFn: (data: any) => studentService.create(data),
    onSuccess: (created) => setState(prev => ({ ...prev, student: { ...prev.student, createdId: created.id } })),
    onError: (e: any) => setError(e?.message || 'Failed to create student'),
  });

  const parentMutation = useMutation({
    mutationFn: (data: any) => parentService.create(data),
    onSuccess: (created) => setState(prev => ({ ...prev, parent: { ...prev.parent, createdId: created.id } })),
    onError: (e: any) => setError(e?.message || 'Failed to create parent'),
  });

  const assignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentService.create(data),
    onError: (e: any) => setError(e?.message || 'Failed to create assignment'),
  });

  const qrMutation = useMutation({
    mutationFn: (studentId: string) => qrManagementService.generateQR(studentId),
    onSuccess: async (data, studentId) => {
      try {
        const blob = await qrManagementService.downloadQR(studentId);
        const qrImage = URL.createObjectURL(blob);
        setState(prev => ({ ...prev, qr: { generated: true, qrImage } }));
      } catch {
        setState(prev => ({ ...prev, qr: { generated: true } }));
      }
    },
    onError: (e: any) => setError(e?.message || 'Failed to generate QR'),
  });

  const update = useCallback((path: string, values: Record<string, any>) => {
    setState(prev => {
      const key = path as keyof WorkflowState;
      const current = prev[key];
      if (typeof current === 'object' && current !== null) {
        return { ...prev, [key]: { ...current, ...values } };
      }
      return prev;
    });
    setError('');
  }, []);

  const canProceed = () => {
    const s = state.step;
    if (s === 0) return state.student.firstName && state.student.lastName && state.student.grade && state.student.schoolId;
    if (s === 1) return state.parent.firstName && state.parent.lastName && state.parent.email;
    if (s === 2) return true;
    if (s === 3) return state.route.routeId && state.route.stopName;
    if (s === 4) return !!state.bus.busId;
    if (s === 5) return !!state.driver.driverId;
    return true;
  };

  const handleNext = async () => {
    setError('');
    try {
      if (state.step === 0) {
        await studentMutation.mutateAsync({
          firstName: state.student.firstName, lastName: state.student.lastName,
          studentId: state.student.studentId || `STU-${Date.now()}`,
          grade: state.student.grade, section: state.student.section || 'A',
          dateOfBirth: state.student.dateOfBirth || new Date().toISOString().split('T')[0],
          address: state.student.address, schoolId: state.student.schoolId,
        });
      } else if (state.step === 1) {
        await parentMutation.mutateAsync({
          firstName: state.parent.firstName, lastName: state.parent.lastName,
          email: state.parent.email, phone: state.parent.phone || undefined,
          emergencyContact: state.parent.emergencyContact, schoolId: state.student.schoolId,
        });
      } else if (state.step === 5 && state.student.createdId) {
        await assignmentMutation.mutateAsync({
          name: `${state.student.firstName} ${state.student.lastName} - ${new Date().toLocaleDateString()}`,
          schoolId: state.student.schoolId, routeId: state.route.routeId,
        });
      } else if (state.step === 6 && state.student.createdId) {
        await qrMutation.mutateAsync(state.student.createdId);
      }
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    } catch {}
  };

  const handleBack = () => setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));

  const renderStep = () => {
    switch (state.step) {
      case 0: return (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="First Name *" value={state.student.firstName}
              onChange={e => update('student', { firstName: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last Name *" value={state.student.lastName}
              onChange={e => update('student', { lastName: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Grade *" select value={state.student.grade}
              onChange={e => update('student', { grade: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(g =>
                <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Section" select value={state.student.section}
              onChange={e => update('student', { section: e.target.value })}>
              {['A', 'B', 'C', 'D', 'E'].map(s => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="School *" select value={state.student.schoolId}
              onChange={e => update('student', { schoolId: e.target.value })}
              disabled={!isSuperAdmin}>
              {(isSuperAdmin ? schools?.data ?? [] : [{ id: user?.schoolId || '', name: user?.school?.name || 'Your School' }]).map((s: any) =>
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Student ID" value={state.student.studentId}
              onChange={e => update('student', { studentId: e.target.value })}
              placeholder="Auto-generated if empty" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Date of Birth" type="date" value={state.student.dateOfBirth}
              InputLabelProps={{ shrink: true }}
              onChange={e => update('student', { dateOfBirth: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Address" value={state.student.address}
              onChange={e => update('student', { address: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone" value={state.student.phone}
              onChange={e => update('student', { phone: e.target.value })} />
          </Grid>
        </Grid>
      );

      case 1: return (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="First Name *" value={state.parent.firstName}
              onChange={e => update('parent', { firstName: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last Name *" value={state.parent.lastName}
              onChange={e => update('parent', { lastName: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email *" type="email" value={state.parent.email}
              onChange={e => update('parent', { email: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone" value={state.parent.phone}
              onChange={e => update('parent', { phone: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label="Emergency Contact"
                color={state.parent.emergencyContact ? 'error' : 'default'}
                variant={state.parent.emergencyContact ? 'filled' : 'outlined'}
                onClick={() => update('parent', { emergencyContact: !state.parent.emergencyContact })}
                sx={{ cursor: 'pointer' }}
              />
              <Typography variant="caption" color="text.secondary">
                Mark this parent as an emergency contact
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      );

      case 2: return (
        <Box>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Transport is enabled by default. You can skip this step if the student does not require transport.
          </Alert>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={state.transport.required ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => update('transport', { required: true })}
                  startIcon={<DirectionsBus />}
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  Transport Required
                </Button>
                <Button
                  variant={!state.transport.required ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => update('transport', { required: false })}
                  startIcon={<Close />}
                  sx={{ borderRadius: 3, px: 3 }}
                >
                  No Transport
                </Button>
              </Stack>
            </Grid>
            {state.transport.required && (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth label="Pickup Address *" value={state.transport.pickupAddress}
                    onChange={e => update('transport', { pickupAddress: e.target.value })}
                    placeholder="e.g. Kumaripati, Lalitpur" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Nearest Landmark / Stop" value={state.transport.nearestStop}
                    onChange={e => update('transport', { nearestStop: e.target.value })}
                    placeholder="e.g. Near Kumaripati Bus Stop" />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      );

      case 3: return (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField fullWidth label="Select Route *" select value={state.route.routeId}
              onChange={e => {
                const route = filteredRoutes.find(r => r.id === e.target.value);
                update('route', { routeId: e.target.value, routeName: route?.name || '' });
              }}>
              <MenuItem value="">Choose a route</MenuItem>
              {filteredRoutes.map((r: any) =>
                <MenuItem key={r.id} value={r.id}>{r.name} ({r.code})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Stop Name *" value={state.route.stopName}
              onChange={e => update('route', { stopName: e.target.value })}
              placeholder={state.transport.pickupAddress || 'Enter stop name'} />
          </Grid>
          {state.route.routeName && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Route color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Route: {state.route.routeName}
                  </Typography>
                  <Chip label={state.route.stopName || 'Custom stop'} size="small" variant="outlined" />
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      );

      case 4: return (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField fullWidth label="Assign Bus *" select value={state.bus.busId}
              onChange={e => {
                const bus = filteredBuses.find(b => b.id === e.target.value);
                update('bus', { busId: e.target.value, busNumber: bus?.busNumber || '' });
              }}>
              <MenuItem value="">Choose a bus</MenuItem>
              {filteredBuses.map((b: any) =>
                <MenuItem key={b.id} value={b.id} disabled={b.status !== 'ACTIVE'}>
                  {b.busNumber} - {b.plateNumber} ({b.status})
                </MenuItem>)}
            </TextField>
          </Grid>
          {filteredBuses.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">No buses available for this school. Create a bus first.</Alert>
            </Grid>
          )}
          {state.bus.busNumber && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DirectionsBus color="success" />
                  <Typography variant="body2" fontWeight={600}>
                    Bus: {state.bus.busNumber}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      );

      case 5: return (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField fullWidth label="Assign Driver *" select value={state.driver.driverId}
              onChange={e => {
                const driver = filteredDrivers.find(d => d.id === e.target.value);
                update('driver', { driverId: e.target.value, driverName: driver ? `${driver.user?.firstName} ${driver.user?.lastName}` : '' });
              }}>
              <MenuItem value="">Choose a driver</MenuItem>
              {filteredDrivers.map((d: any) =>
                <MenuItem key={d.id} value={d.id}>
                  {d.user?.firstName} {d.user?.lastName} - {d.licenseNumber}
                </MenuItem>)}
            </TextField>
          </Grid>
          {filteredDrivers.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">No available drivers. Create a driver first or mark one as available.</Alert>
            </Grid>
          )}
        </Grid>
      );

      case 6: return (
        <Box>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            A unique QR code will be generated for {state.student.firstName} {state.student.lastName}.
            This QR is used for attendance scanning during boarding and drop-off.
          </Alert>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
            {state.qr.generated ? (
              <Box>
                <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a', mb: 1 }}>
                  QR Code Generated Successfully
                </Typography>
                {state.qr.qrImage && (
                  <Box component="img" src={state.qr.qrImage} sx={{ width: 200, height: 200, mb: 2, borderRadius: 2 }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  QR Code for {state.student.firstName} {state.student.lastName} (ID: {state.student.studentId || state.student.createdId?.slice(0, 8)})
                </Typography>
              </Box>
            ) : (
              <Box sx={{ py: 4 }}>
                <QrCode sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Click Next to generate the QR code
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );

      case 7: return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <Celebration sx={{ fontSize: 80, color: '#f59e0b', mb: 2 }} />
          </motion.div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Admission Complete!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
            {state.student.firstName} {state.student.lastName} has been successfully registered
            with transport assignment and QR code.
          </Typography>
          <GlassCard>
            <Stack spacing={2}>
              {[
                { icon: <PersonAdd />, label: 'Student', value: `${state.student.firstName} ${state.student.lastName}` },
                { icon: <FamilyRestroom />, label: 'Parent', value: `${state.parent.firstName} ${state.parent.lastName}` },
                { icon: <DirectionsBus />, label: 'Transport', value: state.transport.required ? 'Required' : 'Not Required' },
                { icon: <Route />, label: 'Route', value: state.route.routeName },
                { icon: <AirportShuttle />, label: 'Bus', value: state.bus.busNumber },
                { icon: <People />, label: 'Driver', value: state.driver.driverName },
                { icon: <QrCode />, label: 'QR Code', value: state.qr.generated ? 'Generated' : 'Pending' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                  </Box>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Box>
      );

      default: return null;
    }
  };

  const totalSteps = steps.length;
  const progress = ((state.step) / totalSteps) * 100;

  return (
    <Box>
      <PageHeader
        title="Student Admission Workflow"
        subtitle="Guided step-by-step student enrollment with transport setup"
      />

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Step {state.step + 1} of {totalSteps}: {steps[state.step]?.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress}
          sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={9} lg={8}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}>
                      {steps[state.step]?.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {steps[state.step]?.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fill in the details below
                      </Typography>
                    </Box>
                  </Stack>

                  {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

                  {renderStep()}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      disabled={state.step === 0}
                      onClick={handleBack}
                      startIcon={<ArrowBack />}
                      variant="text"
                    >
                      Back
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="text" color="inherit" onClick={() => navigate(state.student.createdId ? `/students/${state.student.createdId}` : '/students')}>
                        Skip Workflow
                      </Button>
                      {state.step < totalSteps - 1 ? (
                        <LoadingButton
                          variant="contained"
                          onClick={handleNext}
                          disabled={!canProceed()}
                          loading={studentMutation.isPending || parentMutation.isPending || qrMutation.isPending}
                          endIcon={<ArrowForward />}
                        >
                          {state.step === 6 ? 'Generate QR & Finish' : 'Next'}
                        </LoadingButton>
                      ) : (
                        <Button variant="contained" color="success" onClick={() => navigate('/students')}>
                          Go to Students
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Grid>

        <Grid item xs={12} md={3} lg={4}>
          <GlassCard>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 2 }}>
              Admission Progress
            </Typography>
            <Stepper activeStep={state.step} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={index} completed={state.step > index}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: state.step > index ? '#22c55e' : state.step === index ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.5),
                        color: state.step > index ? '#fff' : state.step === index ? 'primary.main' : 'text.disabled',
                        fontSize: '0.7rem',
                      }}>
                        {state.step > index ? <Check sx={{ fontSize: 16 }} /> : index + 1}
                      </Box>
                    )}
                  >
                    <Typography variant="caption" sx={{
                      fontWeight: state.step >= index ? 600 : 400,
                      color: state.step >= index ? 'text.primary' : 'text.disabled',
                    }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
