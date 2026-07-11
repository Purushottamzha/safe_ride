import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { busService, type CreateBusPayload } from '../../services/buses';
import { schoolService } from '../../services/schools';
import { driverService } from '../../services/drivers';
import { useAuthStore } from '../../store/authStore';

const busSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required'),
  plateNumber: z.string().min(1, 'Plate number is required'),
  model: z.string().min(1, 'Model is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  schoolId: z.string().min(1, 'School is required'),
  driverId: z.string().optional(),
});

type BusForm = z.infer<typeof busSchema>;

export default function BusCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.list({ limit: 200 }),
    enabled: isSuperAdmin,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driverService.list({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBusPayload) => busService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buses'] }); navigate('/buses'); },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BusForm>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      busNumber: '', plateNumber: '', model: '', capacity: 40,
      schoolId: isSuperAdmin ? '' : (user?.schoolId ?? ''),
      driverId: '',
    },
  });

  const onSubmit = (data: BusForm) => {
    const payload: CreateBusPayload = {
      busNumber: data.busNumber,
      plateNumber: data.plateNumber,
      model: data.model || undefined,
      capacity: data.capacity,
      schoolId: data.schoolId,
    };
    createMutation.mutate(payload);
  };

  return (
    <Box>
      <PageHeader title="Add Bus" subtitle="Register a new bus" showBack backTo="/buses" />
      <GlassCard>
        {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create bus</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Bus Number" error={!!errors.busNumber} helperText={errors.busNumber?.message} {...register('busNumber')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Plate Number" error={!!errors.plateNumber} helperText={errors.plateNumber?.message} {...register('plateNumber')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Model" error={!!errors.model} helperText={errors.model?.message} {...register('model')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Capacity" type="number" error={!!errors.capacity} helperText={errors.capacity?.message} {...register('capacity')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="School" select error={!!errors.schoolId} helperText={errors.schoolId?.message}
                {...register('schoolId')} disabled={!isSuperAdmin}>
                {isSuperAdmin ? (schoolsData?.data ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
                  : <MenuItem value={user?.schoolId ?? ''}>{user?.school?.name ?? 'Your School'}</MenuItem>}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Driver (optional)" select {...register('driverId')} defaultValue="">
                <MenuItem value="">No Driver</MenuItem>
                {(driversData?.data ?? []).map((d) => <MenuItem key={d.id} value={d.id}>{d.user.firstName} {d.user.lastName}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
            <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/buses')}>Cancel</LoadingButton>
            <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
              loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create Bus</LoadingButton>
          </Box>
        </form>
      </GlassCard>
    </Box>
  );
}
