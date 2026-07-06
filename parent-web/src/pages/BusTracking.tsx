import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { getActiveTrip } from '@/services/trips';
import { getTodayStatus } from '@/services/attendance';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Student } from '@/types';

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

function EstimatedArrival() {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'info.50',
        border: '1px solid',
        borderColor: 'info.100',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Estimated Arrival
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
        --:--
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Available once bus is in transit
      </Typography>
    </Box>
  );
}

export default function BusTracking() {
  const { students, selectedStudentId } = useOutletContext<OutletContext>();

  const studentId = selectedStudentId || students[0]?.id;

  const { data: activeTrip, isLoading: loadingTrip } = useQuery({
    queryKey: ['active-trip', studentId],
    queryFn: () => getActiveTrip(studentId),
    enabled: !!studentId,
    refetchInterval: 15000,
  });

  const { data: todayStatus } = useQuery({
    queryKey: ['today-status', studentId],
    queryFn: () => getTodayStatus(studentId),
    enabled: !!studentId,
  });

  if (!studentId) {
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <EmptyState
          title="No student selected"
          description="Select a student to track their bus."
        />
      </Box>
    );
  }

  if (loadingTrip) {
    return <LoadingScreen message="Loading bus tracking..." />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            height: 200,
            bgcolor: '#F0F4F8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <MapIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', px: 3 }}>
            Live map will appear here once GPS tracking is active for your child's bus.
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <DirectionsBusIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {activeTrip?.busNumber || 'Bus'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeTrip?.driverName
                  ? `Driver: ${activeTrip.driverName}`
                  : todayStatus?.message || 'No active trip'}
              </Typography>
            </Box>
            {activeTrip && (
              <Chip
                label={activeTrip.direction === 'TO_SCHOOL' ? 'To School' : 'From School'}
                color={activeTrip.direction === 'TO_SCHOOL' ? 'primary' : 'secondary'}
                size="small"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>

            {activeTrip ? (
            <EstimatedArrival />
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.50',
                textAlign: 'center',
              }}
            >
              <DirectionsBusIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Your child is not currently on a bus.
              </Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            fullWidth
            sx={{ mt: 2, borderRadius: 2 }}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time GPS tracking, live bus location on map, estimated arrival times, and route
            information will be available in the next update. Stay tuned!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
