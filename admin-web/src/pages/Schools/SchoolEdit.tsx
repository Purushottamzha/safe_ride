import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, Alert, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { schoolService } from '../../services/schools';

const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  code: z.string().min(1, 'School code is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type SchoolForm = z.infer<typeof schoolSchema>;

export default function SchoolEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: school, isLoading: loadingSchool } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SchoolForm) => schoolService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', id] });
      navigate(`/schools/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    values: school ? {
      name: school.name, code: school.code, address: school.address,
      phone: school.phone, email: school.email, timezone: school.timezone,
    } : undefined,
  });

  const onSubmit = (data: SchoolForm) => updateMutation.mutate(data);

  if (loadingSchool) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/schools" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
      </Box>
    );
  }

  if (!school) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/schools" />
        <Alert severity="warning">School not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit School" subtitle={school.name} showBack backTo={`/schools/${id}`} />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update school</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/schools/${id}`)}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
