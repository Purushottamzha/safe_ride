import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { routeService } from '../../services/routes';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  code: z.string().min(1, 'Route code is required'),
  direction: z.string().optional(),
  distance: z.string().optional(),
  duration: z.string().optional(),
  schoolId: z.string().min(1, 'School is required'),
});

type RouteForm = z.infer<typeof routeSchema>;

export default function RouteCreate() {
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
    mutationFn: (data: any) => routeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      navigate('/routes');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '', code: '', direction: '', distance: '', duration: '',
      schoolId: isSuperAdmin ? '' : (user?.schoolId ?? ''),
    },
  });

  const onSubmit = (data: RouteForm) => {
    const payload = {
      ...data,
      distance: data.distance ? parseFloat(data.distance) : undefined,
      duration: data.duration ? parseInt(data.duration, 10) : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <Box>
      <PageHeader title="Add Route" subtitle="Create a new bus route" showBack backTo="/routes" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create route</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Route Name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Route Code" error={!!errors.code} helperText={errors.code?.message} {...register('code')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Direction" error={!!errors.direction} helperText={errors.direction?.message} {...register('direction')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Distance (km)" type="number" inputProps={{ step: 0.1 }}
                  error={!!errors.distance} helperText={errors.distance?.message} {...register('distance')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Duration (min)" type="number"
                  error={!!errors.duration} helperText={errors.duration?.message} {...register('duration')} />
              </Grid>
              <Grid item xs={12}>
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
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/routes')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create Route</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
