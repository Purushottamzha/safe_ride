import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Edit, Refresh, LocationOn, Home, School } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { stopService } from '../../services/stops';

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

export default function StopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stop, isLoading, error, refetch } = useQuery({
    queryKey: ['stop', id],
    queryFn: () => stopService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Stop Details" showBack backTo="/stops" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load stop data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/stops" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!stop) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/stops" />
        <Alert severity="warning">Stop not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={stop.name}
        subtitle={stop.address || 'No address'}
        showBack backTo="/stops"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/stops/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Stop Information</Typography>
              <Stack spacing={2}>
                <InfoLine icon={<LocationOn fontSize="small" />} label="Name" value={stop.name} />
                <InfoLine icon={<Home fontSize="small" />} label="Address" value={stop.address} />
                <InfoLine icon={<LocationOn fontSize="small" />} label="Latitude" value={stop.latitude?.toString()} />
                <InfoLine icon={<LocationOn fontSize="small" />} label="Longitude" value={stop.longitude?.toString()} />
                <InfoLine icon={<School fontSize="small" />} label="School" value={stop.school?.name} />
              </Stack>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <InfoLine icon={<LocationOn fontSize="small" />} label="Status" value={stop.isActive ? 'Active' : 'Inactive'} />
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<LocationOn fontSize="small" />} label="Created" value={formatDate(stop.createdAt)} />
                <InfoLine icon={<LocationOn fontSize="small" />} label="Updated" value={formatDate(stop.updatedAt)} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
