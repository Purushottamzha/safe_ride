import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box, Typography, Chip, Alert, Button, MenuItem, TextField, Stack,
} from '@mui/material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { auditLogService, type AuditLog } from '../../services/auditLogs';

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function AuditLogList() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit-logs', page, limit, actionFilter, entityFilter],
    queryFn: () => auditLogService.list({
      page: page + 1, limit,
      action: actionFilter || undefined,
      entity: entityFilter || undefined,
    }),
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const getActionColor = (action: string): 'info' | 'success' | 'warning' | 'error' | 'default' => {
    switch (action.toLowerCase()) {
      case 'create': case 'created': return 'success';
      case 'update': case 'updated': return 'info';
      case 'delete': case 'deleted': return 'error';
      case 'login': case 'logout': return 'warning';
      default: return 'default';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      id: 'action',
      label: 'Action',
      render: (row) => <Chip label={row.action} color={getActionColor(row.action)} size="small" variant="outlined" />,
    },
    { id: 'entity', label: 'Entity', render: (row) => <Typography variant="body2">{row.entity}{row.entityId ? ` #${row.entityId.slice(0, 8)}` : ''}</Typography> },
    {
      id: 'user',
      label: 'User',
      render: (row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : (row.userId ?? 'System'),
    },
    { id: 'time', label: 'Time', render: (row) => formatDateTime(row.createdAt) },
    { id: 'ip', label: 'IP', render: (row) => row.ip || '-' },
  ];

  return (
    <Box>
      <PageHeader title="Audit Logs" subtitle={`${total} total events`} />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField select size="small" label="Action" value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Actions</MenuItem>
          <MenuItem value="CREATE">Create</MenuItem>
          <MenuItem value="UPDATE">Update</MenuItem>
          <MenuItem value="DELETE">Delete</MenuItem>
          <MenuItem value="LOGIN">Login</MenuItem>
          <MenuItem value="LOGOUT">Logout</MenuItem>
        </TextField>
        <TextField select size="small" label="Entity" value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Entities</MenuItem>
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Student">Student</MenuItem>
          <MenuItem value="Driver">Driver</MenuItem>
          <MenuItem value="Bus">Bus</MenuItem>
          <MenuItem value="Route">Route</MenuItem>
          <MenuItem value="Trip">Trip</MenuItem>
          <MenuItem value="School">School</MenuItem>
        </TextField>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
          {(error as any)?.message ?? 'Failed to load audit logs'}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={logs}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        hideSearch
        emptyMessage="No audit logs found"
        emptyDescription="System events will appear here."
        rowKey={(row) => row.id}
      />
    </Box>
  );
}
