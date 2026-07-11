import { useState } from 'react';
import {
  Box, Grid, Typography, Button, Chip, Stack, alpha, useTheme, TextField,
  Select, MenuItem, Switch, FormControlLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar,
} from '@mui/material';
import {
  WaterDrop, Cloud, Traffic, DirectionsBus, Warning, NotificationsActive,
  LocationOn, Celebration, School, Close, CheckCircle, ReportProblem,
  Router, PeopleAlt, Map,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../components/common/PageHeader';
import GlassCard from '../components/common/GlassCard';
import AlertBanner from '../components/common/AlertBanner';
import { staggerContainer, staggerItem } from '../utils/animations';

interface ToolAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  dialogTitle: string;
}

const tools: ToolAction[] = [
  {
    label: 'Rain Mode', description: 'Notify parents about rain delays',
    icon: <WaterDrop />, color: '#3b82f6',
    dialogTitle: 'Activate Rain Mode',
  },
  {
    label: 'Road Closure', description: 'Close a road and reroute buses',
    icon: <Cloud />, color: '#ef4444',
    dialogTitle: 'Report Road Closure',
  },
  {
    label: 'Traffic Alert', description: 'Broadcast heavy traffic warning',
    icon: <Traffic />, color: '#f59e0b',
    dialogTitle: 'Send Traffic Alert',
  },
  {
    label: 'Bus Replacement', description: 'Replace broken bus & notify',
    icon: <DirectionsBus />, color: '#7c3aed',
    dialogTitle: 'Replace Bus',
  },
  {
    label: 'Temp Pickup', description: 'Set temporary pickup location',
    icon: <LocationOn />, color: '#0ea5e9',
    dialogTitle: 'Set Temporary Pickup Location',
  },
  {
    label: 'Holiday Mode', description: 'Activate festival/holiday schedule',
    icon: <Celebration />, color: '#f97316',
    dialogTitle: 'Activate Holiday Mode',
  },
  {
    label: 'Assembly Point', description: 'Set emergency assembly point',
    icon: <School />, color: '#22c55e',
    dialogTitle: 'Set Emergency Assembly Point',
  },
  {
    label: 'School Closure', description: 'Notify all parents of closure',
    icon: <Close />, color: '#dc2626',
    dialogTitle: 'Issue School Closure Notice',
  },
  {
    label: 'Driver Absence', description: 'Manage absent driver workflow',
    icon: <PeopleAlt />, color: '#f59e0b',
    dialogTitle: 'Report Driver Absence',
  },
  {
    label: 'Late Bus', description: 'Notify parents of late bus',
    icon: <Map />, color: '#f97316',
    dialogTitle: 'Report Late Bus',
  },
  {
    label: 'Alternate Route', description: 'Switch to alternate route',
    icon: <Router />, color: '#2563eb',
    dialogTitle: 'Activate Alternate Route',
  },
];

export default function KathmanduTools() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolAction | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [messageText, setMessageText] = useState('');

  const handleToolClick = (tool: ToolAction) => {
    setActiveTool(tool);
    setMessageText('');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    setDialogOpen(false);
    setSnackbar({ open: true, message: `${activeTool?.label} activated successfully. Notifications sent to affected parents.`, severity: 'success' });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader
        title="Kathmandu Valley Operations"
        subtitle="Real-world operational tools for school transport management"
      />

      <AlertBanner
        type="info"
        message="Admin-Controlled Workflows"
        details="These tools send notifications to affected parents and drivers. Use responsibly during actual events."
        dismissable={false}
      />

      <Grid container spacing={2.5}>
        {tools.map((tool) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={tool.label}>
            <motion.div variants={staggerItem}>
              <GlassCard
                sx={{
                  cursor: 'pointer',
                  '&:hover': { borderColor: alpha(tool.color, 0.3) },
                }}
                onClick={() => handleToolClick(tool)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48, height: 48, borderRadius: 2.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: alpha(tool.color, isDark ? 0.12 : 0.08),
                      color: tool.color, flexShrink: 0,
                    }}
                  >
                    {tool.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {tool.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                      {tool.description}
                    </Typography>
                    <Chip
                      label="Activate"
                      size="small"
                      sx={{ mt: 1, fontWeight: 600, fontSize: '0.65rem', height: 22, bgcolor: alpha(tool.color, 0.1), color: tool.color }}
                    />
                  </Box>
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ color: activeTool?.color }}>{activeTool?.icon}</Box>
            {activeTool?.dialogTitle}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This action will send notifications to all affected parents and drivers. Fill in the details below.
            </Typography>
            <TextField
              label="Message (optional)"
              multiline
              rows={3}
              fullWidth
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Add additional information for parents..."
            />
            <Typography variant="caption" color="text.secondary">
              Notifications will be sent via in-app notification system.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" startIcon={<NotificationsActive />} sx={{ bgcolor: activeTool?.color, '&:hover': { bgcolor: activeTool?.color } }}>
            Activate & Notify
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
