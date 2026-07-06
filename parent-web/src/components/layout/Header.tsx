import { useMemo } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useNotifications';
import type { Student } from '@/types';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  students?: Student[];
  selectedStudentId?: string;
  onStudentChange?: (id: string) => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'SafeRide Nepal',
  '/students': 'My Children',
  '/bus-tracking': 'Bus Tracking',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

export default function Header({
  title,
  showBack,
  students = [],
  selectedStudentId,
  onStudentChange,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unreadData } = useUnreadCount();

  const pageTitle = useMemo(
    () => title || pageTitles[location.pathname] || 'SafeRide Nepal',
    [title, location.pathname],
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        zIndex: 1201,
        bgcolor: 'rgba(255,255,255,0.95)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
        {showBack && (
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {students.length > 1 && (
          <Select
            value={selectedStudentId ?? ''}
            onChange={(e) => onStudentChange?.(e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              mr: 1,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'primary.main',
              maxWidth: 140,
              '& .MuiSelect-select': { py: 0.5 },
            }}
          >
            {students.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        )}

        {selectedStudent && students.length === 1 && (
          <Typography
            variant="body2"
            sx={{ mr: 2, color: 'text.secondary', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}
          >
            {selectedStudent.name}
          </Typography>
        )}

        <IconButton onClick={() => navigate('/notifications')} sx={{ mr: 0.5 }}>
          <Badge
            badgeContent={unreadData?.count ?? 0}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', minWidth: 16, height: 16 } }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton onClick={() => navigate('/profile')}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            P
          </Avatar>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
