import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { schoolService } from '../../services/schools';

const schoolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
});

type SchoolForm = z.infer<typeof schoolSchema>;

export default function SchoolCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: SchoolForm) => schoolService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schools'] }); navigate('/schools'); },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { name: '', address: '', phone: '', email: '' },
  });

  return (
    <Box>
      <PageHeader title="Add School" subtitle="Create a new school" showBack backTo="/schools" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create school</Alert>}
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12}><TextField fullWidth label="School Name" error={!!errors.name} helperText={errors.name?.message} {...register('name')} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Address" error={!!errors.address} helperText={errors.address?.message} {...register('address')} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Email" error={!!errors.email} helperText={errors.email?.message} {...register('email')} /></Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/schools')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Create School</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
