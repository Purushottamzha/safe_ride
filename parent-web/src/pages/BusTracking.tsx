import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { getActiveTrip } from '@/services/trips';
import { getTodayStatus } from '@/services/attendance';
import { socketService } from '@/services/socket';
import LiveBusMap, { LocationInfo } from '@/components/common/LiveBusMap';
import type { BusLocationData } from '@/components/common/LiveBusMap';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Student } from '@/types';

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

export default function BusTracking() {
  const { students, selectedStudentId } = useOutletContext<OutletContext>();
  const studentId = selectedStudentId || students[0]?.id;
  const [busLocation, setBusLocation] = useState<BusLocationData | undefined>();
  const [isLive, setIsLive] = useState(false);

  const { data: activeTrip, isLoading: loadingTrip } = useQuery({
    queryKey: ['active-trip', studentId],
    queryFn: () => getActiveTrip(studentId),
    enabled: !!studentId,
    refetchInterval: 30000,
  });

  const { data: todayStatus } = useQuery({
    queryKey: ['today-status', studentId],
    queryFn: () => getTodayStatus(studentId),
    enabled: !!studentId,
  });

  const handleBusLocation = useCallback((data: BusLocationData) => {
    setBusLocation(data);
    setIsLive(true);
  }, []);

  useEffect(() => {
    if (!studentId) return;
    socketService.on('bus:location', handleBusLocation);
    return () => { socketService.off('bus:location', handleBusLocation); };
  }, [studentId, handleBusLocation]);

  const student = students.find((s) => s.id === studentId);

  if (!studentId) {
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <EmptyState title="No student selected" description="Select a student to track their bus." />
      </Box>
    );
  }

  if (loadingTrip) return <LoadingScreen message="Loading bus tracking..." />;

  const hasLiveData = !!busLocation;
  const hasTrip = !!activeTrip;

  return (
    <AnimatePresence mode="wait">
      <motion.div key="bus-tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100vh - 128px)', sm: 'calc(100vh - 140px)' }, px: { xs: 0, sm: 0 } }}>
          <Box sx={{ flex: 1, position: 'relative', minHeight: 300, m: { xs: 0, sm: 2 }, borderRadius: { xs: 0, sm: 3 }, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <LiveBusMap
              busLocation={busLocation}
              routePath={hasTrip ? (activeTrip as any).routePoints ?? [] : []}
              homePosition={undefined}
              schoolPosition={[27.6855, 85.3245]}
              studentName={student?.name}
            />

            {!hasLiveData && !hasTrip && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(240,244,248,0.9)', zIndex: 500, gap: 1.5 }}>
                <DirectionsBusIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', px: 3 }}>
                  No active bus trip. Tracking will appear here once your child boards the bus.
                </Typography>
              </Box>
            )}

            {isLive && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 500 }}>
                <Chip icon={<MyLocationIcon sx={{ fontSize: 14 }} />} label="LIVE" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.625rem', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } } }} />
              </motion.div>
            )}
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <DirectionsBusIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {hasTrip ? (activeTrip as any).busNumber || 'Bus' : 'No Active Bus'}
                    </Typography>
                    {hasTrip && (
                      <Typography variant="caption" color="text.secondary">
                        Driver: {(activeTrip as any).driverName || 'Unknown'}
                      </Typography>
                    )}
                  </Box>
                  {hasTrip && (
                    <Chip label={(activeTrip as any).direction === 'TO_SCHOOL' ? 'To School' : 'From School'} color={(activeTrip as any).direction === 'TO_SCHOOL' ? 'primary' : 'secondary'} size="small" sx={{ ml: 'auto', fontWeight: 600, fontSize: '0.6875rem' }} />
                  )}
                </Box>

                {hasLiveData ? (
                  <LocationInfo bus={busLocation!} />
                ) : hasTrip ? (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Waiting for GPS signal...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <DirectionsBusIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Your child is not currently on a bus.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {student && (
              <Card sx={{ flex: 1, maxWidth: { sm: 320 } }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>Student Info</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <PersonIcon color="primary" sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {student.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grade {student.grade}
                      </Typography>
                    </Box>
                  </Box>
                  {todayStatus && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: todayStatus.status === 'present' ? '#10B981' : todayStatus.status === 'absent' ? '#EF4444' : '#F59E0B' }} />
                      <Typography variant="body2" color="text.secondary">{todayStatus.message}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
