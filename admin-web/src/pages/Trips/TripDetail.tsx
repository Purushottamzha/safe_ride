import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Divider,
  Avatar,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Cancel,
  Refresh,
  DirectionsBus,
  Person,
  Route as RouteIcon,
  Event,
  Timeline as TimelineIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { tripService } from '../../services/trips';
import type { Attendance } from '../../types';

function getAttendanceStats(attendance?: Attendance[]) {
  const list = attendance ?? [];
  return {
    present: list.filter((a) => a.status === 'PRESENT' || a.status === 'BOARDED').length,
    absent: list.filter((a) => a.status === 'ABSENT' || a.status === 'NOT_BOARDED').length,
    late: list.filter((a) => a.status === 'LATE').length,
    excused: list.filter((a) => a.status === 'EXCUSED').length,
    dropped: list.filter((a) => a.status === 'DROPPED').length,
    total: list.length,
  };
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'start' | 'complete' | 'cancel' | null>(null);

  const { data: trip, isLoading, error, refetch } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripService.getById(id!),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => {
      if (action === 'start') return tripService.startTrip(id!);
      if (action === 'complete') return tripService.completeTrip(id!);
      return tripService.cancelTrip(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] });
      setConfirmAction(null);
    },
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Trip Details" showBack backTo="/trips" />
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>Retry</Button>}>
          Failed to load trip: {(error as any)?.message ?? 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Trip Details" showBack backTo="/trips" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box>
        <PageHeader title="Trip Not Found" showBack backTo="/trips" />
        <Alert severity="warning">The requested trip could not be found.</Alert>
      </Box>
    );
  }

  const stats = getAttendanceStats(trip.attendance);
  const events = trip.tripEvents ?? [];
  const driverName = trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '-';

  const actionButtons: { label: string; action: 'start' | 'complete' | 'cancel'; color: 'success' | 'error'; icon: React.ReactNode; condition: boolean; variant: 'contained' | 'outlined' }[] = [
    { label: 'Start Trip', action: 'start', color: 'success', icon: <PlayArrow />, condition: trip.status === 'SCHEDULED', variant: 'contained' },
    { label: 'Complete Trip', action: 'complete', color: 'success', icon: <CheckCircle />, condition: trip.status === 'ACTIVE', variant: 'contained' },
    { label: 'Cancel Trip', action: 'cancel', color: 'error', icon: <Cancel />, condition: trip.status === 'SCHEDULED' || trip.status === 'ACTIVE', variant: 'outlined' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title={`Trip - ${new Date(trip.scheduledAt).toLocaleDateString()}`}
        subtitle={`${trip.type === 'MORNING' ? 'Morning' : 'Afternoon'} trip`}
        showBack
        backTo="/trips"
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        {actionButtons.filter(b => b.condition).map((btn) => (
          <Button
            key={btn.action}
            variant={btn.variant}
            color={btn.color}
            startIcon={btn.icon}
            onClick={() => setConfirmAction(btn.action)}
            disabled={actionMutation.isPending}
          >
            {btn.label}
          </Button>
        ))}
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={() => navigate(`/trips/${id}/replay`)}
          sx={{ ml: 'auto' }}
        >
          Replay
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>Trip Information</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.25 }}><StatusBadge status={trip.status.toLowerCase()} /></Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Chip
                      label={trip.type === 'MORNING' ? 'Morning' : 'Afternoon'}
                      size="small"
                      color={trip.type === 'MORNING' ? 'info' : 'secondary'}
                      variant="outlined"
                      sx={{ mt: 0.25, fontWeight: 600 }}
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Person color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Driver</Typography>
                      <Typography variant="body2" fontWeight={500}>{driverName}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DirectionsBus color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Bus</Typography>
                      <Typography variant="body2" fontWeight={500}>{trip.bus?.plateNumber ?? '-'} ({trip.bus?.busNumber ?? '-'})</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <RouteIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Route</Typography>
                      <Typography variant="body2" fontWeight={500}>{trip.route?.name ?? '-'}</Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Event color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                      <Typography variant="body2">{new Date(trip.scheduledAt).toLocaleString()}</Typography>
                    </Box>
                  </Box>
                  {trip.startedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PlayArrow color="success" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Started</Typography>
                        <Typography variant="body2">{new Date(trip.startedAt).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  )}
                  {trip.completedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle color="success" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                        <Typography variant="body2">{new Date(trip.completedAt).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  )}
                  {trip.cancelledAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Cancel color="error" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cancelled</Typography>
                        <Typography variant="body2">{new Date(trip.cancelledAt).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  )}
                  {trip.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Notes</Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>{trip.notes}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <TimelineIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Trip Timeline</Typography>
                    {events.length > 0 && (
                      <Chip label={`${events.length} events`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  {events.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No events recorded for this trip yet.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative', pl: 3 }}>
                      <Box sx={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, bgcolor: 'divider' }} />
                      {events.map((event, idx) => (
                        <Box key={event.id} sx={{ display: 'flex', gap: 2, pb: idx < events.length - 1 ? 2.5 : 0, position: 'relative' }}>
                          <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: event.scanType === 'BOARD_IN' ? 'success.main' : 'warning.main',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            >
                              {event.scanType === 'BOARD_IN' ? 'B' : 'E'}
                            </Avatar>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {event.student ? `${event.student.firstName} ${event.student.lastName}` : 'Unknown student'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.scanType === 'BOARD_IN' ? 'Boarded in' : 'Exited out'}
                              {event.latitude && event.longitude ? ` at (${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)})` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" display="block">
                              {new Date(event.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                    Attendance ({stats.total} records)
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap">
                    <Chip label={`${stats.present} Present`} color="success" variant="outlined" size="small" />
                    <Chip label={`${stats.absent} Absent`} color="error" variant="outlined" size="small" />
                    <Chip label={`${stats.late} Late`} color="warning" variant="outlined" size="small" />
                    <Chip label={`${stats.excused} Excused`} color="info" variant="outlined" size="small" />
                    <Chip label={`${stats.dropped} Dropped`} color="secondary" variant="outlined" size="small" />
                  </Stack>
                  {stats.total === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No attendance records for this trip.</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Board Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Exit Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {trip.attendance?.map((a) => (
                            <TableRow key={a.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {a.student ? `${a.student.firstName} ${a.student.lastName}` : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>{a.student ? `Grade ${a.student.grade}` : '-'}</TableCell>
                              <TableCell><StatusBadge status={a.status.toLowerCase().replace(/_/g, '_')} /></TableCell>
                              <TableCell>{a.boardTime ? new Date(a.boardTime).toLocaleTimeString() : '-'}</TableCell>
                              <TableCell>{a.exitTime ? new Date(a.exitTime).toLocaleTimeString() : '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === 'start' ? 'Start Trip' : confirmAction === 'complete' ? 'Complete Trip' : 'Cancel Trip'}
        message={
          confirmAction === 'start' ? 'Start this trip now?' :
          confirmAction === 'complete' ? 'Mark this trip as completed?' :
          'Are you sure you want to cancel this trip?'
        }
        confirmLabel={confirmAction === 'start' ? 'Start' : confirmAction === 'complete' ? 'Complete' : 'Cancel Trip'}
        confirmColor={confirmAction === 'cancel' ? 'error' : 'primary'}
        isLoading={actionMutation.isPending}
        onConfirm={() => confirmAction && actionMutation.mutate(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
    </motion.div>
  );
}
