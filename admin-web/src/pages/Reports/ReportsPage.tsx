import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Tabs,
  Tab,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  DateRange,
  Download,
  People,
  DirectionsBus,
  Assessment,
  TrendingUp,
  CalendarMonth,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import { reportService } from '../../services/reports';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8', '#3b82f6'];
const CHART_COLORS = ['#2563eb', '#22c55e', '#ef4444', '#f59e0b', '#7c3aed'];

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton variant="rounded" height={350} sx={{ borderRadius: 2 }} />;
}

function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const dateFilters = { startDate, endDate };

  const dailyQuery = useQuery({
    queryKey: ['report-daily-attendance', startDate, endDate],
    queryFn: () => reportService.getDailyAttendance(dateFilters),
    enabled: tab === 0 && !!startDate && !!endDate,
  });

  const monthlyQuery = useQuery({
    queryKey: ['report-monthly-attendance', startDate, endDate],
    queryFn: () => reportService.getMonthlyAttendance(dateFilters),
    enabled: tab === 1 && !!startDate && !!endDate,
  });

  const driverQuery = useQuery({
    queryKey: ['report-driver-performance', startDate, endDate],
    queryFn: () => reportService.getDriverPerformance(dateFilters),
    enabled: tab === 2 && !!startDate && !!endDate,
  });

  const busUtilQuery = useQuery({
    queryKey: ['report-bus-utilization', startDate, endDate],
    queryFn: () => reportService.getBusUtilization(dateFilters),
    enabled: tab === 3 && !!startDate && !!endDate,
  });

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const renderDailyAttendance = () => {
    if (dailyQuery.isLoading) return <ChartSkeleton />;
    if (dailyQuery.isError) return <Alert severity="error">Failed to load daily attendance data.</Alert>;
    const data = dailyQuery.data;
    if (!data) return null;

    const chartData = data.daily ?? [];

    return (
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Assessment />} label={`Total Present: ${data.summary.totalPresent}`} variant="outlined" color="success" />
          <Chip label={`Total Absent: ${data.summary.totalAbsent}`} variant="outlined" color="error" />
          <Chip label={`Total Late: ${data.summary.totalLate}`} variant="outlined" color="warning" />
          <Chip icon={<TrendingUp />} label={`Avg Rate: ${(data.summary.averageAttendanceRate * 100).toFixed(1)}%`} variant="outlined" color="primary" />
        </Box>
        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No attendance data for the selected date range.</Typography>
          </Box>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Daily Attendance</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} barSize={16} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
                    labelFormatter={formatDate}
                  />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  };

  const renderMonthlyAttendance = () => {
    if (monthlyQuery.isLoading) return <ChartSkeleton />;
    if (monthlyQuery.isError) return <Alert severity="error">Failed to load monthly attendance data.</Alert>;
    const data = monthlyQuery.data;
    if (!data) return null;

    const chartData = data.monthly ?? [];

    return (
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<TrendingUp />} label={`Avg Rate: ${(data.summary.averageRate * 100).toFixed(1)}%`} variant="outlined" color="primary" />
          <Chip label={`Best: ${data.summary.bestMonth}`} variant="outlined" color="success" />
          <Chip label={`Worst: ${data.summary.worstMonth}`} variant="outlined" color="error" />
        </Box>
        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No monthly data available.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Monthly Attendance Trend</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Attendance Breakdown</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: chartData.reduce((s, r) => s + r.present, 0) },
                          { name: 'Absent', value: chartData.reduce((s, r) => s + r.absent, 0) },
                          { name: 'Late', value: chartData.reduce((s, r) => s + r.late, 0) },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {PIE_COLORS.slice(0, 3).map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Monthly Detail</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Present</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Absent</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.map((row) => (
                          <TableRow key={row.month} hover>
                            <TableCell>{row.month}</TableCell>
                            <TableCell align="right">{row.present}</TableCell>
                            <TableCell align="right">{row.absent}</TableCell>
                            <TableCell align="right">{(row.attendanceRate * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    );
  };

  const renderDriverPerformance = () => {
    if (driverQuery.isLoading) return <ChartSkeleton />;
    if (driverQuery.isError) return <Alert severity="error">Failed to load driver performance data.</Alert>;
    const data = driverQuery.data;
    if (!data) return null;

    const chartData = data.drivers ?? [];

    return (
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<TrendingUp />} label={`Avg On-Time: ${(data.summary.averageOnTimeRate * 100).toFixed(1)}%`} variant="outlined" color="primary" />
          <Chip label={`Best: ${data.summary.bestDriver}`} variant="outlined" color="success" />
          <Chip label={`Worst: ${data.summary.worstDriver}`} variant="outlined" color="error" />
        </Box>
        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No driver performance data available.</Typography>
          </Box>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Driver On-Time Performance</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="driverName" tick={{ fontSize: 11 }} stroke="#94a3b8" width={150} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                  <Bar dataKey="onTimeRate" name="On-Time Rate" fill="#22c55e" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {chartData.length > 0 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Driver Details</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Trips</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">On-Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Late</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">On-Time Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Students</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chartData.map((row) => (
                      <TableRow key={row.driverId} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.driverName}</TableCell>
                        <TableCell align="right">{row.totalTrips}</TableCell>
                        <TableCell align="right">{row.onTimeTrips}</TableCell>
                        <TableCell align="right">{row.lateTrips}</TableCell>
                        <TableCell align="right">{(row.onTimeRate * 100).toFixed(1)}%</TableCell>
                        <TableCell align="right">{row.totalStudentsTransported}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  };

  const renderBusUtilization = () => {
    if (busUtilQuery.isLoading) return <ChartSkeleton />;
    if (busUtilQuery.isError) return <Alert severity="error">Failed to load bus utilization data.</Alert>;
    const data = busUtilQuery.data;
    if (!data) return null;

    const chartData = data.buses ?? [];

    return (
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<TrendingUp />} label={`Avg Utilization: ${(data.summary.averageUtilization * 100).toFixed(1)}%`} variant="outlined" color="primary" />
          <Chip icon={<DirectionsBus />} label={`Total Trips: ${data.summary.totalTrips}`} variant="outlined" />
          <Chip icon={<People />} label={`Total Students: ${data.summary.totalStudents}`} variant="outlined" />
        </Box>
        {chartData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No bus utilization data available.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Bus Utilization Rate</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="plateNumber" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                      <Bar dataKey="utilizationRate" name="Utilization" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trips Distribution</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.map(b => ({ name: b.plateNumber, value: b.totalTrips })).filter(d => d.value > 0)}
                        cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Bus Details</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Bus</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Plate</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Capacity</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Trips</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Students</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Utilization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.map((row) => (
                          <TableRow key={row.busId} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{row.busNumber}</TableCell>
                            <TableCell align="right">{row.plateNumber}</TableCell>
                            <TableCell align="right">{row.capacity}</TableCell>
                            <TableCell align="right">{row.totalTrips}</TableCell>
                            <TableCell align="right">{row.totalStudents}</TableCell>
                            <TableCell align="right">{(row.utilizationRate * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Reports"
        subtitle="Analyze attendance, driver performance, and bus utilization"
        actions={[
          { label: 'Export PDF', variant: 'outlined', icon: <Download />, onClick: handleExportPDF },
        ]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="flex-end" flexWrap="wrap">
        <TextField
          type="date"
          size="small"
          label="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" startIcon={<DateRange />} disabled={!startDate || !endDate}>
          Apply Range
        </Button>
      </Stack>

      {(!startDate || !endDate) && (
        <Alert severity="info" sx={{ mb: 3 }}>Select a date range to view report data.</Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            pt: 1,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
          }}
        >
          <Tab icon={<Assessment sx={{ fontSize: 20 }} />} iconPosition="start" label="Daily Attendance" />
          <Tab icon={<CalendarMonth sx={{ fontSize: 20 }} />} iconPosition="start" label="Monthly Attendance" />
          <Tab icon={<People sx={{ fontSize: 20 }} />} iconPosition="start" label="Driver Performance" />
          <Tab icon={<DirectionsBus sx={{ fontSize: 20 }} />} iconPosition="start" label="Bus Utilization" />
        </Tabs>
        <CardContent sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}>{renderDailyAttendance()}</TabPanel>
          <TabPanel value={tab} index={1}>{renderMonthlyAttendance()}</TabPanel>
          <TabPanel value={tab} index={2}>{renderDriverPerformance()}</TabPanel>
          <TabPanel value={tab} index={3}>{renderBusUtilization()}</TabPanel>
        </CardContent>
      </Card>
    </motion.div>
  );
}
