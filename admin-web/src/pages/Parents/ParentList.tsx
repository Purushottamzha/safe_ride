import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Typography,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
} from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { parentService } from '../../services/parents';
import type { Parent } from '../../types';

export default function ParentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['parents', page, limit, search],
    queryFn: () => parentService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => parentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setDeleteId(null);
    },
  });

  const parents = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Parent>[] = [
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
    {
      id: 'emergencyContact',
      label: 'Emergency Contact',
      render: (row) => <StatusBadge status={row.emergencyContact ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 120,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/parents/${row.id}`); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/parents/${row.id}/edit`); }}>
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
        title="Parents"
        subtitle={`${total} total parents`}
        actions={[{ label: 'Add Parent', to: '/parents/new', variant: 'contained', icon: <Add /> }]}
      />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>
        }>
          {(error as any)?.message ?? 'Failed to load parents'}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={parents}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        onRowClick={(row) => navigate(`/parents/${row.id}`)}
        searchPlaceholder="Search by name, email..."
        emptyMessage="No parents found"
        emptyDescription="Try adjusting your search or add a new parent."
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Parent"
        message="Are you sure you want to delete this parent? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
