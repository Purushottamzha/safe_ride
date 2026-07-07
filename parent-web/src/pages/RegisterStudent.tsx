import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export default function RegisterStudent() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolId, setSchoolId] = useState(user?.schoolId || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName || !dateOfBirth || !grade || !address || !schoolId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/pending-students/register', {
        firstName, lastName, dateOfBirth, grade,
        section: section || undefined,
        address, phone: phone || undefined,
        schoolId,
      });
      setSuccess(`Registration submitted for ${firstName} ${lastName}. The school will review and approve it.`);
      setFirstName(''); setLastName(''); setDateOfBirth(''); setGrade('');
      setSection(''); setAddress(''); setPhone('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <PersonAddIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Register Student
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Grade"
                  required
                  select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  {['1','2','3','4','5','6','7','8','9','10','11','12'].map((g) => (
                    <MenuItem key={g} value={g}>Grade {g}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Section"
                  select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="">None</MenuItem>
                  {['A','B','C','D','E'].map((s) => (
                    <MenuItem key={s} value={s}>Section {s}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                fullWidth
                label="Address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <TextField
                fullWidth
                label="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
                <LoadingButton
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/students')}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loading}
                  loadingIndicator={<CircularProgress size={18} color="inherit" />}
                >
                  Submit for Approval
                </LoadingButton>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
