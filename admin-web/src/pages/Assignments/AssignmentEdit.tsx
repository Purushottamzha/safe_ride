import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Card, CardContent, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignments';
import { schoolService } from '../../services/schools';
import { routeService } from '../../services/routes';
import { useAuthStore } from '../../store/authStore';

const assignmentSchema = z.object({
  name: z.string().min(1, 'Assignment name is required'),
  schoolId: z.string().min(1, 'School is required'),
  routeId: z.string().min(1, 'Route is required'),
  isActive: z.string().optional(),
});

type AssignmentForm = z.infer<typeof assignmentSchema>;

export default function AssignmentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => assignmentService.getById(id!),
    enabled: !!id,
  });

  const { data: schools } = useQuery({ queryKey: ['schools'], queryFn: () => schoolService.list({ limit: 50 }) });
  const { data: routes } = useQuery({ queryKey: ['routes'], queryFn: () => routeService.list({ limit: 100 }) });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    values: assignment ? {
      name: assignment.name || '',
      schoolId: assignment.schoolId,
      routeId: assignment.routeId,
      isActive: String(assignment.isActive),
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: AssignmentForm) => assignmentService.update(id!, { ...data, isActive: data.isActive === 'true' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignments'] }); navigate('/assignments'); },
  });

  const schoolId = watch('schoolId');
  const filteredRoutes = routes?.data?.filter((r) => !schoolId || r.schoolId === schoolId) ?? [];

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!assignment) return <Alert severity="warning">Assignment not found</Alert>;

  return (
    <Box>
      <PageHeader title="Edit Assignment" subtitle={assignment.name || 'Update assignment details'} showBack backTo="/assignments" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update assignment</Alert>}
              <Box component="form" onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Assignment Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select fullWidth label="School" {...register('schoolId')} error={!!errors.schoolId} helperText={errors.schoolId?.message} disabled={!isSuperAdmin}>
                      <MenuItem value="">Select School</MenuItem>
                      {schools?.data?.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select fullWidth label="Route" {...register('routeId')} error={!!errors.routeId} helperText={errors.routeId?.message}>
                      <MenuItem value="">Select Route</MenuItem>
                      {filteredRoutes.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} ({r.code})</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select fullWidth label="Status" {...register('isActive')}>
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <LoadingButton variant="contained" type="submit" loading={updateMutation.isPending}>Save Changes</LoadingButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
