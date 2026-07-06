import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Visibility,
  PlayArrow,
  CheckCircle,
  Cancel,
  Add,
} from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { tripService } from '../../services/trips';
import type { TripStatus as TripType } from '../../types';

export default function TripList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionTarget, setActionTarget] = useState<{ id: string; action: 'start' | 'complete' | 'cancel' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', page, limit, statusFilter, typeFilter],
    queryFn: () => tripService.list({
      page: page + 1,
      limit,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      if (action === 'start') return tripService.startTrip(id);
      if (action === 'complete') return tripService.completeTrip(id);
      return tripService.cancelTrip(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setActionTarget(null);
    },
  });

  const trips = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleAction = (action: 'start' | 'complete' | 'cancel', id: string) => {
    if (action === 'cancel') {
      setActionTarget({ id, action });
    } else {
      actionMutation.mutate({ id, action });
    }
  };

  const columns: Column<TripType>[] = [
    { id: 'date', label: 'Date', render: (row) => row.date, sortable: true },
    { id: 'type', label: 'Type', render: (row) => <StatusBadge status={row.type} /> },
    { id: 'driver', label: 'Driver', render: (row) => row.driver?.name ?? '-' },
    { id: 'bus', label: 'Bus', render: (row) => row.bus?.plateNumber ?? '-' },
    { id: 'route', label: 'Route', render: (row) => row.route?.name ?? '-' },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      label: 'Actions',
      width: 180,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/trips/${row.id}`); }}><Visibility fontSize="small" /></IconButton></Tooltip>
          {row.status === 'scheduled' && (
            <Tooltip title="Start"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('start', row.id); }}><PlayArrow fontSize="small" /></IconButton></Tooltip>
          )}
          {row.status === 'in_progress' && (
            <Tooltip title="Complete"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('complete', row.id); }}><CheckCircle fontSize="small" /></IconButton></Tooltip>
          )}
          {(row.status === 'scheduled' || row.status === 'in_progress') && (
            <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleAction('cancel', row.id); }}><Cancel fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Trips" subtitle={`${total} total trips`}
        actions={[{ label: 'New Trip', to: '/trips/new', variant: 'contained', icon: <Add /> }]} />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
        <TextField select size="small" label="Type" value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 120 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="morning">Morning</MenuItem>
          <MenuItem value="evening">Evening</MenuItem>
        </TextField>
      </Stack>
      <DataTable columns={columns} data={trips} total={total} page={page} limit={limit}
        loading={isLoading} hideSearch
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        onRowClick={(row) => navigate(`/trips/${row.id}`)} />
      {actionMutation.isError && <Alert severity="error" sx={{ mt: 2 }}>Failed to update trip</Alert>}
      <ConfirmDialog open={!!actionTarget && actionTarget!.action === 'cancel'} title="Cancel Trip"
        message="Are you sure you want to cancel this trip?"
        confirmLabel="Cancel Trip" confirmColor="error"
        isLoading={actionMutation.isPending}
        onConfirm={() => actionTarget && actionMutation.mutate({ id: actionTarget.id, action: 'cancel' })}
        onCancel={() => setActionTarget(null)} />
    </Box>
  );
}
