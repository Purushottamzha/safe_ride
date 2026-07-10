import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem, CircularProgress, Alert, FormControl, InputLabel, Select, Chip,
} from '@mui/material';
import { Print, PictureAsPdf } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { studentService } from '../../services/students';
import { qrManagementService } from '../../services/qrManagement';

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const CARDS_PER_PAGE = [8, 12, 16];

export default function PrintCards() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [cardsPerPage, setCardsPerPage] = useState(12);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handleLoadCards = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: Record<string, any> = {};
      if (grade) filters.grade = grade;
      if (section) filters.section = section;
      const data = await qrManagementService.getPrintableCards(filters);
      setCards(data);
    } catch {
      setError('Failed to load printable cards. Ensure QR codes have been generated.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const chunks = chunkArray(cards, cardsPerPage);
    printWindow.document.write(`
      <html>
        <head>
          <title>SafeRide Nepal - Student ID Cards</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }
            .page { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; page-break-after: always; margin-bottom: 20px; }
            .card { border: 1px solid #ccc; border-radius: 8px; padding: 8px; text-align: center; font-size: 10px; page-break-inside: avoid; }
            .card img.profile { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
            .card img.qr { width: 80px; height: 80px; }
            .card .name { font-weight: bold; font-size: 11px; margin: 4px 0; }
            .card .detail { color: #555; font-size: 9px; margin: 1px 0; }
            .card .school { font-size: 9px; color: #2563eb; font-weight: 600; margin-bottom: 4px; }
            .no-print { display: none; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${chunks.map(chunk => `
            <div class="page">
              ${chunk.map(c => `
                <div class="card">
                  <div class="school">${c.schoolName}</div>
                  ${c.profilePicture ? `<img class="profile" src="${c.profilePicture}" alt="" />` : `<div style="width:50px;height:50px;border-radius:50%;background:#e5e7eb;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:18px;color:#9ca3af;">?</div>`}
                  <div class="name">${c.firstName} ${c.lastName}</div>
                  <div class="detail">${c.studentId}</div>
                  <div class="detail">Class ${c.grade} - ${c.section}</div>
                  <div class="detail">Bus: ${c.busNumber}</div>
                  <div class="detail">Emergency: ${c.emergencyContact}</div>
                  <img class="qr" src="${c.qrImage}" alt="QR" />
                </div>
              `).join('')}
            </div>
          `).join('')}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  return (
    <Box>
      <PageHeader title="Print ID Cards" subtitle="Generate printable A4 sheets with student ID cards" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Filters</Typography>
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
                  <Grid item xs={12}>
                    <TextField select fullWidth size="small" label="Cards per page" value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))}>
                      {CARDS_PER_PAGE.map((n) => <MenuItem key={n} value={n}>{n} cards / page</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={handleLoadCards} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : 'Load Cards'}
                  </Button>
                  <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} disabled={cards.length === 0}>
                    Print ({cards.length} cards)
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Preview</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {cards.length === 0 && !loading && (
                  <Typography variant="body2" color="text.secondary">Select filters and click "Load Cards" to preview</Typography>
                )}
                <Box ref={printRef} sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                  {cards.slice(0, 16).map((card, i) => (
                    <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{card.schoolName}</Typography>
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'grey.200', mx: 'auto', my: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'grey.500' }}>?</Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{card.firstName} {card.lastName}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">{card.studentId}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">Class {card.grade}-{card.section}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">Bus: {card.busNumber}</Typography>
                      {card.qrImage && <Box component="img" src={card.qrImage} sx={{ width: 60, height: 60, mt: 0.5 }} />}
                    </Box>
                  ))}
                </Box>
                {cards.length > 16 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    +{cards.length - 16} more cards (will be printed across multiple pages)
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
