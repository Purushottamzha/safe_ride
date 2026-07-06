import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Alert, Typography } from '@mui/material';
import { Edit, Delete, Add, Route as RouteIcon } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { routeService } from '../../services/routes';
import type { Route } from '../../types';

export default function RouteList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['routes', page, limit],
    queryFn: () => routeService.list({ page: page + 1, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routeService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routes'] }); setDeleteId(null); },
  });

  const routes = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Route>[] = [
    { id: 'name', label: 'Route Name', render: (row) => <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><RouteIcon fontSize="small" color="action" /><Typography variant="body2">{row.name}</Typography></Box>, sortable: true },
    { id: 'description', label: 'Description', render: (row) => row.description ?? '-' },
    { id: 'stops', label: 'Stops', render: (row) => row.stops?.length ?? 0 },
    { id: 'school', label: 'School', render: (row) => row.school?.name ?? '-' },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      id: 'actions', label: 'Actions', width: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit"><IconButton size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Routes" subtitle={`${total} total routes`}
        actions={[{ label: 'Add Route', variant: 'contained', icon: <Add /> }]} />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete route</Alert>}
      <DataTable columns={columns} data={routes} total={total} page={page} limit={limit}
        loading={isLoading} search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search by name..." />
      <ConfirmDialog open={!!deleteId} title="Delete Route" message="Are you sure you want to delete this route?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
