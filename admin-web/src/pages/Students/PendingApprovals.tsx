import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Avatar,
  Stack,
  Grid,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import { pendingStudentService, type PendingStudent } from '../../services/pendingStudents';
import { useAuthStore } from '../../store/authStore';

export default function PendingApprovals() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<PendingStudent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-students', page, limit],
    queryFn: () => pendingStudentService.list({ page: page + 1, limit }),
  });

  const approveMutation = useMutation({
    mutationFn: (params: { id: string; notes?: string }) =>
      pendingStudentService.approve(params.id, params.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDetailOpen(false);
      setSelected(null);
      setAdminNotes('');
      setActionType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: string; notes?: string }) =>
      pendingStudentService.reject(params.id, params.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-students'] });
      setDetailOpen(false);
      setSelected(null);
      setAdminNotes('');
      setActionType(null);
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<PendingStudent>[] = [
    {
      id: 'name',
      label: 'Name',
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { id: 'grade', label: 'Grade', render: (row) => row.grade },
    { id: 'section', label: 'Section', render: (row) => row.section || '-' },
    {
      id: 'parent',
      label: 'Parent',
      render: (row) => `${row.parent.user.firstName} ${row.parent.user.lastName}`,
    },
    {
      id: 'parentEmail',
      label: 'Parent Email',
      render: (row) => row.parent.user.email,
    },
    {
      id: 'school',
      label: 'School',
      render: (row) => row.school.name,
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          color={row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true); }}
            startIcon={<Visibility />}
          >
            Review
          </Button>
        </Box>
      ),
    },
  ];

  const handleApprove = () => {
    if (!selected) return;
    approveMutation.mutate({ id: selected.id, notes: adminNotes || undefined });
  };

  const handleReject = () => {
    if (!selected) return;
    rejectMutation.mutate({ id: selected.id, notes: adminNotes || undefined });
  };

  return (
    <Box>
      <PageHeader
        title="Pending Approvals"
        subtitle={`${total} student registration${total !== 1 ? 's' : ''} awaiting review`}
      />

      <DataTable
        columns={columns}
        data={rows}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        onRowClick={(row) => { setSelected(row); setDetailOpen(true); }}
      />

      <Dialog
        open={detailOpen && !!selected}
        onClose={() => { setDetailOpen(false); setAdminNotes(''); setActionType(null); }}
        maxWidth="sm"
        fullWidth
      >
        {selected && (
          <>
            <DialogTitle>
              Review: {selected.firstName} {selected.lastName}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                    {selected.firstName.charAt(0)}{selected.lastName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selected.firstName} {selected.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Grade {selected.grade} · Section {selected.section || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body2">{new Date(selected.dateOfBirth).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2">{selected.address}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{selected.phone || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">School</Typography>
                    <Typography variant="body2">{selected.school.name}</Typography>
                  </Grid>
                </Grid>

                <Divider />
                <Typography variant="subtitle2">Parent/Guardian</Typography>
                <Typography variant="body2">
                  {selected.parent.user.firstName} {selected.parent.user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selected.parent.user.email}
                </Typography>

                {selected.status !== 'PENDING' && (
                  <>
                    <Divider />
                    <Alert severity={selected.status === 'APPROVED' ? 'success' : 'error'}>
                      This request was {selected.status.toLowerCase()}
                      {selected.adminNotes ? `: ${selected.adminNotes}` : ''}
                    </Alert>
                  </>
                )}

                {selected.status === 'PENDING' && (
                  <>
                    <Divider />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Admin Notes (optional)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this decision..."
                    />
                  </>
                )}
              </Stack>
            </DialogContent>
            {selected.status === 'PENDING' && (
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  startIcon={<Cancel />}
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  startIcon={<CheckCircle />}
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </DialogActions>
            )}
            {selected.status !== 'PENDING' && (
              <DialogActions>
                <Button onClick={() => { setDetailOpen(false); setAdminNotes(''); }}>Close</Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
}
