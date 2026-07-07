import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SchoolIcon from '@mui/icons-material/School';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, useNotificationActions } from '@/hooks/useNotifications';
import LoadingScreen from '@/components/common/LoadingScreen';
import EmptyState from '@/components/common/EmptyState';
import type { NotificationType, Notification as NotificationItem } from '@/types';

const MotionCard = motion.create(Card);

const iconMap: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  BOARDING: { icon: <DirectionsBusIcon />, color: '#3B82F6' },
  ARRIVAL: { icon: <SchoolIcon />, color: '#10B981' },
  DEPARTURE: { icon: <HomeIcon />, color: '#F59E0B' },
  ABSENT: { icon: <WarningIcon />, color: '#EF4444' },
  LATE: { icon: <WarningIcon />, color: '#F59E0B' },
  SYSTEM: { icon: <InfoIcon />, color: '#64748B' },
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

function groupByDate(items: NotificationItem[]): Map<string, NotificationItem[]> {
  const groups = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const key = new Date(item.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function NotificationGroup({
  date,
  items,
  onMarkRead,
}: {
  date: string;
  items: NotificationItem[];
  onMarkRead: (id: string, isRead: boolean) => void;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.6875rem',
          mb: 1.5,
          display: 'block',
          px: 0.5,
        }}
      >
        {date}
      </Typography>
      {items.map((notif, idx) => {
        const config = iconMap[notif.type] || iconMap.SYSTEM;
        return (
          <MotionCard
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ delay: idx * 0.03 }}
            sx={{
              mb: 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              bgcolor: notif.isRead ? 'background.paper' : 'primary.50',
              '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
              opacity: notif.isRead ? 0.85 : 1,
              overflow: 'hidden',
            }}
            onClick={() => onMarkRead(notif.id, notif.isRead)}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  mt: 0.25,
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: `${config.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.color,
                  fontSize: '1rem',
                }}
              >
                {config.icon}
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          flexShrink: 0,
                        }}
                      />
                    </motion.div>
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
          </MotionCard>
        );
      })}
    </Box>
  );
}

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const grouped = useMemo(() => {
    if (!data?.data) return new Map();
    return groupByDate(data.data);
  }, [data]);

  if (isLoading) {
    return <LoadingScreen message="Loading notifications..." />;
  }

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: '1.375rem', fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ minWidth: 0, px: 1.5 }}
          />
          {unreadCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={() => {
                notifications
                  .filter((n) => !n.isRead)
                  .slice(0, 10)
                  .forEach((n) => handleNotificationClick(n.id, n.isRead));
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

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
          <AnimatePresence mode="popLayout">
            {Array.from(grouped.entries()).map(([date, items]) => (
              <NotificationGroup
                key={date}
                date={date}
                items={items}
                onMarkRead={handleNotificationClick}
              />
            ))}
          </AnimatePresence>

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
