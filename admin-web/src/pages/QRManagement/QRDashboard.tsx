import { useQuery } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { QrCode, QrCode2, ErrorOutline, Autorenew, AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { qrManagementService } from '../../services/qrManagement';

export default function QRDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['qr-dashboard'],
    queryFn: () => qrManagementService.getDashboard(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load QR dashboard</Alert>;
  }

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? 0, icon: <QrCode sx={{ fontSize: 40 }} />, color: '#2563eb' },
    { label: 'QR Generated', value: data?.qrGenerated ?? 0, icon: <QrCode2 sx={{ fontSize: 40 }} />, color: '#16a34a' },
    { label: 'Missing QR', value: data?.missingQr ?? 0, icon: <ErrorOutline sx={{ fontSize: 40 }} />, color: '#dc2626' },
    { label: 'Regenerated Today', value: data?.regeneratedToday ?? 0, icon: <Autorenew sx={{ fontSize: 40 }} />, color: '#d97706' },
  ];

  return (
    <Box>
      <PageHeader title="QR Management" subtitle="Generate and manage student QR codes" />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card sx={{ position: 'relative', overflow: 'visible' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime color="action" />
            <Typography variant="body2" color="text.secondary">
              Last Generation: {data?.lastGenerationTime ? new Date(data.lastGenerationTime).toLocaleString() : 'Never'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
