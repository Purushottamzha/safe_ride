import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import { MarkEmailRead, Info, Warning, Error as ErrorIcon, CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { notificationService } from '../../services/notifications';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info color="info" />,
  warning: <Warning color="warning" />,
  error: <ErrorIcon color="error" />,
  success: <CheckCircle color="success" />,
};

const typeColors: Record<string, string> = {
  info: '#e0f2fe',
  warning: '#fef3c7',
  error: '#fee2e2',
  success: '#dcfce7',
};

export default function NotificationList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationService.list({ limit: 100 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.total} notifications` : ''}
        actions={[
          { label: 'Mark All Read', variant: 'outlined', icon: <MarkEmailRead />, onClick: () => markAllReadMutation.mutate() },
        ]}
      />
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', height: 72 }} />
          ))}
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No notifications</Typography>
          <Typography variant="body2" color="text.disabled">You're all caught up!</Typography>
        </Box>
      ) : (
        <AnimatePresence>
          <Stack spacing={1}>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor: notification.isRead ? 'background.paper' : typeColors[notification.type] ?? 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                    opacity: notification.isRead ? 0.7 : 1,
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <Box sx={{ mt: 0.25 }}>{typeIcons[notification.type] ?? <Info color="info" />}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 500 : 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {!notification.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton size="small" onClick={() => markReadMutation.mutate(notification.id)}>
                        <MarkEmailRead fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </motion.div>
            ))}
          </Stack>
        </AnimatePresence>
      )}
    </Box>
  );
}
