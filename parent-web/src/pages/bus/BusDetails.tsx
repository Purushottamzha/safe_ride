import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Divider, Stack, Button, Skeleton,
} from '@mui/material';
import { DirectionsBus, Speed, ArrowBack, ColorLens } from '@mui/icons-material';
import { getStudentById } from '@/services/students';

export default function BusDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (error || !student?.bus) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No bus information available</Typography>
        </CardContent></Card>
      </Box>
    );
  }

  const bus = student.bus;

  const statusColor = bus.status === 'ACTIVE' ? 'success' : bus.status === 'MAINTENANCE' ? 'warning' : 'default';

  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{
            width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: 2,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DirectionsBus sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Bus {bus.busNumber}</Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
            <Chip label={bus.plateNumber} variant="outlined" size="small" />
            <Chip label={bus.status || 'ACTIVE'} color={statusColor} size="small" />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Vehicle Details</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <DirectionsBus color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Bus Number</Typography>
                <Typography variant="body2">{bus.busNumber}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Speed color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Plate Number</Typography>
                <Typography variant="body2">{bus.plateNumber}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Speed color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Model</Typography>
                <Typography variant="body2">{bus.model || 'Not available'}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <ColorLens color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Color</Typography>
                <Typography variant="body2">{bus.color || 'Not available'}</Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
