import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Divider, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Edit, Email, Phone, Home, Public, Refresh, School as SchoolIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { schoolService } from '../../services/schools';

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

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: school, isLoading, error, refetch } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="School Details" showBack backTo="/schools" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load school data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/schools" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!school) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/schools" />
        <Alert severity="warning">School not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={school.name}
        subtitle={`Code: ${school.code}`}
        showBack backTo="/schools"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/schools/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25, mb: 2.5 }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: 2,
                  background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SchoolIcon sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{school.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{school.code}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<SchoolIcon fontSize="small" />} label="School Name" value={school.name} />
                <InfoLine icon={<SchoolIcon fontSize="small" />} label="School Code" value={school.code} />
                <InfoLine icon={<Home fontSize="small" />} label="Address" value={school.address} />
                <InfoLine icon={<Phone fontSize="small" />} label="Phone" value={school.phone} />
                <InfoLine icon={<Email fontSize="small" />} label="Email" value={school.email} />
                <InfoLine icon={<Public fontSize="small" />} label="Timezone" value={school.timezone} />
                <InfoLine icon={<StatusBadge status={school.isActive ? 'active' : 'inactive'} />} label="Status" value={school.isActive ? 'Active' : 'Inactive'} />
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<SchoolIcon fontSize="small" />} label="Created" value={formatDate(school.createdAt)} />
                <InfoLine icon={<SchoolIcon fontSize="small" />} label="Updated" value={formatDate(school.updatedAt)} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
