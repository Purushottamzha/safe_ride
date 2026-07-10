import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Edit,
  Email,
  Phone,
  FamilyRestroom,
  Refresh,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { parentService } from '../../services/parents';
import type { Parent } from '../../types';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const getInitials = (parent: Parent) =>
  `${parent.user.firstName.charAt(0)}${parent.user.lastName.charAt(0)}`.toUpperCase();

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

export default function ParentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: parent, isLoading, error, refetch } = useQuery({
    queryKey: ['parent', id],
    queryFn: () => parentService.getById(id!),
    enabled: !!id,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Parent Details" showBack backTo="/parents" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load parent data
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/parents" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={400} /></Grid>
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!parent) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/parents" />
        <Alert severity="warning">Parent not found</Alert>
      </Box>
    );
  }

  const children = (parent as any).parentStudents ?? [];

  return (
    <Box>
      <PageHeader
        title={`${parent.user.firstName} ${parent.user.lastName}`}
        subtitle={`${parent.user.email}`}
        showBack backTo="/parents"
        actions={[{ label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/parents/${id}/edit`) }]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}>
                  {getInitials(parent)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {parent.user.firstName} {parent.user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{parent.user.email}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <StatusBadge status={parent.user.status?.toLowerCase() ?? 'active'} />
                    {parent.emergencyContact && <Chip size="small" color="warning" label="Emergency Contact" variant="outlined" />}
                  </Stack>
                </Box>
              </Box>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={2}>
                <InfoLine icon={<Email fontSize="small" />} label="Email" value={parent.user.email} />
                <InfoLine icon={<Phone fontSize="small" />} label="Phone" value={parent.user.phone} />
                <InfoLine icon={<FamilyRestroom fontSize="small" />} label="Role" value={parent.user.role?.replace('_', ' ')} />
                <InfoLine icon={<FamilyRestroom fontSize="small" />} label="Linked Children" value={children.length.toString()} />
                <InfoLine icon={<FamilyRestroom fontSize="small" />} label="Created" value={formatDate(parent.createdAt)} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Linked Children</Typography>
              {children.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No children linked to this parent</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {children.map((link: any) => (
                    <Box key={link.studentId} sx={{
                      p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                      display: 'flex', alignItems: 'center', gap: 2,
                      '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                    }} onClick={() => navigate(`/students/${link.studentId}`)}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
                        {link.student?.firstName?.charAt(0)}{link.student?.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {link.student?.firstName} {link.student?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {link.relation} {link.isPrimary ? '(Primary)' : ''}
                        </Typography>
                      </Box>
                      <Chip size="small" label={link.relation} variant="outlined" />
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
