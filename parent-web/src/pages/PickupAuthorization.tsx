import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, TextField, Avatar, Chip,
} from '@mui/material';
import { PersonAdd, ArrowBack, CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AuthorizedPerson {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isActive: boolean;
}

export default function PickupAuthorization() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const [authorizedPersons] = useState<AuthorizedPerson[]>([
    { id: '1', name: 'Grandmother', phone: '+977-98XXXXXXXX', relation: 'Grandmother', isActive: true },
  ]);

  const handleAddPerson = () => {
    setShowForm(false);
    setName('');
    setPhone('');
    setRelation('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>
        Back
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Pickup Authorization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage who is authorized to pick up your child from the bus stop.
      </Typography>

      {authorizedPersons.map((person) => (
        <Card key={person.id} sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: person.isActive ? 'success.main' : 'text.disabled' }}>
                {person.isActive ? <CheckCircle /> : <Cancel />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{person.name}</Typography>
                <Typography variant="caption" color="text.secondary">{person.relation} &bull; {person.phone}</Typography>
              </Box>
              <Chip size="small" label={person.isActive ? 'Active' : 'Inactive'} color={person.isActive ? 'success' : 'default'} />
            </Box>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Add Person</Typography>
            <Stack spacing={2}>
              <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField fullWidth label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <TextField fullWidth label="Relation" value={relation} onChange={(e) => setRelation(e.target.value)}
                placeholder="e.g. Grandmother, Uncle" />
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={() => setShowForm(false)} fullWidth>Cancel</Button>
                <Button variant="contained" onClick={handleAddPerson} disabled={!name || !phone} fullWidth>
                  Save
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Button fullWidth variant="outlined" startIcon={<PersonAdd />} onClick={() => setShowForm(true)}>
          Add Person
        </Button>
      )}
    </Box>
  );
}
