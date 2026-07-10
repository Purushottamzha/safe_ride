import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { driverService, type UpdateDriverPayload } from '../../services/drivers';

const driverSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  emergencyContact: z.string().optional(),
});

type DriverForm = z.infer<typeof driverSchema>;

export default function DriverEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: driver, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateDriverPayload) => driverService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', id] });
      navigate(`/drivers/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    values: driver ? {
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
      phone: driver.user.phone ?? '',
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
      emergencyContact: driver.emergencyContact ?? '',
    } : undefined,
  });

  const onSubmit = (data: DriverForm) => updateMutation.mutate(data);

  if (loadingDriver) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/drivers" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
      </Box>
    );
  }

  if (!driver) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/drivers" />
        <Alert severity="warning">Driver not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit Driver" subtitle={`${driver.user.firstName} ${driver.user.lastName}`} showBack backTo={`/drivers/${id}`} />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update driver</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} {...register('firstName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} {...register('lastName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="License Number" error={!!errors.licenseNumber} helperText={errors.licenseNumber?.message} {...register('licenseNumber')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="License Expiry" type="date" InputLabelProps={{ shrink: true }}
                  error={!!errors.licenseExpiry} helperText={errors.licenseExpiry?.message} {...register('licenseExpiry')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Emergency Contact" error={!!errors.emergencyContact} helperText={errors.emergencyContact?.message} {...register('emergencyContact')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/drivers/${id}`)}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
