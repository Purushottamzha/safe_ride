import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HistoryIcon from '@mui/icons-material/History';
import TimelineIcon from '@mui/icons-material/Timeline';
import DoneIcon from '@mui/icons-material/Done';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import PhoneIcon from '@mui/icons-material/Phone';

import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '@/services/students';
import { getTodayStatus } from '@/services/attendance';
import { getActiveTrip } from '@/services/trips';
import LoadingScreen from '@/components/common/LoadingScreen';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

export default function StudentStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(id!),
    enabled: !!id,
  });

  const { data: todayStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['today-status', id],
    queryFn: () => getTodayStatus(id!),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const { data: activeTrip } = useQuery({
    queryKey: ['active-trip', id],
    queryFn: () => getActiveTrip(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  if (loadingStudent) {
    return <LoadingScreen message="Loading student details..." />;
  }

  if (!student) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Student not found</Typography>
      </Box>
    );
  }

  const statusColor = todayStatus?.status === 'present' ? '#10B981'
    : todayStatus?.status === 'absent' ? '#EF4444'
    : todayStatus?.status === 'late' ? '#F59E0B'
    : '#94A3B8';

  const events = activeTrip?.events ?? [];

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}
    >
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ mb: 2 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, textAlign: 'center' }}>
          <Avatar
            src={student.photoUrl}
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 1.5,
              bgcolor: 'primary.light',
              fontSize: 28,
              fontWeight: 700,
              border: '3px solid',
              borderColor: statusColor,
            }}
          >
            {student.name.charAt(0)}
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25 }}>
            {student.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {student.grade} &bull; {student.school}
          </Typography>

          {loadingStatus ? (
            <Skeleton variant="rounded" height={60} sx={{ borderRadius: 2 }} />
          ) : (
            <AnimatePresence mode="wait">
              <MotionBox
                key={todayStatus?.status || 'unknown'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: `${statusColor}12`,
                  border: `2px solid ${statusColor}40`,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: statusColor,
                    mx: 'auto',
                    mb: 1,
                    animation: todayStatus?.currentTripStatus === 'IN_TRANSIT'
                      ? 'pulse 1.5s infinite'
                      : undefined,
                    '@keyframes pulse': {
                      '0%, 100%': { boxShadow: `0 0 0 0 ${statusColor}80` },
                      '50%': { boxShadow: `0 0 0 8px ${statusColor}00` },
                    },
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, color: statusColor, mb: 0.5 }}>
                  {todayStatus?.message || 'Status unavailable'}
                </Typography>
                {todayStatus?.lastScanTime && (
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {new Date(todayStatus.lastScanTime).toLocaleTimeString()}
                  </Typography>
                )}
              </MotionBox>
            </AnimatePresence>
          )}
        </CardContent>
      </MotionCard>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        sx={{ mb: 2 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Driver & Bus Info
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button fullWidth variant="outlined" sx={{ p: 1.5, flexDirection: 'column', gap: 0.5 }}
              onClick={() => navigate(`/student/${id}/driver`)}>
              <PersonIcon color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {activeTrip?.driverName || student?.driver?.name || 'Driver'}
              </Typography>
              <Typography variant="caption" color="text.secondary">View Driver</Typography>
            </Button>
            <Button fullWidth variant="outlined" sx={{ p: 1.5, flexDirection: 'column', gap: 0.5 }}
              onClick={() => navigate(`/student/${id}/bus`)}>
              <DirectionsBusIcon color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {activeTrip?.busNumber || student?.bus?.busNumber || 'Bus'}
              </Typography>
              <Typography variant="caption" color="text.secondary">View Bus</Typography>
            </Button>
            <Button fullWidth variant="outlined" sx={{ p: 1.5, flexDirection: 'column', gap: 0.5 }}
              onClick={() => navigate(`/student/${id}/emergency`)}>
              <LocalHospitalIcon color="error" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Emergency</Typography>
              <Typography variant="caption" color="text.secondary">Contacts</Typography>
            </Button>
          </Box>
          {activeTrip && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {activeTrip.direction === 'TO_SCHOOL' ? 'To School' : 'From School'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        sx={{ mb: 2 }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Today's Timeline
          </Typography>

          {events.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No events recorded for today yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {events.map((event, idx) => {
                const isLast = idx === events.length - 1;
                const isBoard = event.type.includes('BOARD');
                return (
                  <MotionBox
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    sx={{ display: 'flex', gap: 2, minHeight: 64 }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isBoard ? 'info.100' : 'success.100',
                          color: isBoard ? 'info.main' : 'success.main',
                          flexShrink: 0,
                        }}
                      >
                        {isBoard ? <TimelineIcon sx={{ fontSize: 16 }} /> : <DoneIcon sx={{ fontSize: 16 }} />}
                      </Box>
                      {!isLast && (
                        <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                      )}
                    </Box>
                    <Box sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.type === 'BOARD_IN' && 'Boarded bus to school'}
                        {event.type === 'BOARD_OUT' && 'Boarded bus from school'}
                        {event.type === 'EXIT_IN' && 'Arrived at school'}
                        {event.type === 'EXIT_OUT' && 'Arrived home'}
                      </Typography>
                      {event.location && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {event.location}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {new Date(event.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </MotionBox>
                );
              })}
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {(student.bloodGroup || student.emergencyContact || student.medicalNotes) && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{ mb: 2 }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Medical Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {student.bloodGroup && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <BloodtypeIcon color="error" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.bloodGroup}</Typography>
                  </Box>
                </Box>
              )}
              {student.emergencyContact && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Emergency Contact</Typography>
                    <Typography variant="body2">{student.emergencyContact}</Typography>
                  </Box>
                </Box>
              )}
              {student.medicalNotes && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocalHospitalIcon color="warning" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Medical Notes</Typography>
                    <Typography variant="body2">{student.medicalNotes}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </MotionCard>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="outlined"
          endIcon={<HistoryIcon />}
          onClick={() => navigate(`/student/${id}/attendance`)}
          fullWidth
          sx={{ py: 1.25, borderRadius: 2 }}
        >
          Attendance History
        </Button>
        <Button
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(`/student/${id}/trips`)}
          fullWidth
          sx={{ py: 1.25, borderRadius: 2 }}
        >
          Trip History
        </Button>
      </Box>
    </MotionBox>
  );
}
