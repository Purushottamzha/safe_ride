import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Slider,
  Alert, CircularProgress,
} from '@mui/material';
import {
  PlayArrow, Stop, Speed, DirectionsBus, Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface SimStatus {
  running: boolean;
  speed: number;
  buses: Array<{
    tripId: string; busId: string; lat: number; lng: number;
    speed: number; heading: number; occupancy: number;
    status: string; currentStopIndex: number; progress: number;
  }>;
}

export default function SimulatorPanel() {
  const [status, setStatus] = useState<SimStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get<SimStatus>('/simulator/status');
      setStatus(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStatus(); const iv = setInterval(fetchStatus, 3000); return () => clearInterval(iv); }, [fetchStatus]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.post('/simulator/start', { speed });
      setStatus((prev) => prev ? { ...prev, running: true, speed, buses: [] } : null);
    } catch (e) { /* ignore */ } finally { setLoading(false); fetchStatus(); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.post('/simulator/stop');
      setStatus((prev) => prev ? { ...prev, running: false } : null);
    } catch { /* ignore */ } finally { setLoading(false); fetchStatus(); }
  };

  const handleSpeedChange = async (val: number) => {
    setSpeed(val);
    if (status?.running) {
      try { await api.post('/simulator/speed', { speed: val }); } catch { /* ignore */ }
    }
  };

  const isRunning = status?.running ?? false;
  const busCount = status?.buses?.length ?? 0;

  return (
    <Card sx={{
      border: isRunning ? '2px solid' : '1px solid',
      borderColor: isRunning ? '#22c55e' : 'divider',
      bgcolor: isRunning ? '#f0fdf4' : undefined,
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline color={isRunning ? 'success' : 'disabled'} />
            <Typography variant="subtitle2" fontWeight={700}>
              School Day Simulator
            </Typography>
          </Box>
          <Chip
            label={isRunning ? `RUNNING ${busCount} buses` : 'IDLE'}
            size="small"
            color={isRunning ? 'success' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.6rem' }}
          />
        </Box>

        {isRunning && (
          <Alert severity="success" sx={{ mb: 1.5, py: 0.5, fontSize: '0.75rem' }}>
            Demo running at {status?.speed ?? speed}x speed &middot; {busCount} active buses
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 80 }}>
            <Speed sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
              {speed}x
            </Typography>
          </Box>
          <Slider
            size="small"
            value={speed}
            onChange={(_, v) => handleSpeedChange(v as number)}
            min={1}
            max={30}
            step={1}
            marks={[
              { value: 1, label: '1x' },
              { value: 5, label: '5x' },
              { value: 10, label: '10x' },
              { value: 30, label: '30x' },
            ]}
            disabled={loading}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isRunning ? (
            <Button
              fullWidth variant="outlined" color="error"
              startIcon={loading ? <CircularProgress size={16} /> : <Stop />}
              onClick={handleStop} disabled={loading}
              size="small"
            >
              Stop Demo
            </Button>
          ) : (
            <Button
              fullWidth variant="contained" color="success"
              startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
              onClick={handleStart} disabled={loading}
              size="small"
            >
              Start Demo
            </Button>
          )}
        </Box>

        {status && isRunning && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setExpanded(!expanded)}
              sx={{ fontSize: '0.7rem', textTransform: 'none' }}
            >
              {expanded ? 'Hide' : 'Show'} bus details ({busCount})
            </Button>
            <AnimatePresence>
              {expanded && status.buses.map((bus) => (
                <motion.div key={bus.tripId} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <DirectionsBus sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      Bus {bus.busId.slice(0, 6)} &middot; {Math.round(bus.speed)} km/h &middot; {bus.occupancy} students
                    </Typography>
                    <Chip label={bus.status} size="small" sx={{ fontSize: '0.5rem', height: 18 }} />
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
