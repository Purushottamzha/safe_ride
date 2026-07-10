import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { tripService } from '../../services/trips';
import { driverService } from '../../services/drivers';
import { busService } from '../../services/buses';
import { routeService } from '../../services/routes';
import { assignmentService } from '../../services/assignments';
import { useAuthStore } from '../../store/authStore';

const tripSchema = z.object({
  type: z.string().min(1, 'Trip type is required'),
  scheduledAt: z.string().min(1, 'Scheduled date is required'),
  driverId: z.string().min(1, 'Driver is required'),
  busId: z.string().min(1, 'Bus is required'),
  routeId: z.string().min(1, 'Route is required'),
  assignmentId: z.string().optional(),
  notes: z.string().optional(),
});

type TripForm = z.infer<typeof tripSchema>;

export default function TripCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: () => driverService.list({ limit: 200, isAvailable: true }),
  });

  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busService.list({ limit: 200 }),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routeService.list({ limit: 200 }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.list({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tripService.create(data),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      navigate(`/trips/${created.id}`);
    },
  });

  const schoolId = user?.schoolId ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      type: 'MORNING',
      scheduledAt: new Date().toISOString().split('T')[0] + 'T07:00',
      driverId: '', busId: '', routeId: '', assignmentId: '', notes: '',
    },
  });

  const onSubmit = (data: TripForm) => {
    const payload = {
      ...data,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
      assignmentId: data.assignmentId || undefined,
      notes: data.notes || undefined,
      schoolId,
    };
    createMutation.mutate(payload);
  };

  return (
    <Box>
      <PageHeader title="Create Trip" subtitle="Schedule a new trip" showBack backTo="/trips" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create trip</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Trip Type" select error={!!errors.type} helperText={errors.type?.message} {...register('type')}>
                  <MenuItem value="MORNING">Morning</MenuItem>
                  <MenuItem value="AFTERNOON">Afternoon</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Scheduled At" type="datetime-local" InputLabelProps={{ shrink: true }}
                  error={!!errors.scheduledAt} helperText={errors.scheduledAt?.message} {...register('scheduledAt')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Driver" select error={!!errors.driverId} helperText={errors.driverId?.message} {...register('driverId')}>
                  <MenuItem value="">Select a driver</MenuItem>
                  {(driversData?.data ?? []).map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.user.firstName} {d.user.lastName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Bus" select error={!!errors.busId} helperText={errors.busId?.message} {...register('busId')}>
                  <MenuItem value="">Select a bus</MenuItem>
                  {(busesData?.data ?? []).map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.busNumber} - {b.plateNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Route" select error={!!errors.routeId} helperText={errors.routeId?.message} {...register('routeId')}>
                  <MenuItem value="">Select a route</MenuItem>
                  {(routesData?.data ?? []).map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name} ({r.code})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Assignment" select error={!!errors.assignmentId} helperText={errors.assignmentId?.message} {...register('assignmentId')}>
                  <MenuItem value="">No assignment</MenuItem>
                  {(assignmentsData?.data ?? []).map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name || a.route?.name || a.id}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" multiline rows={3} error={!!errors.notes} helperText={errors.notes?.message} {...register('notes')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/trips')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create Trip</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
