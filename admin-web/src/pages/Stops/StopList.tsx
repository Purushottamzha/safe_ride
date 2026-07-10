import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Tooltip, Alert, Button, Typography,
} from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { stopService } from '../../services/stops';
import type { Stop } from '../../types';

export default function StopList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stops', page, limit],
    queryFn: () => stopService.list({ page: page + 1, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stopService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      setDeleteId(null);
    },
  });

  const stops = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Stop>[] = [
    { id: 'name', label: 'Name', render: (row) => <Typography variant="body2" fontWeight={500}>{row.name}</Typography> },
    { id: 'address', label: 'Address', render: (row) => row.address || '-' },
    {
      id: 'coordinates',
      label: 'Coordinates',
      render: (row) => row.latitude && row.longitude
        ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
        : '-',
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/stops/${row.id}`); }}><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/stops/${row.id}/edit`); }}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Stops" subtitle={`${total} total stops`}
        actions={[{ label: 'Add Stop', to: '/stops/new', variant: 'contained', icon: <Add /> }]}
      />
      {isError && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>{(error as any)?.message ?? 'Failed to load stops'}</Alert>}
      <DataTable columns={columns} data={stops} total={total} page={page} limit={limit} loading={isLoading}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        onRowClick={(row) => navigate(`/stops/${row.id}`)}
        emptyMessage="No stops found" emptyDescription="Add a new stop to get started."
      />
      <ConfirmDialog open={!!deleteId} title="Delete Stop" message="Are you sure?" confirmLabel="Delete"
        isLoading={deleteMutation.isPending} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
