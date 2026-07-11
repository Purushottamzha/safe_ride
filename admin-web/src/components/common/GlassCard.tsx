import { Card, CardContent, type CardProps, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps extends CardProps {
  children: ReactNode;
  blur?: number;
  opacity?: number;
  gradient?: boolean;
}

export default function GlassCard({
  children, blur = 10, opacity = 0.06, gradient, sx, ...props
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.7),
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.08)}`,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.2)'
            : `0 8px 32px ${alpha(theme.palette.common.black, opacity)}`,
          ...(gradient && {
            background: isDark
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          }),
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: isDark
              ? '0 12px 48px rgba(0,0,0,0.3)'
              : `0 12px 48px ${alpha(theme.palette.common.black, 0.08)}`,
            transform: 'translateY(-1px)',
          },
          ...sx,
        }}
        elevation={0}
        {...props}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
