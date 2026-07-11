import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Chip, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Edit, Email, Phone, Badge, CalendarMonth, Refresh, School, Person } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import StatusBadge from '../../components/common/StatusBadge';
import { driverService } from '../../services/drivers';
import type { Driver } from '../../types';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getInitials = (driver: Driver) =>
  `${driver.user.firstName.charAt(0)}${driver.user.lastName.charAt(0)}`.toUpperCase();

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

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: driver, isLoading, error, refetch } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Driver Details" showBack backTo="/drivers" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load driver data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/drivers" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={520} /></Grid>
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={320} /></Grid>
        </Grid>
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
      <PageHeader
        title={`${driver.user.firstName} ${driver.user.lastName}`}
        subtitle={`License: ${driver.licenseNumber} - ${driver.school?.name ?? ''}`}
        showBack backTo="/drivers"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/drivers/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <GlassCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25 }}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}>
                {getInitials(driver)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{driver.user.firstName} {driver.user.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{driver.user.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <StatusBadge status={driver.user.status?.toLowerCase() ?? 'active'} />
                  <Chip size="small" label={driver.isAvailable ? 'Available' : 'Unavailable'}
                    color={driver.isAvailable ? 'success' : 'default'} variant="outlined" />
                </Stack>
              </Box>
            </Box>
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={2}>
              <InfoLine icon={<Person fontSize="small" />} label="Full Name" value={`${driver.user.firstName} ${driver.user.lastName}`} />
              <InfoLine icon={<Email fontSize="small" />} label="Email" value={driver.user.email} />
              <InfoLine icon={<Phone fontSize="small" />} label="Phone" value={driver.user.phone} />
              <InfoLine icon={<Badge fontSize="small" />} label="License Number" value={driver.licenseNumber} />
              <InfoLine icon={<CalendarMonth fontSize="small" />} label="License Expiry" value={formatDate(driver.licenseExpiry)} />
              <InfoLine icon={<Phone fontSize="small" />} label="Emergency Contact" value={driver.emergencyContact} />
              <InfoLine icon={<School fontSize="small" />} label="School" value={driver.school?.name} />
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
