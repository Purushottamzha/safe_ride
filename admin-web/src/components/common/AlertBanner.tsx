import { Alert, Box, Typography, Button, Collapse, alpha, useTheme } from '@mui/material';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Warning, Error, Info, Close,
} from '@mui/icons-material';

interface AlertBannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  dismissable?: boolean;
  action?: { label: string; onClick: () => void };
  icon?: boolean;
}

const iconMap = {
  success: CheckCircle,
  warning: Warning,
  error: Error,
  info: Info,
};

export default function AlertBanner({
  type, message, details, dismissable = true, action, icon = true,
}: AlertBannerProps) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const IconComponent = iconMap[type];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Alert
            severity={type}
            icon={icon ? <IconComponent /> : false}
            action={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {action && (
                  <Button size="small" variant="text" onClick={action.onClick} sx={{ fontWeight: 600 }}>
                    {action.label}
                  </Button>
                )}
                {dismissable && (
                  <Button size="small" onClick={() => setOpen(false)} sx={{ minWidth: 0, p: 0.5 }}>
                    <Close fontSize="small" />
                  </Button>
                )}
              </Box>
            }
            sx={{
              mb: 2.5,
              borderRadius: 2.5,
              fontWeight: 600,
              border: `1px solid ${alpha(
                type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6',
                isDark ? 0.2 : 0.1,
              )}`,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {message}
            </Typography>
            {details && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                {details}
              </Typography>
            )}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
