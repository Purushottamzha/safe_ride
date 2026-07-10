import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Avatar, Chip, Divider, Stack, Button, Skeleton,
} from '@mui/material';
import { Phone, Email, Badge, ArrowBack, LocalHospital } from '@mui/icons-material';
import { getStudentById } from '@/services/students';

export default function DriverDetails() {
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
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  if (error || !student?.driver) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Card><CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No driver information available</Typography>
        </CardContent></Card>
      </Box>
    );
  }

  const driver = student.driver;

  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 700 }}>
            {driver.name?.charAt(0) || 'D'}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{driver.name}</Typography>
          <Chip label="Driver" color="primary" size="small" sx={{ mt: 1 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Contact Information</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Phone color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography variant="body2">{driver.phone || 'Not available'}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Email color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2">{driver.email || 'Not available'}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Badge color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">License Number</Typography>
                <Typography variant="body2">{driver.licenseNumber || 'Not available'}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <LocalHospital color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Emergency Contact</Typography>
                <Typography variant="body2">{driver.emergencyContact || 'Not available'}</Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
