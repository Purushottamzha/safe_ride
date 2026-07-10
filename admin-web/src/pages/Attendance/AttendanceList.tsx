import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, TextField, MenuItem, Stack } from '@mui/material';
import { Download } from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { attendanceService } from '../../services/attendance';
import { exportService } from '../../services/export';
import type { Attendance } from '../../types';

export default function AttendanceList() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, limit, statusFilter, dateFilter],
    queryFn: () =>
      attendanceService.list({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      }),
  });

  const records = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<Attendance>[] = [
    {
      id: 'student',
      label: 'Student',
      render: (row) => (row.student ? `${row.student.firstName} ${row.student.lastName}` : '-'),
    },
    {
      id: 'grade',
      label: 'Grade',
      render: (row) => (row.student ? `Grade ${row.student.grade}` : '-'),
    },
    { id: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString(), sortable: true },
    {
      id: 'trip',
      label: 'Trip',
      render: (row) => (row.trip ? `${row.trip.type} - ${new Date(row.trip.scheduledAt).toLocaleDateString()}` : '-'),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
      sortable: true,
    },
    { id: 'boardTime', label: 'Board Time', render: (row) => row.boardTime ? new Date(row.boardTime).toLocaleTimeString() : '-' },
  ];

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle={`${total} total records`}
        actions={[
          { label: 'Export CSV', variant: 'outlined', icon: <Download />, onClick: async () => {
            try {
              const blob = await exportService.exportCsv('attendance', { fromDate: dateFilter || undefined, toDate: dateFilter || undefined });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'attendance-export.csv'; a.click();
              window.URL.revokeObjectURL(url);
            } catch { /* ignore */ }
          } },
        ]}
      />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="date"
          size="small"
          label="Date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="present">Present</MenuItem>
          <MenuItem value="absent">Absent</MenuItem>
          <MenuItem value="late">Late</MenuItem>
          <MenuItem value="excused">Excused</MenuItem>
        </TextField>
      </Stack>
      <DataTable
        columns={columns}
        data={records}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        hideSearch
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
      />
    </Box>
  );
}
