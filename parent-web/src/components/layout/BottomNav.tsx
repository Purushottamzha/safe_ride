import { useMemo } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import Badge from '@mui/material/Badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useNotifications';

const navItems = [
  { label: 'Home', value: '/dashboard', icon: HomeIcon },
  { label: 'Students', value: '/students', icon: PeopleIcon },
  { label: 'Bus', value: '/bus-tracking', icon: DirectionsBusIcon },
  { label: 'Alerts', value: '/notifications', icon: NotificationsIcon },
  { label: 'Profile', value: '/profile', icon: PersonIcon },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unreadData } = useUnreadCount();

  const currentValue = useMemo(() => {
    const path = location.pathname;
    const match = navItems.find((item) => path.startsWith(item.value));
    return match?.value ?? false;
  }, [location.pathname]);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { sm: 'none' },
      }}
      elevation={0}
    >
      <BottomNavigation
        value={currentValue}
        onChange={(_, newValue: string) => navigate(newValue)}
        showLabels
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.value === '/notifications';
          return (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                isNotifications ? (
                  <Badge
                    badgeContent={unreadData?.count ?? 0}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.5625rem', minWidth: 14, height: 14 } }}
                  >
                    <Icon />
                  </Badge>
                ) : (
                  <Icon />
                )
              }
              sx={{
                minWidth: 0,
                py: 0.5,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.6875rem',
                  mt: 0.25,
                },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
