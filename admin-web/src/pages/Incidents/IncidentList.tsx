import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  MenuItem,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Visibility, Edit, Delete, CheckCircle, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { incidentService } from '../../services/incidents';
import type { Incident } from '../../types';

export default function IncidentList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', page, limit, statusFilter, severityFilter],
    queryFn: () =>
      incidentService.list({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setDeleteId(null); },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) => incidentService.resolve(id, resolution),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setResolveDialog(null); setResolution(''); },
  });

  const incidents = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Incident>[] = [
    { id: 'title', label: 'Title', render: (row) => row.title, sortable: true },
    { id: 'severity', label: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { id: 'reportedBy', label: 'Reported By', render: (row) => row.reporter?.name ?? '-' },
    { id: 'trip', label: 'Trip', render: (row) => row.trip?.date ?? '-' },
    { id: 'date', label: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString(), sortable: true },
    {
      id: 'actions', label: 'Actions', width: 140,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View"><IconButton size="small"><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          {(row.status === 'open' || row.status === 'investigating') && (
            <Tooltip title="Resolve">
              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); setResolveDialog(row.id); }}>
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Incidents" subtitle={`${total} total incidents`}
        actions={[{ label: 'Report Incident', variant: 'contained', icon: <Add /> }]} />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="investigating">Investigating</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>
        <TextField select size="small" label="Severity" value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Severity</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </TextField>
      </Stack>
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete incident</Alert>}
      <DataTable columns={columns} data={incidents} total={total} page={page} limit={limit}
        loading={isLoading} hideSearch
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }} />
      <ConfirmDialog open={!!deleteId} title="Delete Incident" message="Are you sure you want to delete this incident?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
      <Dialog open={!!resolveDialog} onClose={() => { setResolveDialog(null); setResolution(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Resolve Incident</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Provide a resolution summary for this incident.</Typography>
          <TextField fullWidth multiline rows={4} placeholder="Describe the resolution..." value={resolution}
            onChange={(e) => setResolution(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => { setResolveDialog(null); setResolution(''); }}>Cancel</Button>
          <Button variant="contained" color="success" disabled={!resolution.trim() || resolveMutation.isPending}
            onClick={() => resolveDialog && resolveMutation.mutate({ id: resolveDialog, resolution })}>
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
