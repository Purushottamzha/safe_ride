import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { userService } from '../../services/users';
import type { User } from '../../types';

export default function UserList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => userService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null); },
  });

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<User>[] = [
    { id: 'name', label: 'Name', render: (row) => `${row.firstName} ${row.lastName}`, sortable: true },
    { id: 'email', label: 'Email', render: (row) => row.email },
    { id: 'role', label: 'Role', render: (row) => <Chip label={row.role.replace('_', ' ')} size="small" variant="outlined" /> },
    { id: 'school', label: 'School', render: (row) => row.school?.name ?? '-' },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status === 'ACTIVE' ? 'active' : 'inactive'} /> },
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
      <PageHeader title="Users" subtitle={`${total} total users`} />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete user</Alert>}
      <DataTable columns={columns} data={users} total={total} page={page} limit={limit}
        loading={isLoading} search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }}
        searchPlaceholder="Search by name..." />
      <ConfirmDialog open={!!deleteId} title="Delete User" message="Are you sure you want to delete this user?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
