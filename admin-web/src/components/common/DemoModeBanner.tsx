import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Science, Stop, Speed } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDemoStore } from '../../store/demoStore';
import api from '../../services/api';
import { useState } from 'react';

export default function DemoModeBanner() {
  const { enabled, speed } = useDemoStore();
  const setEnabled = useDemoStore((s) => s.setEnabled);
  const [stopping, setStopping] = useState(false);

  if (!enabled) return null;

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.post('/simulator/stop');
    } catch { /* ignore */ }
    setEnabled(false);
    setStopping(false);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 40, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          height: 40,
          px: 2,
          background: 'linear-gradient(90deg, #059669, #10b981, #059669)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        }}
      >
        <Science sx={{ fontSize: 18, color: '#fff' }} />
        <Typography
          variant="caption"
          sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Demo Mode Active
        </Typography>
        <Chip
          icon={<Speed sx={{ fontSize: 14, color: '#fff !important' }} />}
          label={`${speed}x`}
          size="small"
          sx={{
            height: 22,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.65rem',
            '& .MuiChip-icon': { ml: 0.5 },
          }}
        />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.6rem' }}>
          Simulation running with {speed}x speed
        </Typography>
        <Tooltip title="Stop Demo Mode">
          <IconButton
            size="small"
            onClick={handleStop}
            disabled={stopping}
            sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
          >
            <Stop sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </motion.div>
  );
}
