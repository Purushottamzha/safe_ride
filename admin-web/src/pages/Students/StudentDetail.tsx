import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Skeleton,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Home,
  School,
  Refresh,
  QrCode,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { studentService } from '../../services/students';
import { attendanceService } from '../../services/attendance';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading: studentLoading, error: studentError, refetch: refetchStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => attendanceService.getByStudent(id!, { limit: 10 }),
    enabled: !!id,
  });

  if (studentError) {
    return (
      <Box>
        <PageHeader title="Student Details" showBack backTo="/students" />
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => refetchStudent()} startIcon={<Refresh />}>Retry</Button>}
        >
          Failed to load student data
        </Alert>
      </Box>
    );
  }

  if (studentLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/students" />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/students" />
        <Alert severity="warning">Student not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`Grade ${student.grade} · Section ${student.section}`}
        showBack
        backTo="/students"
        actions={[
          { label: 'Edit', variant: 'outlined', onClick: () => navigate(`/students/${id}/edit`) },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {student.firstName} {student.lastName}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School fontSize="small" color="action" />
                  <Typography variant="body2">Grade {student.grade} - Section {student.section}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Home fontSize="small" color="action" />
                  <Typography variant="body2">{student.address}</Typography>
                </Box>
                {student.school && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" color="action" />
                    <Typography variant="body2">{student.school.name}</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'left' }}>
                Parent Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">{student.parentName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{student.parentPhone}</Typography>
                </Box>
                {student.parentEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{student.parentEmail}</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'left' }}>
                QR Code
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <QrCode sx={{ fontSize: 80, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
                  {student.qrCode}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Attendance History
              </Typography>
              {attendanceLoading ? (
                <Skeleton variant="rounded" height={200} />
              ) : !attendanceData?.data || attendanceData.data.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No attendance records found</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Trip</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Scan Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.data.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.trip?.type ?? '-'}</TableCell>
                          <TableCell><StatusBadge status={record.status} /></TableCell>
                          <TableCell>{record.scanTime ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
