import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Alert } from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { driverService } from '../../services/drivers';
import type { Driver } from '../../types';

export default function DriverList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, limit, search],
    queryFn: () => driverService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteId(null);
    },
  });

  const drivers = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Driver>[] = [
    { id: 'name', label: 'Name', render: (row) => row.name, sortable: true },
    { id: 'email', label: 'Email', render: (row) => row.email },
    { id: 'phone', label: 'Phone', render: (row) => row.phone },
    { id: 'license', label: 'License', render: (row) => row.licenseNumber },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
    {
      id: 'actions',
      label: 'Actions',
      width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); }}>
              <Edit fontSize="small" />
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
    <Box>
      <PageHeader
        title="Drivers"
        subtitle={`${total} total drivers`}
        actions={[{ label: 'Add Driver', to: '/drivers/new', variant: 'contained', icon: <Add /> }]}
      />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete driver</Alert>}
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
        searchPlaceholder="Search by name..."
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Driver"
        message="Are you sure you want to delete this driver?"
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
