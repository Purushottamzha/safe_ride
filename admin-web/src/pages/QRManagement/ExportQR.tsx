import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem, Alert, Chip, Divider,
} from '@mui/material';
import { Download, Archive, Image } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { qrManagementService } from '../../services/qrManagement';

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function ExportQR() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const handleExportZip = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const filters: Record<string, any> = {};
      if (grade) filters.grade = grade;
      if (section) filters.section = section;
      await qrManagementService.downloadBulkZip(filters);
      setExportResult('ZIP export completed successfully');
    } catch {
      setExportResult('Export failed. Ensure QR codes have been generated.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Export QR Codes" subtitle="Download QR codes in various formats" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Export Options</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField select fullWidth size="small" label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                      <MenuItem value="">All Grades</MenuItem>
                      {GRADES.map((g) => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField select fullWidth size="small" label="Section" value={section} onChange={(e) => setSection(e.target.value)}>
                      <MenuItem value="">All Sections</MenuItem>
                      {SECTIONS.map((s) => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Download Format</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="contained" startIcon={<Archive />} onClick={handleExportZip} disabled={exporting} size="large">
                    {exporting ? 'Exporting...' : 'Download as ZIP'}
                  </Button>
                  <Button variant="outlined" startIcon={<Image />} size="large" onClick={() => navigate('/qr/student')}>
                    Download as PNG (Individual)
                  </Button>
                </Box>
                {exportResult && (
                  <Alert severity={exportResult.includes('failed') ? 'error' : 'success'} sx={{ mt: 2 }}>
                    {exportResult}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Export Info</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">ZIP Export</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Downloads all selected QR codes as individual PNG files inside a ZIP archive.
                      Each file is named with the student's Student ID (e.g., STU-00001.png).
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">PNG Individual</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Download individual QR code PNG files from the Student QR page.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Print Sheets</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use the Print Cards page to generate printable A4 sheets with student ID cards including QR codes.
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Summary</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip icon={<Archive />} label="ZIP" color="primary" />
                      <Chip icon={<Image />} label="PNG" />
                      <Chip icon={<Download />} label="Bulk Download" />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
