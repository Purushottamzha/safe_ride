import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SchoolIcon from '@mui/icons-material/School';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { motion } from 'framer-motion';
import { notificationPreferenceService } from '@/services/notifications';
import type { NotificationPreference } from '@/types';

const EVENT_CONFIG: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  TRIP_STARTED: { label: 'Trip Started', description: 'When the bus begins its route', icon: <DirectionsBusIcon />, color: '#2563eb' },
  BUS_APPROACHING: { label: 'Bus Approaching', description: 'When the bus is near a stop', icon: <DirectionsBusIcon />, color: '#0891b2' },
  STUDENT_BOARDED: { label: 'Student Boarded', description: 'When your child scans in', icon: <SchoolIcon />, color: '#16a34a' },
  STUDENT_EXITED: { label: 'Student Exited', description: 'When your child scans out', icon: <SchoolIcon />, color: '#7c3aed' },
  STUDENT_ABSENT: { label: 'Absent Alert', description: 'When your child is marked absent', icon: <WarningIcon />, color: '#f59e0b' },
  TRIP_COMPLETED: { label: 'Trip Completed', description: 'When the bus finishes the route', icon: <DirectionsBusIcon />, color: '#22c55e' },
  ROUTE_DEVIATION: { label: 'Route Deviation', description: 'When the bus leaves its route', icon: <ErrorOutlineIcon />, color: '#ef4444' },
  EMERGENCY_ALERT: { label: 'Emergency Alert', description: 'Critical safety notifications', icon: <ErrorOutlineIcon />, color: '#dc2626' },
  DELAY_ALERT: { label: 'Delay Alert', description: 'When the bus is significantly delayed', icon: <WarningIcon />, color: '#f97316' },
  SYSTEM_ANNOUNCEMENT: { label: 'System Announcements', description: 'Platform updates and notices', icon: <InfoIcon />, color: '#6b7280' },
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationPreferenceService.get();
      const prefMap: Record<string, boolean> = {};
      for (const key of Object.keys(EVENT_CONFIG)) {
        prefMap[key] = data.find((p: NotificationPreference) => p.eventType === key)?.enabled ?? true;
      }
      setPreferences(prefMap);
    } catch {
      const defaults: Record<string, boolean> = {};
      for (const key of Object.keys(EVENT_CONFIG)) {
        defaults[key] = true;
      }
      setPreferences(defaults);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (eventType: string) => {
    setPreferences(prev => ({ ...prev, [eventType]: !prev[eventType] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = Object.entries(preferences).map(([eventType, enabled]) => ({
        eventType,
        channel: 'IN_APP' as const,
        enabled,
      }));
      await notificationPreferenceService.update(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 640, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <NotificationsIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Notification Preferences</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose which events you want to be notified about
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Preferences saved successfully!</Alert>}

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5 }} />
        ))
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {Object.entries(EVENT_CONFIG).map(([eventType, config], idx) => (
              <Box
                key={eventType}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: idx < Object.keys(EVENT_CONFIG).length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${config.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color }}>
                  {config.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>{config.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{config.description}</Typography>
                </Box>
                <Chip label="In-App" size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                <Switch
                  checked={preferences[eventType] ?? true}
                  onChange={() => handleToggle(eventType)}
                  size="small"
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button variant="outlined" onClick={loadPreferences} disabled={loading}>Reset</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </motion.div>
  );
}
