import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { stopService } from '../../services/stops';

const stopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type StopForm = z.infer<typeof stopSchema>;

export default function StopEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stop, isLoading: loadingStop } = useQuery({
    queryKey: ['stop', id],
    queryFn: () => stopService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stopService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      queryClient.invalidateQueries({ queryKey: ['stop', id] });
      navigate(`/stops/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<StopForm>({
    resolver: zodResolver(stopSchema),
    values: stop ? {
      name: stop.name,
      address: stop.address,
      latitude: stop.latitude?.toString() ?? '',
      longitude: stop.longitude?.toString() ?? '',
    } : undefined,
  });

  const onSubmit = (data: StopForm) => {
    const payload = {
      ...data,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    };
    updateMutation.mutate(payload);
  };

  if (loadingStop) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/stops" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
      </Box>
    );
  }

  if (!stop) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/stops" />
        <Alert severity="warning">Stop not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit Stop" subtitle={stop.name} showBack backTo={`/stops/${id}`} />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update stop</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Stop Name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Address" error={!!errors.address} helperText={errors.address?.message} {...register('address')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Latitude" type="number" inputProps={{ step: 0.0001 }}
                  error={!!errors.latitude} helperText={errors.latitude?.message} {...register('latitude')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Longitude" type="number" inputProps={{ step: 0.0001 }}
                  error={!!errors.longitude} helperText={errors.longitude?.message} {...register('longitude')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/stops/${id}`)}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
