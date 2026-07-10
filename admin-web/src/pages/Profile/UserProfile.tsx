import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, TextField, Alert, CircularProgress, Avatar, Divider, Typography, Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PageHeader from '../../components/common/PageHeader';
import { userService } from '../../services/users';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function UserProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => userService.update(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMsg('Profile updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: user ? { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' } : undefined,
  });

  const onSubmit = (data: ProfileForm) => updateMutation.mutate(data);

  if (!user) {
    return (
      <Box>
        <PageHeader title="Profile" />
        <Alert severity="info">Please log in to view your profile</Alert>
      </Box>
    );
  }

  const avatarLetter = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Manage your account information" />
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
      {updateMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to update profile</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 96, height: 96, mx: 'auto', bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 800, mb: 2 }}>{avatarLetter}</Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{user.firstName} {user.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              <Chip label={user.role?.replace('_', ' ')} color="primary" size="small" sx={{ mt: 1 }} />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>User ID</Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>{user.id}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>Status</Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>{user.status}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>School</Typography>
                <Typography variant="body2">{user.school?.name ?? 'N/A'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Edit Profile</Typography>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} {...register('firstName')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} {...register('lastName')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Phone" error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
                  <LoadingButton type="submit" variant="contained" loading={updateMutation.isPending}
                    loadingIndicator={<CircularProgress size={18} color="inherit" />}>Save Changes</LoadingButton>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
