import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Satellite as ControlCenterIcon,
  People as StudentsIcon,
  AirportShuttle as DriversIcon,
  DirectionsBus as BusesIcon,
  Route as RoutesIcon,
  SwapHoriz as AssignmentsIcon,
  CalendarMonth as CalendarIcon,
  Map as TripsIcon,
  Checklist as AttendanceIcon,
  Notifications as NotificationsIcon,
  ReportProblem as IncidentsIcon,
  Assessment as ReportsIcon,
  Analytics as AnalyticsIcon,
  School as SchoolsIcon,
  PeopleAlt as UsersIcon,
  Build as MaintenanceIcon,
  VerifiedUser as SafetyIcon,
  PendingActions as PendingApprovalsIcon,
  QrCodeScanner as GateScannerIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';

const DRAWER_WIDTH = 260;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Control Center', path: '/control-center', icon: <ControlCenterIcon /> },
  { label: 'Students', path: '/students', icon: <StudentsIcon /> },
  { label: 'Pending Approvals', path: '/students/pending-approvals', icon: <PendingApprovalsIcon /> },
  { label: 'Drivers', path: '/drivers', icon: <DriversIcon /> },
  { label: 'Buses', path: '/buses', icon: <BusesIcon /> },
  { label: 'Routes', path: '/routes', icon: <RoutesIcon /> },
  { label: 'Assignments', path: '/assignments', icon: <AssignmentsIcon /> },
  { label: 'Calendar', path: '/assignments/calendar', icon: <CalendarIcon /> },
  { label: 'Trips', path: '/trips', icon: <TripsIcon /> },
  { label: 'Attendance', path: '/attendance', icon: <AttendanceIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
  { label: 'Incidents', path: '/incidents', icon: <IncidentsIcon /> },
  { label: 'Reports', path: '/reports', icon: <ReportsIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  { label: 'Maintenance', path: '/maintenance', icon: <MaintenanceIcon /> },
  { label: 'Driver Safety', path: '/driver-safety', icon: <SafetyIcon /> },
  { label: 'Devices', path: '/devices', icon: <DevicesIcon /> },
  { label: 'Gate Scanner', path: '/gate-scanner', icon: <GateScannerIcon /> },
  { label: 'Schools', path: '/schools', icon: <SchoolsIcon />, adminOnly: true },
  { label: 'Users', path: '/users', icon: <UsersIcon />, adminOnly: true },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'SUPER_ADMIN'
  );

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          SR
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            SafeRide
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Admin Portal
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) onClose();
                }}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.disabled">
          SafeRide Nepal v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {content}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
