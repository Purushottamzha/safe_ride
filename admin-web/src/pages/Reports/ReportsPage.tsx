import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { Assessment, People, Download, DateRange } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';

const reportTypes = [
  {
    title: 'Attendance Report',
    description: 'View and export student attendance records for a date range.',
    icon: <Assessment sx={{ fontSize: 40 }} />,
    color: '#2563eb',
  },
  {
    title: 'Driver Performance',
    description: 'Analyze driver performance including on-time rates and trip completion.',
    icon: <People sx={{ fontSize: 40 }} />,
    color: '#7c3aed',
  },
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader title="Reports" subtitle="Generate and export reports" />
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="flex-end">
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
      <Grid container spacing={3}>
        {reportTypes.map((report, i) => (
          <Grid item xs={12} md={6} key={i}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ color: report.color }}>{report.icon}</Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download />}
                    disabled={!startDate || !endDate}
                  >
                    Export CSV
                  </Button>
                  <Button variant="text" size="small">
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      {(!startDate || !endDate) && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Select a date range to enable report generation and export.
        </Alert>
      )}
    </motion.div>
  );
}
