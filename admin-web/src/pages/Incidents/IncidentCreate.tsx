import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { incidentService } from '../../services/incidents';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.string().min(1, 'Severity is required'),
  location: z.string().optional(),
});

type IncidentForm = z.infer<typeof incidentSchema>;

export default function IncidentCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => incidentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      navigate('/incidents');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { title: '', description: '', severity: 'MEDIUM', location: '' },
  });

  const onSubmit = (data: IncidentForm) => createMutation.mutate(data);

  return (
    <Box>
      <PageHeader title="Report Incident" subtitle="Create a new incident report" showBack backTo="/incidents" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {createMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to create incident</Alert>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField fullWidth label="Title" error={!!errors.title} helperText={errors.title?.message} {...register('title')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Severity" select error={!!errors.severity} helperText={errors.severity?.message} {...register('severity')}>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Location" error={!!errors.location} helperText={errors.location?.message} {...register('location')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={4} error={!!errors.description} helperText={errors.description?.message} {...register('description')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate('/incidents')}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={createMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Report Incident</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
