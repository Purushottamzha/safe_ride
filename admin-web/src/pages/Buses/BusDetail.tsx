import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Edit, DirectionsBus, Speed, CalendarMonth, Refresh, School } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { busService } from '../../services/buses';
import type { Bus } from '../../types';

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

export default function BusDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: bus, isLoading, error, refetch } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => busService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Bus Details" showBack backTo="/buses" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load bus data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/buses" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={520} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!bus) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/buses" />
        <Alert severity="warning">Bus not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Bus ${bus.busNumber}`}
        subtitle={`${bus.plateNumber} - ${bus.school?.name ?? ''}`}
        showBack backTo="/buses"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/buses/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, mb: 2.5 }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <DirectionsBus sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Bus {bus.busNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">{bus.plateNumber}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <StatusBadge status={bus.status?.toLowerCase() ?? 'active'} />
                  </Stack>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<DirectionsBus fontSize="small" />} label="Bus Number" value={bus.busNumber} />
                <InfoLine icon={<DirectionsBus fontSize="small" />} label="Plate Number" value={bus.plateNumber} />
                <InfoLine icon={<Speed fontSize="small" />} label="Model" value={bus.model || '-'} />
                <InfoLine icon={<Speed fontSize="small" />} label="Capacity" value={`${bus.capacity} passengers`} />
                <InfoLine icon={<CalendarMonth fontSize="small" />} label="Year" value={bus.year?.toString() || '-'} />
                <InfoLine icon={<Speed fontSize="small" />} label="Color" value={bus.color || '-'} />
                <InfoLine icon={<School fontSize="small" />} label="School" value={bus.school?.name} />
                {bus.lastGpsLat && bus.lastGpsLng && (
                  <InfoLine icon={<Speed fontSize="small" />} label="Last GPS" value={`${bus.lastGpsLat.toFixed(4)}, ${bus.lastGpsLng.toFixed(4)}`} />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
