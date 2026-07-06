import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, Skeleton, Button, Alert } from '@mui/material';
import {
  PeopleAlt,
  AirportShuttle,
  DirectionsBus,
  Map,
  TrendingUp,
  WarningAmber,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import { dashboardService } from '../services/dashboard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  if (error) {
    return (
      <Box>
        <PageHeader title="Dashboard" />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()} startIcon={<Refresh />}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard data
        </Alert>
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Students', value: stats?.totalStudents ?? 0, icon: <PeopleAlt />, color: '#2563eb' },
    { title: 'Active Drivers', value: stats?.activeDrivers ?? 0, icon: <AirportShuttle />, color: '#7c3aed' },
    { title: 'Total Buses', value: stats?.totalBuses ?? 0, icon: <DirectionsBus />, color: '#0ea5e9' },
    { title: 'Active Trips', value: stats?.activeTrips ?? 0, icon: <Map />, color: '#f59e0b' },
    { title: "Today's Attendance", value: stats ? `${stats.todayAttendancePercent}%` : '0%', icon: <TrendingUp />, color: '#22c55e' },
    { title: 'Pending Incidents', value: stats?.pendingIncidents ?? 0, icon: <WarningAmber />, color: '#ef4444' },
  ];

  const weeklyData = stats?.weeklyAttendance ?? [];

  const quickActions = [
    { label: 'New Student', path: '/students/new', icon: <PeopleAlt /> },
    { label: 'New Driver', path: '/drivers/new', icon: <AirportShuttle /> },
    { label: 'New Bus', path: '/buses/new', icon: <DirectionsBus /> },
    { label: 'New Trip', path: '/trips/new', icon: <Map /> },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your school transportation system"
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <Skeleton variant="rounded" height={120} />
              ) : (
                <StatCard title={card.title} value={card.value} icon={card.icon} color={card.color} />
              )}
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={itemVariants}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Weekly Attendance
                </Typography>
                {isLoading ? (
                  <Skeleton variant="rounded" height={300} />
                ) : weeklyData.length === 0 ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No attendance data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData} barSize={28} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div variants={itemVariants}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Trips
                </Typography>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="text" sx={{ mb: 1.5 }} />
                  ))
                ) : !stats?.recentTrips || stats.recentTrips.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No recent trips</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {stats.recentTrips.slice(0, 8).map((trip) => (
                      <Box
                        key={trip.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: 'grey.50',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'grey.100' },
                        }}
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trip.driverName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trip.busPlate} · {trip.date}
                          </Typography>
                        </Box>
                        <StatusBadge status={trip.status} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {quickActions.map((action) => (
                    <Button
                      key={action.path}
                      variant="outlined"
                      color="inherit"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{ borderRadius: 2, py: 1.25, px: 2.5 }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
}
