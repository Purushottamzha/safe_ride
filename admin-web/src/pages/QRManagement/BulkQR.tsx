import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem, LinearProgress, Alert, Chip,
} from '@mui/material';
import { QrCode, Download } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { qrManagementService } from '../../services/qrManagement';

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function BulkQR() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; skipped: number; total: number } | null>(null);

  const generateMutation = useMutation({
    mutationFn: (filters: Record<string, any>) => qrManagementService.bulkGenerate(filters),
    onSuccess: (data) => {
      setResult(data);
      setIsGenerating(false);
      setProgress(100);
    },
    onError: () => {
      setIsGenerating(false);
      setProgress(0);
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(30);
    const filters: Record<string, any> = {};
    if (grade) filters.grade = grade;
    if (section) filters.section = section;
    generateMutation.mutate(filters);
  };

  const handleGenerateAll = () => {
    setIsGenerating(true);
    setProgress(30);
    generateMutation.mutate({});
  };

  const handleDownloadZip = () => {
    const filters: Record<string, any> = {};
    if (grade) filters.grade = grade;
    if (section) filters.section = section;
    qrManagementService.downloadBulkZip(filters);
  };

  return (
    <Box>
      <PageHeader title="Bulk QR Generation" subtitle="Generate QR codes for multiple students at once" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Filter Students</Typography>
                <Grid container spacing={2}>
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
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="contained" startIcon={<QrCode />} onClick={handleGenerate} disabled={isGenerating}>
                    Generate QRs
                  </Button>
                  <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadZip}>
                    Download ZIP
                  </Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button variant="text" onClick={handleGenerateAll} disabled={isGenerating}>
                    Generate Entire School
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Generation Progress</Typography>
                {isGenerating && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="indeterminate" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Generating QR codes...</Typography>
                  </Box>
                )}
                {result && (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Generation Complete
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${result.generated} Generated`} color="success" />
                      <Chip label={`${result.skipped} Skipped`} color="info" />
                      <Chip label={`${result.total} Total`} color="default" />
                    </Box>
                  </Box>
                )}
                {!isGenerating && !result && (
                  <Typography variant="body2" color="text.secondary">
                    Select filters above and click "Generate QRs" to start bulk generation
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
