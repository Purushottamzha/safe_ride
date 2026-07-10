import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { parentService, type UpdateParentPayload } from '../../services/parents';

const parentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  emergencyContact: z.boolean().default(false),
});

type ParentForm = z.infer<typeof parentSchema>;

export default function ParentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: parent, isLoading: loadingParent } = useQuery({
    queryKey: ['parent', id],
    queryFn: () => parentService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateParentPayload) => parentService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['parent', id] });
      navigate(`/parents/${id}`);
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ParentForm>({
    resolver: zodResolver(parentSchema),
    values: parent ? {
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      phone: parent.user.phone ?? '',
      emergencyContact: parent.emergencyContact,
    } : undefined,
  });

  const emergencyContact = watch('emergencyContact');

  const onSubmit = (data: ParentForm) => updateMutation.mutate(data);

  if (loadingParent) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/parents" />
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></CardContent></Card>
      </Box>
    );
  }

  if (!parent) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/parents" />
        <Alert severity="warning">Parent not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Edit Parent" subtitle={`${parent.user.firstName} ${parent.user.lastName}`} showBack backTo={`/parents/${id}`} />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update parent</Alert>}
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
                <FormControlLabel
                  control={<Switch checked={emergencyContact} onChange={(e) => setValue('emergencyContact', e.target.checked)} />}
                  label="Emergency Contact"
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
              <LoadingButton variant="outlined" color="inherit" onClick={() => navigate(`/parents/${id}`)}>Cancel</LoadingButton>
              <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
