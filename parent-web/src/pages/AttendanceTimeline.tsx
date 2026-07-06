import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getStudentAttendance } from '@/services/attendance';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';


export default function AttendanceTimeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendance', id, { page, startDate, endDate }],
    queryFn: () =>
      getStudentAttendance(id!, {
        page,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: !!id,
  });

  const handleFilter = () => {
    setPage(1);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading attendance history..." />;
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Failed to load attendance data.</Typography>
        <Button onClick={() => navigate(0)} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Box>
    );
  }

  const records = data?.data ?? [];

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <CalendarMonthIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Attendance History
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column', sm: 'row' },
              mb: 2,
            }}
          >
            <TextField
              label="From"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleFilter}
              sx={{ minWidth: 100, height: 40, flexShrink: 0 }}
            >
              Filter
            </Button>
          </Box>
        </CardContent>
      </Card>

      {records.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="No records found for the selected period."
          icon={<CalendarMonthIcon sx={{ fontSize: 56, color: 'text.disabled' }} />}
        />
      ) : (
        <>
          {records.map((record) => (
            <Card key={record.id} sx={{ mb: 1.5 }}>
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
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                  <StatusBadge status={record.status} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {record.boardTime && (
                    <Typography variant="caption" color="text.secondary">
                      Board: {new Date(record.boardTime).toLocaleTimeString()}
                    </Typography>
                  )}
                  {record.exitTime && (
                    <Typography variant="caption" color="text.secondary">
                      Exit: {new Date(record.exitTime).toLocaleTimeString()}
                    </Typography>
                  )}
                  {record.isLate && (
                    <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                      Late
                    </Typography>
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
