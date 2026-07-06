import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Chip,
} from '@mui/material';
import { PlayArrow, CheckCircle, Cancel, Refresh } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { tripService } from '../../services/trips';

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, error, refetch } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripService.getById(id!),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: ({ action }: { action: string }) => {
      if (action === 'start') return tripService.startTrip(id!);
      if (action === 'complete') return tripService.completeTrip(id!);
      return tripService.cancelTrip(id!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trip', id] }); },
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Trip Details" showBack backTo="/trips" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>Failed to load trip</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Loading..." showBack backTo="/trips" />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box>
        <PageHeader title="Not Found" showBack backTo="/trips" />
        <Alert severity="warning">Trip not found</Alert>
      </Box>
    );
  }

  const attendanceStats = {
    present: trip.attendance?.filter((a) => a.status === 'present').length ?? 0,
    absent: trip.attendance?.filter((a) => a.status === 'absent').length ?? 0,
    late: trip.attendance?.filter((a) => a.status === 'late').length ?? 0,
    excused: trip.attendance?.filter((a) => a.status === 'excused').length ?? 0,
  };
  const totalScanned = trip.attendance?.length ?? 0;

  return (
    <Box>
      <PageHeader title={`Trip - ${trip.date}`} subtitle={`${trip.type} trip`} showBack backTo="/trips"
        actions={[
          ...(trip.status === 'scheduled' ? [{ label: 'Start Trip', variant: 'contained' as const, color: 'success' as const, icon: <PlayArrow />, onClick: () => actionMutation.mutate({ action: 'start' }) }] : []),
          ...(trip.status === 'in_progress' ? [{ label: 'Complete', variant: 'contained' as const, color: 'success' as const, icon: <CheckCircle />, onClick: () => actionMutation.mutate({ action: 'complete' }) }] : []),
          ...(trip.status === 'scheduled' || trip.status === 'in_progress' ? [{ label: 'Cancel', variant: 'outlined' as const, color: 'error' as const, icon: <Cancel />, onClick: () => actionMutation.mutate({ action: 'cancel' }) }] : []),
        ]} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Info</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.25 }}><StatusBadge status={trip.status} /></Box></Box>
                <Box><Typography variant="caption" color="text.secondary">Type</Typography><Box sx={{ mt: 0.25 }}><StatusBadge status={trip.type} /></Box></Box>
                <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body2">{trip.date}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Driver</Typography><Typography variant="body2">{trip.driver?.name ?? '-'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Bus</Typography><Typography variant="body2">{trip.bus?.plateNumber ?? '-'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Route</Typography><Typography variant="body2">{trip.route?.name ?? '-'}</Typography></Box>
                {trip.startTime && <Box><Typography variant="caption" color="text.secondary">Start Time</Typography><Typography variant="body2">{trip.startTime}</Typography></Box>}
                {trip.endTime && <Box><Typography variant="caption" color="text.secondary">End Time</Typography><Typography variant="body2">{trip.endTime}</Typography></Box>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Attendance Summary</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip label={`${attendanceStats.present} Present`} color="success" variant="outlined" />
                <Chip label={`${attendanceStats.absent} Absent`} color="error" variant="outlined" />
                <Chip label={`${attendanceStats.late} Late`} color="warning" variant="outlined" />
                <Chip label={`${attendanceStats.excused} Excused`} color="info" variant="outlined" />
                <Chip label={`${totalScanned} Total`} variant="outlined" />
              </Box>
              {totalScanned === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No attendance records for this trip</Typography></Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Scan Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trip.attendance?.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.student ? `${a.student.firstName} ${a.student.lastName}` : '-'}</TableCell>
                          <TableCell>{a.student ? `Grade ${a.student.grade}` : '-'}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell>{a.scanTime ?? '-'}</TableCell>
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
