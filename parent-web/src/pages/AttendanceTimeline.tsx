import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getStudentAttendance } from '@/services/attendance';
import LoadingScreen from '@/components/common/LoadingScreen';

const MotionCard = motion.create(Card);

interface DayDetail {
  date: string;
  day: number;
  status: 'present' | 'absent' | 'late' | 'no_school' | 'unknown' | 'future';
}

function getDaysInMonth(year: number, month: number): DayDetail[] {
  const days: DayDetail[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: '', day: 0, status: 'unknown' });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const status = dateObj > today ? 'future' : 'unknown';
    days.push({ date: dateStr, day: d, status });
  }
  return days;
}

const statusColors: Record<string, string> = {
  present: '#10B981',
  absent: '#EF4444',
  late: '#F59E0B',
  no_school: '#94A3B8',
  unknown: '#F1F5F9',
  future: '#F8FAFC',
};

const statusLabels: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  no_school: 'No School',
  unknown: 'Unknown',
  future: '',
};

export default function AttendanceTimeline() {
  const { id } = useParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);

  const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
  const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${new Date(viewYear, viewMonth + 1, 0).getDate()}`;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', id, viewYear, viewMonth],
    queryFn: () =>
      getStudentAttendance(id!, {
        page: 1,
        limit: 31,
        startDate,
        endDate,
      }),
    enabled: !!id,
  });

  const days = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.data) {
      for (const record of data.data) {
        map.set(record.date, record.status);
      }
    }
    return map;
  }, [data]);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let noSchool = 0;
    for (const day of days) {
      if (day.status === 'future' || day.day === 0) continue;
      const s = statusMap.get(day.date) || 'unknown';
      if (s === 'present') present++;
      else if (s === 'absent') absent++;
      else if (s === 'late') late++;
      else if (s === 'no_school') noSchool++;
    }
    return { present, absent, late, noSchool, total: present + absent + late + noSchool };
  }, [days, statusMap]);

  const selectedRecord = useMemo(() => {
    if (!selectedDay || !data?.data) return null;
    return data.data.find((r) => r.date === selectedDay.date);
  }, [selectedDay, data]);

  if (isLoading) {
    return <LoadingScreen message="Loading attendance..." />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 2 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Attendance
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconButton onClick={() => {
              if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
              else setViewMonth(viewMonth - 1);
            }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {monthName}
            </Typography>
            <IconButton onClick={() => {
              if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
              else setViewMonth(viewMonth + 1);
            }}>
              <ArrowForwardIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Typography
                key={d}
                variant="caption"
                sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 0.5 }}
              >
                {d}
              </Typography>
            ))}
            {days.map((day, idx) => {
              const color = day.day === 0 ? 'transparent'
                : statusMap.get(day.date) || (day.status === 'future' ? '#F8FAFC' : '#F1F5F9');
              const isFuture = day.status === 'future';
              const isToday = day.date === today.toISOString().split('T')[0];
              return (
                <Box
                  key={idx}
                  onClick={() => {
                    if (!isFuture && day.day > 0) setSelectedDay(day);
                  }}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    bgcolor: color,
                    cursor: isFuture || day.day === 0 ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    border: isToday ? '2px solid' : '2px solid transparent',
                    borderColor: isToday ? 'primary.main' : 'transparent',
                    position: 'relative',
                    '&:hover': !isFuture && day.day > 0 ? {
                      transform: 'scale(1.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    } : undefined,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      color: ['present', 'absent', 'late'].includes(statusMap.get(day.date) || '')
                        ? 'white'
                        : day.day === 0 ? 'transparent' : 'text.primary',
                      fontSize: '0.75rem',
                    }}
                  >
                    {day.day > 0 ? day.day : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              mt: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
              <Typography variant="caption">{stats.present}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
              <Typography variant="caption">{stats.late}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
              <Typography variant="caption">{stats.absent}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#94A3B8' }} />
              <Typography variant="caption">{stats.noSchool}</Typography>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>

      <AnimatePresence>
        {stats.total > 0 && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            sx={{ mb: 2 }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                Monthly Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 80, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#10B98110' }}>
                  <CheckCircleIcon sx={{ fontSize: 24, color: '#10B981', mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>{stats.present}</Typography>
                  <Typography variant="caption" color="text.secondary">Present</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 80, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#F59E0B10' }}>
                  <ScheduleIcon sx={{ fontSize: 24, color: '#F59E0B', mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>{stats.late}</Typography>
                  <Typography variant="caption" color="text.secondary">Late</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 80, textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#EF444410' }}>
                  <CancelIcon sx={{ fontSize: 24, color: '#EF4444', mb: 0.5 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#EF4444' }}>{stats.absent}</Typography>
                  <Typography variant="caption" color="text.secondary">Absent</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.present + stats.late} of {stats.total} days attended
                  {stats.total > 0 && ` (${Math.round(((stats.present + stats.late) / stats.total) * 100)}%)`}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        )}
      </AnimatePresence>

      <Dialog open={!!selectedDay} onClose={() => setSelectedDay(null)} maxWidth="xs" fullWidth>
        {selectedDay && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogTitle>
            <DialogContent sx={{ pt: '8px !important' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: `${statusColors[selectedRecord?.status || 'unknown']}15`,
                    color: statusColors[selectedRecord?.status || 'unknown'],
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  {selectedRecord?.status === 'present' && <CheckCircleIcon sx={{ fontSize: 18 }} />}
                  {selectedRecord?.status === 'absent' && <CancelIcon sx={{ fontSize: 18 }} />}
                  {selectedRecord?.status === 'late' && <ScheduleIcon sx={{ fontSize: 18 }} />}
                  {statusLabels[selectedRecord?.status || 'unknown']}
                </Box>
              </Box>

              {selectedRecord ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {selectedRecord.boardTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                      <DirectionsBusIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Boarding Time</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(selectedRecord.boardTime).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {selectedRecord.exitTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                      <AccessTimeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Drop-off Time</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(selectedRecord.exitTime).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {selectedRecord.isLate && (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F59E0B10', border: '1px solid #F59E0B30' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                        Student was late
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No attendance record for this day.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={() => setSelectedDay(null)} fullWidth variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
