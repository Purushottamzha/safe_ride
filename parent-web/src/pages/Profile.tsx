import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import LogoutIcon from '@mui/icons-material/Logout';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import PhoneIcon from '@mui/icons-material/PhoneOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Skeleton from '@mui/material/Skeleton';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { getMyChildren } from '@/services/students';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 1.5,
              bgcolor: 'primary.main',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Parent
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
            Account Information
          </Typography>
          <List disablePadding>
            <ListItem disableGutters sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={user.email}
                primaryTypographyProps={{ variant: 'caption', color: 'text.disabled' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            {user.phone && (
              <ListItem disableGutters sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PhoneIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={user.phone}
                  primaryTypographyProps={{ variant: 'caption', color: 'text.disabled' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
            Linked Children
          </Typography>
          {loadingChildren ? (
            <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ) : children.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No children linked to your account.
            </Typography>
          ) : (
            <List disablePadding>
              {children.map((child) => (
                <ListItem
                  key={child.id}
                  disableGutters
                  component={Link}
                  to={`/student/${child.id}`}
                  sx={{
                    px: 0,
                    textDecoration: 'none',
                    color: 'inherit',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={child.photoUrl}
                      sx={{ bgcolor: 'primary.light', fontSize: '0.875rem', fontWeight: 700 }}
                    >
                      {child.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={child.name}
                    secondary={`${child.grade} - ${child.school}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ArrowForwardIcon fontSize="small" color="action" />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
            Preferences
          </Typography>
          <List disablePadding>
            <ListItem disableGutters sx={{ px: 0 }}>
              <ListItemText
                primary="Emergency Alerts"
                secondary="Receive SMS for urgent notifications"
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Switch
                checked={emergencyAlerts}
                onChange={(e) => setEmergencyAlerts(e.target.checked)}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Button
        variant="outlined"
        color="error"
        fullWidth
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        sx={{ py: 1.5, borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
      >
        {logoutMutation.isPending ? 'Logging out...' : 'Sign Out'}
      </Button>
    </Box>
  );
}
