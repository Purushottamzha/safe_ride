import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { busService, type UpdateBusPayload } from '../../services/buses';

const busSchema = z.object({
  busNumber: z.string().min(1, 'Bus number is required'),
  plateNumber: z.string().min(1, 'Plate number is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  model: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

type BusForm = z.infer<typeof busSchema>;

export default function BusEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bus, isLoading: loadingBus } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => busService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBusPayload) => busService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', id] });
      navigate(`/buses/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BusForm>({
    resolver: zodResolver(busSchema),
    values: bus ? {
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      capacity: bus.capacity.toString(),
      model: bus.model ?? '',
      year: bus.year?.toString() ?? '',
      color: bus.color ?? '',
      status: bus.status,
    } : undefined,
  });

  const onSubmit = (data: BusForm) => {
    const payload: UpdateBusPayload = {
      busNumber: data.busNumber,
      plateNumber: data.plateNumber,
      capacity: parseInt(data.capacity, 10),
      model: data.model || undefined,
      year: data.year ? parseInt(data.year, 10) : undefined,
      color: data.color || undefined,
      status: data.status as any,
    };
    updateMutation.mutate(payload);
  };

  if (loadingBus) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/buses" />
        <GlassCard sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></GlassCard>
      </Box>
    );
  }

  if (!bus) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/buses" />
        <Alert severity="warning">Bus not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit Bus" subtitle={`Bus ${bus.busNumber}`} showBack backTo={`/buses/${id}`} />
      <GlassCard>
        {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update bus</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bus Number" error={!!errors.busNumber} helperText={errors.busNumber?.message} {...register('busNumber')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Plate Number" error={!!errors.plateNumber} helperText={errors.plateNumber?.message} {...register('plateNumber')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Capacity" type="number" error={!!errors.capacity} helperText={errors.capacity?.message} {...register('capacity')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Year" type="number" error={!!errors.year} helperText={errors.year?.message} {...register('year')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Color" error={!!errors.color} helperText={errors.color?.message} {...register('color')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Model" error={!!errors.model} helperText={errors.model?.message} {...register('model')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Status" select error={!!errors.status} helperText={errors.status?.message} {...register('status')}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="RETIRED">Retired</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
            <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/buses/${id}`)}>Cancel</LoadingButton>
            <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
              loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
          </Box>
        </form>
      </GlassCard>
    </Box>
  );
}
