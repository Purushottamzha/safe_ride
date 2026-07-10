import { useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Alert, MenuItem, TextField, Stack, LinearProgress,
} from '@mui/material';
import {
  Upload, Download, Description, TableChart, PictureAsPdf,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { exportService } from '../../services/export';

const entities = [
  { value: 'students', label: 'Students' },
  { value: 'parents', label: 'Parents' },
  { value: 'drivers', label: 'Drivers' },
  { value: 'buses', label: 'Buses' },
  { value: 'routes', label: 'Routes' },
  { value: 'stops', label: 'Stops' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'trips', label: 'Trips' },
];

export default function BulkImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importEntity, setImportEntity] = useState('students');
  const [exportEntity, setExportEntity] = useState('students');
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const result = await exportService.importCsv(importEntity, file);
      setImportResult(`Successfully imported ${result.imported} records.${result.errors.length ? ` ${result.errors.length} errors.` : ''}`);
    } catch (err: any) {
      setImportError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const methodName = `export${format.charAt(0).toUpperCase() + format.slice(1)}` as 'exportCsv' | 'exportExcel' | 'exportPdf';
      const blob = await exportService[methodName](exportEntity);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportEntity}-export.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
    }
  };

  return (
    <Box>
      <PageHeader title="Bulk Import / Export" subtitle="Import and export data in bulk" />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Upload color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Import CSV</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a CSV file to bulk import records. The file must match the expected column format.
              </Typography>
              <Stack spacing={2}>
                <TextField select size="small" label="Entity" value={importEntity} onChange={(e) => setImportEntity(e.target.value)} fullWidth>
                  {entities.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </TextField>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <Button variant="outlined" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? 'Importing...' : 'Choose CSV File'}
                </Button>
                {importing && <LinearProgress />}
                {importResult && <Alert severity="success">{importResult}</Alert>}
                {importError && <Alert severity="error">{importError}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Download color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Export Data</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export your data in CSV, Excel, or PDF format.
              </Typography>
              <Stack spacing={2}>
                <TextField select size="small" label="Entity" value={exportEntity} onChange={(e) => setExportEntity(e.target.value)} fullWidth>
                  {entities.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </TextField>
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" startIcon={<Description />} onClick={() => handleExport('csv')} fullWidth>
                    CSV
                  </Button>
                  <Button variant="outlined" startIcon={<TableChart />} onClick={() => handleExport('excel')} fullWidth>
                    Excel
                  </Button>
                  <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={() => handleExport('pdf')} fullWidth>
                    PDF
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
