import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { driverService, type CreateDriverPayload } from '../../services/drivers';
import { schoolService } from '../../services/schools';
import { useAuthStore } from '../../store/authStore';

const driverSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  schoolId: z.string().min(1, 'School is required'),
});

type DriverForm = z.infer<typeof driverSchema>;

export default function DriverCreate() {
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
    mutationFn: (data: CreateDriverPayload) => driverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      navigate('/drivers');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      licenseNumber: '', licenseExpiry: '',
      schoolId: isSuperAdmin ? '' : (user?.schoolId ?? ''),
    },
  });

  const onSubmit = (data: DriverForm) => createMutation.mutate(data);

  return (
    <Box>
      <PageHeader title="Add Driver" subtitle="Create a new driver record" showBack backTo="/drivers" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create driver</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} {...register('firstName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} {...register('lastName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="License Number" error={!!errors.licenseNumber} helperText={errors.licenseNumber?.message} {...register('licenseNumber')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="License Expiry" type="date" InputLabelProps={{ shrink: true }} error={!!errors.licenseExpiry} helperText={errors.licenseExpiry?.message} {...register('licenseExpiry')} />
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
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/drivers')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create Driver</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
