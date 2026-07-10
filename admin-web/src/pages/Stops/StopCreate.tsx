import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { stopService } from '../../services/stops';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';

const stopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  schoolId: z.string().min(1, 'School is required'),
});

type StopForm = z.infer<typeof stopSchema>;

export default function StopCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.list({ limit: 200 }),
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => stopService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      navigate('/stops');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<StopForm>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      name: '', address: '', latitude: '', longitude: '',
      schoolId: isSuperAdmin ? '' : (user?.schoolId ?? ''),
    },
  });

  const onSubmit = (data: StopForm) => {
    const payload = {
      ...data,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <Box>
      <PageHeader title="Add Stop" subtitle="Create a new bus stop" showBack backTo="/stops" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create stop</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Stop Name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Address" error={!!errors.address} helperText={errors.address?.message} {...register('address')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Latitude" type="number" inputProps={{ step: 0.0001 }}
                  error={!!errors.latitude} helperText={errors.latitude?.message} {...register('latitude')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Longitude" type="number" inputProps={{ step: 0.0001 }}
                  error={!!errors.longitude} helperText={errors.longitude?.message} {...register('longitude')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="School" select error={!!errors.schoolId} helperText={errors.schoolId?.message}
                  {...register('schoolId')} disabled={!isSuperAdmin}>
                  {isSuperAdmin ? (
                    (schoolsData?.data ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
                  ) : (
                    <MenuItem value={user?.schoolId ?? ''}>{user?.school?.name ?? 'Your School'}</MenuItem>
                  )}
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/stops')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create Stop</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
