import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import { QrCode, Refresh, Download, Print, Visibility, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import { qrManagementService } from '../../services/qrManagement';
import { studentService } from '../../services/students';

interface PreviewData {
  student: any;
  qrPayload: any;
  qrImage: string;
  qrGeneratedAt: string;
  qrVersion: number;
}

export default function StudentQR() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', page, limit, search],
    queryFn: () => studentService.list({ page: page + 1, limit, search: search || undefined }),
  });

  const generateMutation = useMutation({
    mutationFn: (studentId: string) => qrManagementService.generateQR(studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: (studentId: string) => qrManagementService.regenerateQR(studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const students = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handlePreview = async (studentId: string) => {
    try {
      const info = await qrManagementService.getStudentQR(studentId);
      let qrImage = '';
      if (info.qrExists) {
        const blob = await qrManagementService.downloadQR(studentId);
        qrImage = URL.createObjectURL(blob);
      }
      setPreviewData({
        student: info.student,
        qrPayload: info.qrPayload,
        qrImage,
        qrGeneratedAt: info.qrGeneratedAt,
        qrVersion: info.qrVersion,
      });
      setPreviewOpen(true);
    } catch {}
  };

  const handleDownload = async (studentId: string) => {
    try {
      const blob = await qrManagementService.downloadQR(studentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const handlePrint = (studentId: string) => {
    navigate(`/qr-management/print/${studentId}`);
  };

  return (
    <Box>
      <PageHeader title="Student QR Codes" subtitle="Generate and manage individual student QR codes" />
      <GlassCard sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by student ID, name, class, section, or bus..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />
      </GlassCard>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : isError ? (
        <Alert severity="error">Failed to load students</Alert>
      ) : (
        <GlassCard sx={{ p: '0 !important' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>QR Status</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student: any, i: number) => (
                  <motion.tr key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={student.qrGeneratedAt ? 'Generated' : 'Missing'}
                        color={student.qrGeneratedAt ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{student.qrVersion || '-'}</TableCell>
                    <TableCell align="right">
                      {student.qrGeneratedAt ? (
                        <>
                          <Tooltip title="Preview"><IconButton size="small" onClick={() => handlePreview(student.studentId)}><Visibility /></IconButton></Tooltip>
                          <Tooltip title="Download"><IconButton size="small" onClick={() => handleDownload(student.studentId)}><Download /></IconButton></Tooltip>
                          <Tooltip title="Print"><IconButton size="small" onClick={() => handlePrint(student.studentId)}><Print /></IconButton></Tooltip>
                          <Tooltip title="Regenerate"><IconButton size="small" onClick={() => regenerateMutation.mutate(student.studentId)}><Refresh /></IconButton></Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Generate QR">
                          <IconButton size="small" color="primary" onClick={() => generateMutation.mutate(student.studentId)}>
                            <QrCode />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={limit} rowsPerPageOptions={[limit]} />
        </GlassCard>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR Preview - {previewData?.student?.studentId}</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {previewData.qrImage && (
                <Box component="img" src={previewData.qrImage} alt="QR Code" sx={{ width: 250, height: 250, mb: 2 }} />
              )}
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                {JSON.stringify(previewData.qrPayload, null, 2)}
              </Typography>
              <Typography variant="body2"><strong>Student:</strong> {previewData.student.firstName} {previewData.student.lastName}</Typography>
              <Typography variant="body2"><strong>Class:</strong> {previewData.student.grade} - {previewData.student.section}</Typography>
              <Typography variant="body2"><strong>Version:</strong> {previewData.qrVersion}</Typography>
              <Typography variant="body2"><strong>Generated:</strong> {previewData.qrGeneratedAt ? new Date(previewData.qrGeneratedAt).toLocaleString() : 'N/A'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {previewData && (
            <>
              <Button startIcon={<Download />} onClick={() => handleDownload(previewData.student.studentId)}>Download</Button>
              <Button startIcon={<Print />} onClick={() => handlePrint(previewData.student.studentId)} variant="contained">Print</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
