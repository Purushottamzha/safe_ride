import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Alert } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { schoolService } from '../../services/schools';
import type { School } from '../../types';

export default function SchoolList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['schools', page, limit, search],
    queryFn: () => schoolService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schools'] }); setDeleteId(null); },
  });

  const schools = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<School>[] = [
    { id: 'name', label: 'School Name', render: (row) => row.name, sortable: true },
    { id: 'address', label: 'Address', render: (row) => row.address },
    { id: 'phone', label: 'Phone', render: (row) => row.phone },
    { id: 'email', label: 'Email', render: (row) => row.email },
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
      <PageHeader title="Schools" subtitle={`${total} total schools`}
        actions={[{ label: 'Add School', to: '/schools/new', variant: 'contained', icon: <Add /> }]} />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete school</Alert>}
      <DataTable columns={columns} data={schools} total={total} page={page} limit={limit}
        loading={isLoading} search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search by name..." />
      <ConfirmDialog open={!!deleteId} title="Delete School" message="Are you sure you want to delete this school?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
