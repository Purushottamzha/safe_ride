import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import { Refresh, Person, CalendarMonth, ReportProblem, LocationOn } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { incidentService } from '../../services/incidents';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const { data: incident, isLoading, error, refetch } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentService.getById(id!),
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: () => incidentService.resolve(id!, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      setResolveOpen(false);
    },
  });

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'error' => {
    switch (severity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': case 'CRITICAL': return 'error';
      default: return 'warning';
    }
  };

  if (error) {
    return (
      <Box>
        <PageHeader title="Incident Details" showBack backTo="/incidents" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load incident data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/incidents" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!incident) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/incidents" />
        <Alert severity="warning">Incident not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={incident.title}
        subtitle={`Reported ${formatDateTime(incident.createdAt)}`}
        showBack backTo="/incidents"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, mb: 2.5 }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: 2,
                  background: incident.severity === 'CRITICAL' || incident.severity === 'HIGH'
                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ReportProblem sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{incident.title}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip size="small" label={incident.severity} color={getSeverityColor(incident.severity)} />
                    <StatusBadge status={incident.status?.toLowerCase() ?? 'reported'} />
                  </Stack>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<ReportProblem fontSize="small" />} label="Description" value={incident.description} />
                <InfoLine icon={<LocationOn fontSize="small" />} label="Location" value={incident.location || '-'} />
                <InfoLine icon={<Person fontSize="small" />} label="Reported By" value={`${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`} />
                <InfoLine icon={<CalendarMonth fontSize="small" />} label="Reported At" value={formatDateTime(incident.createdAt)} />
                {incident.resolution && (
                  <InfoLine icon={<ReportProblem fontSize="small" />} label="Resolution" value={incident.resolution} />
                )}
                {incident.resolvedAt && (
                  <InfoLine icon={<CalendarMonth fontSize="small" />} label="Resolved At" value={formatDateTime(incident.resolvedAt)} />
                )}
              </Stack>
              {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                <Box sx={{ mt: 3 }}>
                  <Button variant="contained" color="primary" onClick={() => setResolveOpen(true)}>
                    Resolve Incident
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Incident</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline rows={3} label="Resolution Notes"
            value={resolution} onChange={(e) => setResolution(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)}>Cancel</Button>
          <Button onClick={() => resolveMutation.mutate()} variant="contained"
            disabled={!resolution.trim() || resolveMutation.isPending}>
            {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
