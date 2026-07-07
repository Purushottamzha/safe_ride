import { useMemo, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, Skeleton, Stack, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Today, Add, DirectionsBus,
  Warning, CheckCircle, CalendarMonth, ViewDay, ViewWeek,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { tripService } from '../../services/trips';
import { assignmentService } from '../../services/assignments';
import type { Assignment } from '../../types';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekRange(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function isToday(d: Date) {
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'completed') return '#22c55e';
  if (s === 'cancelled') return '#ef4444';
  if (s === 'scheduled') return '#3b82f6';
  if (s.includes('driving') || s.includes('active')) return '#f59e0b';
  return '#94a3b8';
}

export default function AssignmentCalendar() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'week' | 'day' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string>('');
  const [createDialog, setCreateDialog] = useState<{ date: string; type: string } | null>(null);
  const [createData, setCreateData] = useState({ driverId: '', busId: '', routeId: '', assignmentId: '', notes: '' });
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [createError, setCreateError] = useState('');

  const dateRange = useMemo(() => {
    if (view === 'month') return getMonthRange(currentDate);
    if (view === 'day') return { start: new Date(currentDate.setHours(0, 0, 0, 0)), end: new Date(currentDate.setHours(23, 59, 59, 999)) };
    return getWeekRange(currentDate);
  }, [view, currentDate]);

  const { data: calendarData, isLoading: calLoading } = useQuery({
    queryKey: ['trip-calendar', formatDate(dateRange.start), formatDate(dateRange.end), filterType],
    queryFn: () => tripService.getCalendar({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      type: filterType as any || undefined,
    }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments-list'],
    queryFn: () => assignmentService.list({ limit: 200 }),
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', { limit: 200 }],
    queryFn: () => import('../../services/drivers').then(m => m.driverService.list({ limit: 200 })),
  });

  const { data: busesData } = useQuery({
    queryKey: ['buses', { limit: 200 }],
    queryFn: () => import('../../services/buses').then(m => m.busService.list({ limit: 200 })),
  });

  const { data: routesData } = useQuery({
    queryKey: ['routes', { limit: 200 }],
    queryFn: () => import('../../services/routes').then(m => m.routeService.list({ limit: 200 })),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tripService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-calendar'] });
      setCreateDialog(null);
      setCreateData({ driverId: '', busId: '', routeId: '', assignmentId: '', notes: '' });
      setConflicts([]);
      setCreateError('');
    },
    onError: (e: any) => setCreateError(e?.response?.data?.message || 'Failed to create trip'),
  });

  const calendar = calendarData as any;
  const grouped = calendar?.grouped ?? {};
  const allTrips = calendar?.trips ?? [];

  const assignments: Assignment[] = assignmentsData?.data ?? [];
  const drivers: any[] = driversData?.data ?? [];
  const buses: any[] = busesData?.data ?? [];
  const routes: any[] = routesData?.data ?? [];

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(dateRange.start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [dateRange]);

  const navigatePrev = useCallback(() => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }, [currentDate, view]);

  const navigateNext = useCallback(() => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }, [currentDate, view]);

  const handleCellClick = (date: Date, type: string) => {
    setCreateDialog({ date: formatDate(date), type });
    setCreateData({ driverId: '', busId: '', routeId: '', assignmentId: '', notes: '' });
    setConflicts([]);
    setCreateError('');
  };

  const handleCheckConflicts = async () => {
    if (!createDialog) return;
    try {
      const scheduledAt = `${createDialog.date}T${createDialog.type === 'MORNING' ? '07:00' : '15:00'}:00`;
      const result = await tripService.checkConflicts({
        scheduledAt, type: createDialog.type,
        driverId: createData.driverId || undefined,
        busId: createData.busId || undefined,
      });
      setConflicts(result.conflicts);
    } catch { /* ignore */ }
  };

  const handleCreate = () => {
    const { driverId, busId, routeId, assignmentId, notes } = createData;
    if (!createDialog) return;
    const scheduledAt = `${createDialog.date}T${createDialog.type === 'MORNING' ? '07:00' : '15:00'}:00`;
    createMutation.mutate({ type: createDialog.type, scheduledAt, driverId: driverId || undefined, busId: busId || undefined, routeId: routeId || undefined, assignmentId: assignmentId || undefined, notes: notes || undefined, schoolId: '' });
  };

  const renderWeekView = () => (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }} />
        {weekDays.map((d) => (
          <Box key={d.toISOString()} sx={{ p: 1, textAlign: 'center', bgcolor: isToday(d) ? 'primary.main' : 'grey.50', color: isToday(d) ? '#fff' : 'text.primary' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>{SHORT_DAYS[d.getDay()]}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.getDate()}</Typography>
          </Box>
        ))}
      </Box>

      {['MORNING', 'AFTERNOON'].map((type) => (
        <Box key={type} sx={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider', minHeight: 140 }}>
          <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', writingMode: 'vertical-lr', textAlign: 'center' }}>
              {type === 'MORNING' ? 'AM 7:00' : 'PM 3:00'}
            </Typography>
          </Box>
          {weekDays.map((d) => {
            const dateKey = formatDate(d);
            const dayTrips = grouped[dateKey]?.filter((t: any) => t.type === type) ?? [];
            return (
              <Box key={d.toISOString()} sx={{ p: 0.5, borderRight: '1px solid', borderColor: 'divider', bgcolor: isToday(d) ? '#f0f7ff' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => handleCellClick(d, type)}>
                {dayTrips.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Add sx={{ fontSize: 16, color: 'text.disabled', opacity: 0.4 }} />
                  </Box>
                ) : (
                  <Stack spacing={0.5}>
                    {dayTrips.slice(0, 3).map((trip: any) => (
                      <Box key={trip.id} sx={{ p: 0.5, borderRadius: 1, bgcolor: getStatusColor(trip.status), color: '#fff', fontSize: '0.6rem', fontWeight: 600, lineHeight: 1.3 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, display: 'block' }}>
                          {trip.bus?.busNumber || trip.bus?.plateNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.5rem', opacity: 0.9 }}>
                          {trip.driver?.firstName} {trip.driver?.lastName}
                        </Typography>
                      </Box>
                    ))}
                    {dayTrips.length > 3 && (
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary', textAlign: 'center' }}>
                        +{dayTrips.length - 3} more
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Card>
  );

  const renderDayView = () => (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
        <Stack spacing={1}>
          {allTrips.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No trips scheduled for this day</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => handleCellClick(currentDate, 'MORNING')}>
                Schedule Trip
              </Button>
            </Box>
          ) : allTrips.map((trip: any) => (
            <Box key={trip.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: getStatusColor(trip.status) }} />
              <DirectionsBus fontSize="small" color="action" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {trip.type === 'MORNING' ? 'Morning' : 'Afternoon'} · {trip.bus?.busNumber || trip.bus?.plateNumber || 'No bus'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'No driver'} · {trip.route?.name || 'No route'}
                </Typography>
              </Box>
              <StatusBadge status={trip.status.toLowerCase()} />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPadding; i++) cells.push(null);
    for (let i = 1; i <= totalDays; i++) {
      cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return (
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {SHORT_DAYS.map((d) => (
            <Box key={d} sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{d}</Typography>
            </Box>
          ))}
          {cells.map((d, i) => {
            const dateKey = d ? formatDate(d) : '';
            const dayTrips = grouped[dateKey] ?? [];
            return (
              <Box key={i} sx={{ minHeight: 80, p: 0.5, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: d && isToday(d) ? '#f0f7ff' : 'transparent', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => d && handleCellClick(d, 'MORNING')}>
                {d && (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{d.getDate()}</Typography>
                    {dayTrips.length > 0 && (
                      <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                        {dayTrips.slice(0, 3).map((trip: any) => (
                          <Box key={trip.id} sx={{ borderRadius: 0.5, bgcolor: getStatusColor(trip.status), height: 4 }} />
                        ))}
                        {dayTrips.length > 3 && (
                          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'text.secondary' }}>
                            +{dayTrips.length - 3}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Card>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Assignment Calendar"
        subtitle="Schedule and manage daily trips"
        actions={[
          { label: 'Assignments', onClick: () => window.history.pushState({}, '', '/assignments'), variant: 'outlined', icon: <CalendarMonth /> },
        ]}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={navigatePrev} size="small"><ChevronLeft /></IconButton>
          <IconButton onClick={() => setCurrentDate(new Date())} size="small"><Today /></IconButton>
          <IconButton onClick={navigateNext} size="small"><ChevronRight /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, ml: 1, fontSize: '1rem' }}>
            {view === 'month'
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 100, '& .MuiInputBase-root': { fontSize: '0.78rem' } }}>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="MORNING">Morning</MenuItem>
            <MenuItem value="AFTERNOON">Afternoon</MenuItem>
          </TextField>
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="week"><ViewWeek sx={{ fontSize: 16 }} /></ToggleButton>
            <ToggleButton value="day"><ViewDay sx={{ fontSize: 16 }} /></ToggleButton>
            <ToggleButton value="month"><CalendarMonth sx={{ fontSize: 16 }} /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {calLoading ? (
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={view + formatDate(currentDate)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
            {view === 'month' && renderMonthView()}
          </motion.div>
        </AnimatePresence>
      )}

      <Dialog open={!!createDialog} onClose={() => setCreateDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Schedule Trip — {createDialog?.date} ({createDialog?.type === 'MORNING' ? 'Morning' : 'Afternoon'})
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Assignment (optional)" value={createData.assignmentId} onChange={(e) => {
              const val = e.target.value;
              const asst = assignments.find(a => a.id === val);
              setCreateData({
                ...createData, assignmentId: val,
                routeId: asst?.routeId || createData.routeId,
                driverId: asst?.driverAssignments?.[0]?.driverId || createData.driverId,
                busId: asst?.busAssignments?.[0]?.busId || createData.busId,
              });
            }} fullWidth size="small">
              <MenuItem value="">None (manual)</MenuItem>
              {assignments.filter(a => a.isActive).map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name || a.route?.name || a.id.slice(0, 8)} ({a._count?.studentAssignments ?? 0} students)
                </MenuItem>
              ))}
            </TextField>

            <TextField select label="Driver" value={createData.driverId} onChange={(e) => setCreateData({ ...createData, driverId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select driver</MenuItem>
              {drivers.map((d: any) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.user?.firstName} {d.user?.lastName} {!d.isAvailable ? '(Unavailable)' : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField select label="Bus" value={createData.busId} onChange={(e) => setCreateData({ ...createData, busId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select bus</MenuItem>
              {buses.filter((b: any) => b.status === 'ACTIVE').map((b: any) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.busNumber} - {b.plateNumber} (capacity: {b.capacity})
                </MenuItem>
              ))}
            </TextField>

            <TextField select label="Route" value={createData.routeId} onChange={(e) => setCreateData({ ...createData, routeId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select route</MenuItem>
              {routes.map((r: any) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>

            <TextField label="Notes" value={createData.notes} onChange={(e) => setCreateData({ ...createData, notes: e.target.value })} fullWidth size="small" multiline rows={2} />

            {createData.driverId || createData.busId ? (
              <Button variant="outlined" size="small" onClick={handleCheckConflicts} startIcon={<Warning />}>
                Check Conflicts
              </Button>
            ) : null}

            {conflicts.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Conflicts Detected:</Typography>
                {conflicts.map((c, i) => (
                  <Typography key={i} variant="caption" display="block">
                    {c.type === 'driver' ? 'Driver' : 'Bus'} "{c.name}" already assigned to trip at {new Date(c.tripTime).toLocaleString()}
                  </Typography>
                ))}
              </Alert>
            )}

            {conflicts.length === 0 && (createData.driverId || createData.busId) && (
              <Alert severity="success" icon={<CheckCircle />}>No conflicts detected</Alert>
            )}

            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createMutation.isPending || (!createData.driverId && !createData.busId)}>
            {createMutation.isPending ? 'Creating...' : 'Schedule Trip'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
