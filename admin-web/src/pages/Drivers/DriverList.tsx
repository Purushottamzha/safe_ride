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
  Typography,
  Button,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { driverService } from '../../services/drivers';
import type { Driver } from '../../types';

function getLicenseExpiryInfo(expiry: string): { label: string; color: 'success' | 'warning' | 'error' } | null {
  if (!expiry) return null;
  const now = new Date();
  const expDate = new Date(expiry);
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Expired ${Math.abs(diffDays)}d ago`, color: 'error' };
  if (diffDays <= 30) return { label: `Expires in ${diffDays}d`, color: 'warning' };
  return null;
}

export default function DriverList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['drivers', page, limit, search, statusFilter, availabilityFilter],
    queryFn: () => driverService.list({
      page: page + 1,
      limit,
      search: search || undefined,
      status: (statusFilter as any) || undefined,
      isAvailable: availabilityFilter ? availabilityFilter === 'true' : undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteId(null);
    },
    onError: () => setErrorMessage('Failed to delete driver'),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      driverService.update(id, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: () => setErrorMessage('Failed to toggle availability'),
  });

  const drivers = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Driver>[] = [
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <Typography variant="body2" fontWeight={500}>
          {row.user?.firstName} {row.user?.lastName}
        </Typography>
      ),
    },
    { id: 'email', label: 'Email', render: (row) => row.user?.email ?? '-' },
    { id: 'phone', label: 'Phone', render: (row) => row.user?.phone ?? '-' },
    { id: 'license', label: 'License', render: (row) => row.licenseNumber },
    {
      id: 'licenseExpiry',
      label: 'License Expiry',
      render: (row) => {
        const info = getLicenseExpiryInfo(row.licenseExpiry);
        const formatted = row.licenseExpiry
          ? new Date(row.licenseExpiry).toLocaleDateString()
          : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{formatted}</Typography>
            {info && <Chip label={info.label} color={info.color} size="small" />}
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.user?.status?.toLowerCase() ?? 'active'} />,
    },
    {
      id: 'availability',
      label: 'Available',
      render: (row) => (
        <Chip
          label={row.isAvailable ? 'Yes' : 'No'}
          color={row.isAvailable ? 'success' : 'default'}
          size="small"
          variant={row.isAvailable ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 160,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/drivers/${row.id}`); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/drivers/${row.id}/edit`); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.isAvailable ? 'Mark Unavailable' : 'Mark Available'}>
            <IconButton
              size="small"
              color={row.isAvailable ? 'warning' : 'success'}
              onClick={(e) => {
                e.stopPropagation();
                toggleAvailabilityMutation.mutate({ id: row.id, isAvailable: !row.isAvailable });
              }}
            >
              {row.isAvailable ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
            </IconButton>
          </Tooltip>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Drivers"
        subtitle={`${total} total drivers`}
        actions={[{ label: 'Add Driver', to: '/drivers/new', variant: 'contained', icon: <Add /> }]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
          <MenuItem value="SUSPENDED">Suspended</MenuItem>
        </TextField>
        <TextField select size="small" label="Availability" value={availabilityFilter}
          onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Available</MenuItem>
          <MenuItem value="false">Unavailable</MenuItem>
        </TextField>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Box component="span"><Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button></Box>
        }>
          {(error as any)?.message ?? 'Failed to load drivers'}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={drivers}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search by name, email, or license..."
        emptyMessage="No drivers found"
        emptyDescription="Try adjusting your search or filters, or add a new driver."
        onRowClick={(row) => navigate(`/drivers/${row.id}`)}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}
