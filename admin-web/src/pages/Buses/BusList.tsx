import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Alert } from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { busService } from '../../services/buses';
import type { Bus } from '../../types';

export default function BusList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['buses', page, limit, search],
    queryFn: () => busService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => busService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buses'] }); setDeleteId(null); },
  });

  const buses = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Bus>[] = [
    { id: 'plateNumber', label: 'Plate Number', render: (row) => row.plateNumber, sortable: true },
    { id: 'model', label: 'Model', render: (row) => row.model },
    { id: 'capacity', label: 'Capacity', render: (row) => row.capacity },
    { id: 'driver', label: 'Driver', render: (row) => row.driver?.name ?? 'Unassigned' },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      id: 'actions', label: 'Actions', width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View"><IconButton size="small"><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Buses" subtitle={`${total} total buses`}
        actions={[{ label: 'Add Bus', to: '/buses/new', variant: 'contained', icon: <Add /> }]} />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete bus</Alert>}
      <DataTable columns={columns} data={buses} total={total} page={page} limit={limit}
        loading={isLoading} search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search by plate number..." />
      <ConfirmDialog open={!!deleteId} title="Delete Bus" message="Are you sure you want to delete this bus?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
