import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, TextField, Alert, CircularProgress, Switch, FormControlLabel, Divider, Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';
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

  const onSubmit = (data: SettingsForm) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="School Settings" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
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
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
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
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
            loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Settings</LoadingButton>
        </Box>
      </form>
    </Box>
  );
}
