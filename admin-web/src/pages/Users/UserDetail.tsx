import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Edit, Email, Phone, School, Refresh, Person } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { userService } from '../../services/users';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', mt: 0.25 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>
      </Box>
    </Box>
  );
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="User Details" showBack backTo="/users" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load user data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/users" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/users" />
        <Alert severity="warning">User not found</Alert>
      </Box>
    );
  }

  const avatarLetter = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <Box>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={user.email}
        showBack backTo="/users"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/users/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}>
                  {avatarLetter}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{user.firstName} {user.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <StatusBadge status={user.status?.toLowerCase() ?? 'active'} />
                    <Chip size="small" label={user.role?.replace('_', ' ')} color="primary" variant="outlined" />
                  </Stack>
                </Box>
              </Box>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<Person fontSize="small" />} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
                <InfoLine icon={<Email fontSize="small" />} label="Email" value={user.email} />
                <InfoLine icon={<Phone fontSize="small" />} label="Phone" value={user.phone} />
                <InfoLine icon={<School fontSize="small" />} label="School" value={user.school?.name || 'N/A'} />
                <InfoLine icon={<Person fontSize="small" />} label="Role" value={user.role?.replace('_', ' ')} />
                <InfoLine icon={<Person fontSize="small" />} label="Created" value={formatDate(user.createdAt)} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
