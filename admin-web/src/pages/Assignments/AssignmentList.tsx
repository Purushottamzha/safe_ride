import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, IconButton, Tooltip, Alert } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { assignmentService } from '../../services/assignments';
import type { Assignment } from '../../types';

export default function AssignmentList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', page, limit],
    queryFn: () => assignmentService.list({ page: page + 1, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignments'] }); setDeleteId(null); },
  });

  const assignments = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Assignment>[] = [
    { id: 'student', label: 'Student', render: (row) => row.student ? `${row.student.firstName} ${row.student.lastName}` : '-' },
    { id: 'bus', label: 'Bus', render: (row) => row.bus?.plateNumber ?? '-' },
    { id: 'route', label: 'Route', render: (row) => row.route?.name ?? '-' },
    { id: 'stop', label: 'Stop', render: (row) => row.stop?.name ?? '-' },
    { id: 'type', label: 'Type', render: (row) => <StatusBadge status={row.type} /> },
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
      <PageHeader title="Assignments" subtitle={`${total} total assignments`}
        actions={[{ label: 'Add Assignment', variant: 'contained', icon: <Add /> }]} />
      {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to delete assignment</Alert>}
      <DataTable columns={columns} data={assignments} total={total} page={page} limit={limit}
        loading={isLoading} hideSearch
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(0); }} />
      <ConfirmDialog open={!!deleteId} title="Delete Assignment" message="Are you sure you want to delete this assignment?"
        confirmLabel="Delete" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
