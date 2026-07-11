import { Box, Typography, Chip, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import GlassCard from './GlassCard';

interface KpiCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color?: string;
  trend?: { value: number; isPositive: boolean; label?: string };
  subtitle?: string;
  onClick?: () => void;
  animate?: boolean;
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const steps = 24;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export default function KpiCard({
  title, value, icon, color = '#2563eb', trend, subtitle, onClick, animate = true,
}: KpiCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <GlassCard sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: alpha(color, isDark ? 0.08 : 0.06),
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, lineHeight: 1.1, color: 'text.primary' }}>
              {animate ? <AnimatedCount value={value} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                <Chip
                  label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: alpha(trend.isPositive ? '#22c55e' : '#ef4444', 0.1),
                    color: trend.isPositive ? '#16a34a' : '#dc2626',
                  }}
                />
                {trend.label && (
                  <Typography variant="caption" color="text.disabled">
                    {trend.label}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(color, isDark ? 0.12 : 0.1),
              color: color,
              flexShrink: 0,
              ml: 1,
            }}
          >
            {icon}
          </Box>
        </Box>
      </GlassCard>
    </motion.div>
  );
}
