import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Divider, Skeleton, Alert, Avatar,
} from '@mui/material';
import { Phone, ArrowBack, LocalHospital, School, Person } from '@mui/icons-material';
import { getStudentById } from '@/services/students';

export default function EmergencyContacts() {
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
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">Failed to load emergency contacts</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Emergency Contacts
      </Typography>

      {student?.driver && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{student.driver.name}</Typography>
                <Typography variant="caption" color="text.secondary">Driver</Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Button
              fullWidth variant="outlined" startIcon={<Phone />}
              href={`tel:${student.driver.phone}`}
              sx={{ mb: 1 }}
            >
              Call Driver: {student.driver.phone || 'N/A'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}><School /></Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>School Transport Office</Typography>
              <Typography variant="caption" color="text.secondary">{student?.school || 'School'}</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Button fullWidth variant="outlined" startIcon={<Phone />} href="tel:100" sx={{ mb: 1 }}>
            Call Transport Office
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'error.main' }}><LocalHospital /></Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Emergency Services</Typography>
              <Typography variant="caption" color="text.secondary">24/7 Emergency</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Button fullWidth variant="contained" color="error" startIcon={<Phone />} href="tel:112">
            Call Emergency (112)
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
