import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Alert,
  MenuItem,
  TextField,
  Stack,
} from '@mui/material';
import {
  Edit,
  Delete,
  QrCode,
  Visibility,
  Add,
} from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { studentService } from '../../services/students';
import type { Student } from '../../types';

export default function StudentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, limit, search, gradeFilter, sectionFilter],
    queryFn: () =>
      studentService.list({
        page: page + 1,
        limit,
        search: search || undefined,
        grade: gradeFilter || undefined,
        section: sectionFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteId(null);
    },
  });

  const students = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<Student>[] = [
    { id: 'name', label: 'Name', render: (row) => `${row.firstName} ${row.lastName}`, sortable: true },
    { id: 'grade', label: 'Grade', render: (row) => row.grade, sortable: true },
    { id: 'section', label: 'Section', render: (row) => row.section },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      id: 'parentPhone',
      label: 'Parent Phone',
      render: (row) => row.parentPhone,
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 160,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}`); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}/edit`); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="QR Code">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}`); }}>
              <QrCode fontSize="small" />
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
        title="Students"
        subtitle={`${total} total students`}
        actions={[
          { label: 'Add Student', to: '/students/new', variant: 'contained', icon: <Add /> },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Grade"
          value={gradeFilter}
          onChange={(e) => { setGradeFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All Grades</MenuItem>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map((g) => (
            <MenuItem key={g} value={g}>Grade {g}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Section"
          value={sectionFilter}
          onChange={(e) => { setSectionFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All Sections</MenuItem>
          {['A','B','C','D','E'].map((s) => (
            <MenuItem key={s} value={s}>Section {s}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to delete student</Alert>
      )}

      <DataTable
        columns={columns}
        data={students}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        onRowClick={(row) => navigate(`/students/${row.id}`)}
        searchPlaceholder="Search by name..."
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
