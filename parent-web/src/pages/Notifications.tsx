import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SchoolIcon from '@mui/icons-material/School';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNotifications, useNotificationActions } from '@/hooks/useNotifications';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { NotificationType } from '@/types';

const iconMap: Record<NotificationType, React.ReactNode> = {
  BOARDING: <DirectionsBusIcon sx={{ color: '#3B82F6' }} />,
  ARRIVAL: <SchoolIcon sx={{ color: '#10B981' }} />,
  DEPARTURE: <DirectionsBusIcon sx={{ color: '#F59E0B' }} />,
  ABSENT: <WarningIcon sx={{ color: '#EF4444' }} />,
  LATE: <WarningIcon sx={{ color: '#F59E0B' }} />,
  SYSTEM: <InfoIcon sx={{ color: '#64748B' }} />,
};

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const { handleMarkAsRead } = useNotificationActions();

  const handleNotificationClick = useCallback(
    (id: string, isRead: boolean) => {
      if (!isRead) {
        handleMarkAsRead(id);
      }
    },
    [handleMarkAsRead],
  );

  if (isLoading) {
    return <LoadingScreen message="Loading notifications..." />;
  }

  const notifications = data?.data ?? [];

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You'll see notifications here when your children board or leave the bus."
          icon={
            <CheckCircleIcon sx={{ fontSize: 56, color: 'success.light' }} />
          }
        />
      ) : (
        <>
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              sx={{
                mb: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: notif.isRead ? 'background.paper' : 'primary.50',
                '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
                opacity: notif.isRead ? 0.85 : 1,
              }}
              onClick={() => handleNotificationClick(notif.id, notif.isRead)}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', gap: 2 }}>
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                  {iconMap[notif.type] || <InfoIcon />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: notif.isRead ? 400 : 700, flex: 1 }}
                    >
                      {notif.title}
                    </Typography>
                    {!notif.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notif.body}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {getTimeAgo(notif.createdAt)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}

          {data && data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
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
