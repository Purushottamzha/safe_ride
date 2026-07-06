import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyChildren } from '@/services/students';
import { getTodayStatus } from '@/services/attendance';
import { getNotifications } from '@/services/notifications';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { Student, TodayStatus } from '@/types';

interface OutletContext {
  students: Student[];
  selectedStudentId: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function GreetingIcon() {
  const hour = new Date().getHours();
  return hour < 17 ? <WbSunnyIcon /> : <NightsStayIcon />;
}

function StudentStatusCard({ student }: { student: Student }) {
  const navigate = useNavigate();
  const { data: todayStatus, isLoading } = useQuery({
    queryKey: ['today-status', student.id],
    queryFn: () => getTodayStatus(student.id),
    refetchInterval: 30000,
  });

  const statusColor = getStatusColor(todayStatus);

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
        },
        borderLeft: `4px solid ${statusColor}`,
      }}
      onClick={() => navigate(`/student/${student.id}`)}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Avatar
            src={student.photoUrl}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.light',
              fontSize: '1.125rem',
              fontWeight: 700,
            }}
          >
            {student.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" noWrap sx={{ fontSize: '1rem', fontWeight: 700 }}>
              {student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {student.grade} &bull; {student.school}
            </Typography>
          </Box>
        </Box>

        {isLoading ? (
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2 }} />
        ) : todayStatus ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${statusColor}10`,
              border: `1px solid ${statusColor}30`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: statusColor,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: statusColor }}>
                {todayStatus.message}
              </Typography>
            </Box>
            {todayStatus.lastScanTime && (
              <Typography variant="caption" color="text.secondary">
                Last scan: {new Date(todayStatus.lastScanTime).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              Status unavailable
            </Typography>
          </Box>
        )}

        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          sx={{ mt: 1.5, width: '100%', justifyContent: 'space-between' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/student/${student.id}`);
          }}
        >
          View Full Timeline
        </Button>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status?: TodayStatus): string {
  if (!status) return '#94A3B8';
  const s = status.status;
  if (s === 'present') return '#10B981';
  if (s === 'absent') return '#EF4444';
  if (s === 'late') return '#F59E0B';
  if (s === 'no_school') return '#94A3B8';
  if (status.currentTripStatus === 'BOARDED' || status.currentTripStatus === 'IN_TRANSIT')
    return '#3B82F6';
  return '#94A3B8';
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { students } = useOutletContext<OutletContext>();

  const { data: studentsList = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
    initialData: students,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', { page: 1, limit: 5 }],
    queryFn: () => getNotifications({ page: 1, limit: 5 }),
  });

  if (loadingStudents) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <GreetingIcon />
        <Typography variant="h2" sx={{ fontSize: '1.375rem', fontWeight: 700 }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}
        </Typography>
      </Box>

      {studentsList.length === 0 ? (
        <EmptyState
          title="No students linked"
          description="You don't have any children linked to your account yet. Please contact the school."
        />
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {studentsList.map((student) => (
            <Grid key={student.id} item xs={12} sm={6}>
              <StudentStatusCard student={student} />
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon fontSize="small" color="action" />
              <Typography variant="h5">Recent Alerts</Typography>
            </Box>
            <Button size="small" onClick={() => navigate('/notifications')}>
              See All
            </Button>
          </Box>
          <Divider sx={{ mb: 1.5 }} />

          {!notifData || notifData.data.length === 0 ? (
            <EmptyState
              title="No recent alerts"
              description="You're all caught up!"
              icon={
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 24,
                  }}
                >
                  &check;
                </Box>
              }
            />
          ) : (
            notifData.data.slice(0, 3).map((notif, i) => (
              <Box
                key={notif.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1,
                  borderBottom: i < 2 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  opacity: notif.isRead ? 0.7 : 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: notif.isRead ? 'transparent' : 'primary.main',
                    mt: 0.75,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: notif.isRead ? 400 : 600 }} noWrap>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
