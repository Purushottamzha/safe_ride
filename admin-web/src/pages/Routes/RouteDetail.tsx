import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Route as RouteIcon, Speed, Refresh, School } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { routeService } from '../../services/routes';

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

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: route, isLoading, error, refetch } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routeService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Route Details" showBack backTo="/routes" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load route data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/routes" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!route) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/routes" />
        <Alert severity="warning">Route not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={route.name}
        subtitle={`Code: ${route.code} - ${route.school?.name ?? ''}`}
        showBack backTo="/routes"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, mb: 2.5 }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: 2,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RouteIcon sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{route.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{route.code}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <StatusBadge status={route.isActive ? 'active' : 'inactive'} />
                    {route.direction && <Chip size="small" label={route.direction} variant="outlined" />}
                  </Stack>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<RouteIcon fontSize="small" />} label="Route Name" value={route.name} />
                <InfoLine icon={<RouteIcon fontSize="small" />} label="Route Code" value={route.code} />
                <InfoLine icon={<RouteIcon fontSize="small" />} label="Direction" value={route.direction || '-'} />
                <InfoLine icon={<Speed fontSize="small" />} label="Distance" value={route.distance ? `${route.distance} km` : '-'} />
                <InfoLine icon={<Speed fontSize="small" />} label="Duration" value={route.duration ? `${route.duration} min` : '-'} />
                <InfoLine icon={<School fontSize="small" />} label="School" value={route.school?.name} />
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Stops ({route.stops?.length ?? 0})</Typography>
              {(!route.stops || route.stops.length === 0) ? (
                <Typography variant="body2" color="text.secondary">No stops assigned to this route</Typography>
              ) : (
                <Stack spacing={1}>
                  {route.stops.map((stop, idx) => (
                    <Box key={stop.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
                      <Chip size="small" label={idx + 1} color="primary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{stop.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{stop.address}</Typography>
                      </Box>
                      {stop.latitude && stop.longitude && (
                        <Typography variant="caption" color="text.secondary">
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
