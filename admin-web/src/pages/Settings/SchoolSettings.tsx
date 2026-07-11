import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Grid, TextField, Alert, CircularProgress, Switch, FormControlLabel, Divider, Typography,
  Slider, Chip, Button,
} from '@mui/material';
import { Science, PlayArrow, Stop, Speed } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import api from '../../services/api';
import { useState } from 'react';

const settingsSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  code: z.string().min(1, 'School code is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SchoolSettings() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId;
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => schoolService.getById(schoolId!),
    enabled: !!schoolId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) => schoolService.update(schoolId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      setSuccessMsg('Settings saved successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: school ? {
      name: school.name,
      code: school.code,
      address: school.address,
      phone: school.phone,
      email: school.email,
      timezone: school.timezone,
    } : undefined,
  });

  const { enabled: demoEnabled, speed: demoSpeed, setEnabled: setDemoEnabled, setSpeed: setDemoSpeed } = useDemoStore();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoToggle = async () => {
    setDemoLoading(true);
    try {
      if (demoEnabled) {
        await api.post('/simulator/stop');
        setDemoEnabled(false);
      } else {
        await api.post('/simulator/start', { speed: demoSpeed });
        setDemoEnabled(true);
      }
    } catch { /* ignore */ }
    setDemoLoading(false);
  };

  const onSubmit = (data: SettingsForm) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="School Settings" />
        <GlassCard sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></GlassCard>
      </Box>
    );
  }

  if (!schoolId) {
    return (
      <Box>
        <PageHeader title="School Settings" />
        <Alert severity="info">No school assigned to your account</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="School Settings" subtitle="Manage your school configuration" />

      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
      {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to save settings</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <GlassCard sx={{ mb: 3 }}>
          <Box sx={{ mb: 2 }}><Divider sx={{ mb: 2 }} /><Typography variant="h6" sx={{ fontWeight: 800 }}>General Information</Typography></Box>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Code" error={!!errors.code} helperText={errors.code?.message} {...register('code')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" error={!!errors.address} helperText={errors.address?.message} {...register('address')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Timezone" error={!!errors.timezone} helperText={errors.timezone?.message} {...register('timezone')} />
            </Grid>
          </Grid>
        </GlassCard>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
            loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Settings</LoadingButton>
        </Box>
      </form>

      <GlassCard
        sx={{ mt: 4, border: demoEnabled ? '2px solid #10b981' : '1px solid', borderColor: demoEnabled ? '#10b981' : 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color={demoEnabled ? 'success' : 'disabled'} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Demo Mode</Typography>
              <Typography variant="caption" color="text.secondary">
                Simulate live operations for demonstrations
              </Typography>
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={demoEnabled}
                onChange={handleDemoToggle}
                disabled={demoLoading}
                color="success"
              />
            }
            label={demoEnabled ? 'Active' : 'Inactive'}
            labelPlacement="start"
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 600, fontSize: '0.875rem' } }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
            <Speed sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600}>Speed</Typography>
          </Box>
          <Slider
            value={demoSpeed}
            onChange={(_, v) => setDemoSpeed(v as number)}
            min={1}
            max={30}
            step={1}
            sx={{ flex: 1, minWidth: 200, maxWidth: 400 }}
            marks={[
              { value: 1, label: '1x' },
              { value: 5, label: '5x' },
              { value: 10, label: '10x' },
              { value: 30, label: '30x' },
            ]}
            disabled={demoLoading}
          />
          <Chip label={`${demoSpeed}x`} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 40 }} />
        </Box>

        {demoEnabled && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" icon={<Science />} sx={{ fontSize: '0.8rem' }}>
              Demo simulation is running. Buses will move along routes, students will board,
              and notifications will be sent automatically. Visit the Dashboard to see live activity.
            </Alert>
          </Box>
        )}
      </GlassCard>
    </Box>
  );
}
