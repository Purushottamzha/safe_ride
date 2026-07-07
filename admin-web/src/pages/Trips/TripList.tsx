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
  Chip,
  Button,
  Typography,
} from '@mui/material';
import {
  Visibility,
  PlayArrow,
  CheckCircle,
  Cancel,
  Add,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { tripService } from '../../services/trips';
import type { Trip } from '../../types';

export default function TripList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionTarget, setActionTarget] = useState<{ id: string; action: 'start' | 'complete' | 'cancel' } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trips', page, limit, search, statusFilter, typeFilter],
    queryFn: () => tripService.list({
      page: page + 1,
      limit,
      search: search || undefined,
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
    onError: () => setErrorMessage('Failed to update trip'),
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trips = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleAction = (action: 'start' | 'complete' | 'cancel', id: string) => {
    if (action === 'cancel') {
      setActionTarget({ id, action });
    } else {
      actionMutation.mutate({ id, action });
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'start': return 'Start Trip';
      case 'complete': return 'Complete Trip';
      case 'cancel': return 'Cancel Trip';
      default: return 'Confirm';
    }
  };

  const driverName = (trip: Trip) => {
    if (!trip.driver) return '-';
    return `${trip.driver.firstName} ${trip.driver.lastName}`;
  };

  const formattedDate = (trip: Trip) => {
    if (!trip.scheduledAt) return '-';
    return new Date(trip.scheduledAt).toLocaleDateString();
  };

  const columns: Column<Trip>[] = [
    {
      id: 'driver',
      label: 'Driver',
      render: (row) => (
        <Typography variant="body2" fontWeight={500}>
          {driverName(row)}
        </Typography>
      ),
    },
    { id: 'bus', label: 'Bus', render: (row) => row.bus?.plateNumber ?? '-' },
    { id: 'route', label: 'Route', render: (row) => row.route?.name ?? '-' },
    { id: 'date', label: 'Scheduled Date', render: (row) => formattedDate(row) },
    {
      id: 'type',
      label: 'Type',
      render: (row) => (
        <Chip
          label={row.type === 'MORNING' ? 'Morning' : 'Afternoon'}
          size="small"
          color={row.type === 'MORNING' ? 'info' : 'secondary'}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      ),
    },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status.toLowerCase()} /> },
    {
      id: 'actions',
      label: 'Actions',
      width: 180,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/trips/${row.id}`); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'SCHEDULED' && (
            <Tooltip title="Start Trip">
              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('start', row.id); }}>
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === 'ACTIVE' && (
            <Tooltip title="Complete Trip">
              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('complete', row.id); }}>
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(row.status === 'SCHEDULED' || row.status === 'ACTIVE') && (
            <Tooltip title="Cancel">
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleAction('cancel', row.id); }}>
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Trips"
        subtitle={`${total} total trips`}
        actions={[{ label: 'Create Trip', to: '/trips/new', variant: 'contained', icon: <Add /> }]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="SCHEDULED">Scheduled</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </TextField>
        <TextField select size="small" label="Type" value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="MORNING">Morning</MenuItem>
          <MenuItem value="AFTERNOON">Afternoon</MenuItem>
        </TextField>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>
        }>
          {(error as any)?.message ?? 'Failed to load trips'}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={trips}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search trips..."
        hideSearch
        emptyMessage="No trips found"
        emptyDescription="Try adjusting your filters or create a new trip."
        onRowClick={(row) => navigate(`/trips/${row.id}`)}
      />

      <ConfirmDialog
        open={!!actionTarget}
        title={getActionLabel(actionTarget?.action ?? '')}
        message={`Are you sure you want to ${actionTarget?.action ?? ''} this trip?`}
        confirmLabel={getActionLabel(actionTarget?.action ?? '')}
        confirmColor={actionTarget?.action === 'cancel' ? 'error' : 'primary'}
        isLoading={actionMutation.isPending}
        onConfirm={() => actionTarget && actionMutation.mutate({ id: actionTarget.id, action: actionTarget.action })}
        onCancel={() => setActionTarget(null)}
      />
    </motion.div>
  );
}
