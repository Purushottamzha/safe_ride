import { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Badge,
  CalendarMonth,
  DirectionsBus,
  Edit,
  FamilyRestroom,
  Home,
  LocalHospital,
  Phone,
  Print,
  QrCode,
  Refresh,
  Route,
  School,
  Shield,
  Smartphone,
  Timeline,
  ReportProblem,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { studentService } from '../../services/students';
import { attendanceService } from '../../services/attendance';
import type { Attendance, Student } from '../../types';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getInitials = (student: Student) =>
  `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

const calculateAttendance = (records: Attendance[]) => {
  const total = records.length;
  const present = records.filter((record) =>
    ['BOARDED', 'DROPPED', 'PRESENT'].includes(record.status),
  ).length;
  const late = records.filter((record) => record.isLate || record.status === 'LATE').length;
  const absent = records.filter((record) => record.status === 'ABSENT').length;
  const attendanceRate = total ? Math.round((present / total) * 100) : 0;

  return { total, present, late, absent, attendanceRate };
};

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', mt: 0.25 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  helper,
  color = 'primary.main',
}: {
  label: string;
  value: string | number;
  helper: string;
  color?: string;
}) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        bgcolor: alpha(color === 'primary.main' ? theme.palette.primary.main : color, 0.06),
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.75, fontWeight: 800 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {helper}
      </Typography>
    </Paper>
  );
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    data: student,
    isLoading: studentLoading,
    error: studentError,
    refetch: refetchStudent,
  } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id,
  });

  const regenerateQrMutation = useMutation({
    mutationFn: () => studentService.regenerateQR(id!),
    onSuccess: () => {
      refetchStudent();
    },
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => attendanceService.getByStudent(id!, { limit: 30 }),
    enabled: !!id,
  });

  const attendanceRecords = attendanceData?.data ?? [];
  const attendanceSummary = useMemo(() => calculateAttendance(attendanceRecords), [attendanceRecords]);
  const activeAssignment = student?.studentAssignments?.find((assignment) => assignment.isActive);
  const primaryParent = student?.parentStudents?.find((link) => link.isPrimary) ?? student?.parentStudents?.[0];
  const qrExpired = student?.qrExpiresAt ? new Date(student.qrExpiresAt) < new Date() : false;

  if (studentError) {
    return (
      <Box>
        <PageHeader title="Student Details" showBack backTo="/students" />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetchStudent()} startIcon={<Refresh />}>
              Retry
            </Button>
          }
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={520} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={220} sx={{ mb: 3 }} />
            <Skeleton variant="rounded" height={320} />
          </Grid>
        </Grid>
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
        subtitle={`Grade ${student.grade}${student.section ? ` - Section ${student.section}` : ''} - ${student.school?.name ?? 'School record'}`}
        showBack
        backTo="/students"
        actions={[
          { label: 'Edit', variant: 'outlined', icon: <Edit />, onClick: () => navigate(`/students/${id}/edit`) },
        ]}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25 }}>
                  <Avatar
                    src={student.profilePicture}
                    sx={{
                      width: 84,
                      height: 84,
                      bgcolor: 'primary.main',
                      fontSize: '1.8rem',
                      fontWeight: 800,
                    }}
                  >
                    {getInitials(student)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {student.firstName} {student.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student ID {student.studentId}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
                      <Chip
                        size="small"
                        icon={<Shield fontSize="small" />}
                        label={qrExpired ? 'QR expired' : 'QR valid'}
                        color={qrExpired ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Stack spacing={2}>
                  <InfoLine icon={<School fontSize="small" />} label="Class" value={`Grade ${student.grade}${student.section ? `, Section ${student.section}` : ''}`} />
                  <InfoLine icon={<CalendarMonth fontSize="small" />} label="Date of birth" value={formatDate(student.dateOfBirth)} />
                  <InfoLine icon={<Home fontSize="small" />} label="Address" value={student.address} />
                  <InfoLine icon={<Phone fontSize="small" />} label="Student phone" value={student.phone} />
                  <InfoLine icon={<LocalHospital fontSize="small" />} label="Medical and emergency notes" value={student.emergencyNotes || 'No notes recorded'} />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      QR Credential
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Used by scanner devices for attendance validation
                    </Typography>
                  </Box>
                  <QrCode color="primary" />
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    textAlign: 'center',
                  }}
                >
                  <QrCode sx={{ fontSize: 96, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', wordBreak: 'break-all', mt: 1 }}
                  >
                    {student.qrToken ?? 'No QR token issued'}
                  </Typography>
                </Paper>

                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  <InfoLine icon={<Badge fontSize="small" />} label="Expires" value={formatDate(student.qrExpiresAt)} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => regenerateQrMutation.mutate()}
                      disabled={regenerateQrMutation.isPending}
                      startIcon={<Refresh />}
                    >
                      {regenerateQrMutation.isPending ? 'Reissuing...' : 'Reissue QR'}
                    </Button>
                    <Button fullWidth variant="outlined" disabled startIcon={<Print />}>
                      Print
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Attendance" value={`${attendanceSummary.attendanceRate}%`} helper="Last 30 records" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Present" value={attendanceSummary.present} helper={`${attendanceSummary.total} scans reviewed`} color={theme.palette.success.main} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Late" value={attendanceSummary.late} helper="Needs follow-up" color={theme.palette.warning.main} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Absent" value={attendanceSummary.absent} helper="Recorded absences" color={theme.palette.error.main} />
              </Grid>
            </Grid>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Transport Assignment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Route and guardian context for daily operations
                    </Typography>
                  </Box>
                  <DirectionsBus color="primary" />
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <InfoLine
                        icon={<Route fontSize="small" />}
                        label="Assigned route"
                        value={activeAssignment?.assignment?.route?.name ?? 'No active route assigned'}
                      />
                      <InfoLine
                        icon={<DirectionsBus fontSize="small" />}
                        label="Assignment"
                        value={activeAssignment?.assignment?.name ?? activeAssignment?.assignment?.route?.code ?? '-'}
                      />
                      <InfoLine
                        icon={<Home fontSize="small" />}
                        label="Pickup stop"
                        value={activeAssignment?.stop?.name ?? 'Pickup stop not assigned'}
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <InfoLine
                        icon={<FamilyRestroom fontSize="small" />}
                        label="Primary guardian"
                        value={
                          primaryParent
                            ? `${primaryParent.parent.user.firstName} ${primaryParent.parent.user.lastName} (${primaryParent.relation})`
                            : 'No guardian linked'
                        }
                      />
                      <InfoLine icon={<Phone fontSize="small" />} label="Guardian phone" value={primaryParent?.parent.user.phone} />
                      <InfoLine icon={<Smartphone fontSize="small" />} label="Guardian email" value={primaryParent?.parent.user.email} />
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Attendance History
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Latest scanner events and trip attendance status
                    </Typography>
                  </Box>
                  <Timeline color="primary" />
                </Box>

                {attendanceLoading ? (
                  <Box>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Skeleton variant="rounded" height={220} />
                  </Box>
                ) : attendanceRecords.length === 0 ? (
                  <Paper variant="outlined" sx={{ py: 5, textAlign: 'center', borderRadius: 2 }}>
                    <ReportProblem sx={{ color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No attendance records found
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Trip</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Boarded</TableCell>
                          <TableCell>Exited</TableCell>
                          <TableCell>Late</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceRecords.slice(0, 10).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{record.trip?.type ?? record.type ?? '-'}</TableCell>
                            <TableCell>
                              <StatusBadge status={record.status} />
                            </TableCell>
                            <TableCell>{formatDateTime(record.boardTime)}</TableCell>
                            <TableCell>{formatDateTime(record.exitTime)}</TableCell>
                            <TableCell>
                              {record.isLate || record.lateMinutes > 0 ? (
                                <Chip size="small" color="warning" label={`${record.lateMinutes || 1} min`} />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
