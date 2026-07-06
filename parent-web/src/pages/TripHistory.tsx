import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useQuery } from '@tanstack/react-query';
import { getStudentTrips } from '@/services/trips';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';

export default function TripHistory() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', id, { page }],
    queryFn: () =>
      getStudentTrips(id!, { page, limit: 10 }),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingScreen message="Loading trip history..." />;
  }

  const trips = data?.data ?? [];

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <TimelineIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Trip History
        </Typography>
      </Box>

      {trips.length === 0 ? (
        <EmptyState
          title="No trips found"
          description="Trip history will appear here once your child starts using the service."
          icon={<TimelineIcon sx={{ fontSize: 56, color: 'text.disabled' }} />}
        />
      ) : (
        <>
          {trips.map((trip) => (
            <Card key={trip.id} sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(trip.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Chip
                      label={trip.direction === 'TO_SCHOOL' ? 'To School' : 'From School'}
                      size="small"
                      color={trip.direction === 'TO_SCHOOL' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                    <StatusBadge status={trip.status} type="trip" />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                    gap: 1,
                  }}
                >
                  {trip.boardTime && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Board Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(trip.boardTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )}
                  {trip.exitTime && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Exit Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(trip.exitTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  )}
                  {trip.duration && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {trip.duration} min
                      </Typography>
                    </Box>
                  )}
                  {trip.busNumber && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Bus
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {trip.busNumber}
                      </Typography>
                    </Box>
                  )}
                  {trip.driverName && (
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Driver
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {trip.driverName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}

          {data && data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={data.totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
