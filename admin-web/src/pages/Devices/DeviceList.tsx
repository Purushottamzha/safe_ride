import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add,
  VpnKey,
  Warning,
} from '@mui/icons-material';
import DataTable, { type Column } from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { deviceService } from '../../services/devices';

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  bus?: { id: string; busNumber: string; plateNumber: string } | null;
  lastSeenAt: string | null;
  firmwareVersion: string | null;
  createdAt: string;
};

export default function DeviceList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState<{ id: string; apiKey: string } | null>(null);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [rotateResult, setRotateResult] = useState<{ apiKey: string } | null>(null);
  const [form, setForm] = useState({ name: '', type: 'WEBCAM_DEMO', busId: '', schoolId: '', firmwareVersion: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['devices', page, limit],
    queryFn: () => deviceService.list({ page: page + 1, limit }),
  });

  const registerMutation = useMutation({
    mutationFn: () => deviceService.register({
      name: form.name,
      type: form.type as any,
      busId: form.busId || undefined,
      schoolId: form.schoolId || undefined,
      firmwareVersion: form.firmwareVersion || undefined,
    }),
    onSuccess: (result) => {
      setApiKeyResult(result);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => deviceService.rotateKey(id),
    onSuccess: (result) => {
      setRotateResult(result);
      setRotateId(null);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const rows: DeviceRow[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns: Column<DeviceRow>[] = [
    { id: 'name', label: 'Name', render: (row) => row.name },
    { id: 'type', label: 'Type', render: (row) => <Chip label={row.type} size="small" color={row.type === 'WEBCAM_DEMO' ? 'default' : 'primary'} /> },
    { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" color={row.status === 'ACTIVE' ? 'success' : 'error'} /> },
    { id: 'bus', label: 'Bus', render: (row) => row.bus ? `${row.bus.busNumber} (${row.bus.plateNumber})` : '-' },
    { id: 'lastSeenAt', label: 'Last Seen', render: (row) => row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString() : 'Never' },
    { id: 'firmwareVersion', label: 'Firmware', render: (row) => row.firmwareVersion || '-' },
    {
      id: 'actions', label: 'Actions', width: 100,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Rotate API Key">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRotateId(row.id); }}>
              <VpnKey fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Devices"
        subtitle={`${total} registered device${total !== 1 ? 's' : ''}`}
        actions={[
          { label: 'Register Device', onClick: () => setRegisterOpen(true), variant: 'contained', icon: <Add /> },
        ]}
      />

      <DataTable
        columns={columns}
        data={rows}
        total={total}
        page={page}
        limit={limit}
        loading={isLoading}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
      />

      <Dialog open={registerOpen} onClose={() => { if (!registerMutation.isPending) { setRegisterOpen(false); setApiKeyResult(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Device</DialogTitle>
        <DialogContent>
          {apiKeyResult ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <strong>Device registered!</strong><br />
              API Key: <code style={{ wordBreak: 'break-all' }}>{apiKeyResult.apiKey}</code><br />
              <strong>Save this key — it will not be shown again.</strong>
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Device Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Type" select fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="WEBCAM_DEMO">Webcam Demo</MenuItem>
                <MenuItem value="ESP32_CAM">ESP32-CAM</MenuItem>
                <MenuItem value="ESP32_GPS">ESP32-GPS</MenuItem>
              </TextField>
              <TextField label="Firmware Version" fullWidth value={form.firmwareVersion} onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {apiKeyResult ? (
            <Button onClick={() => { setRegisterOpen(false); setApiKeyResult(null); setForm({ name: '', type: 'WEBCAM_DEMO', busId: '', schoolId: '', firmwareVersion: '' }); }}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setRegisterOpen(false)} disabled={registerMutation.isPending}>Cancel</Button>
              <Button variant="contained" onClick={() => registerMutation.mutate()} disabled={!form.name || registerMutation.isPending}>
                {registerMutation.isPending ? 'Registering...' : 'Register'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!rotateId}
        title="Rotate API Key"
        message="This will immediately invalidate the current API key. The device must be updated with the new key. Continue?"
        confirmLabel="Rotate Key"
        isLoading={rotateMutation.isPending}
        onConfirm={() => rotateId && rotateMutation.mutate(rotateId)}
        onCancel={() => setRotateId(null)}
      />

      <Dialog open={!!rotateResult} onClose={() => setRotateResult(null)} maxWidth="sm" fullWidth>
        <DialogContent>
          {rotateResult && (
            <Alert severity="warning" icon={<Warning />}>
              <strong>New API Key:</strong><br />
              <code style={{ wordBreak: 'break-all' }}>{rotateResult.apiKey}</code><br />
              <strong>The old key is immediately invalid. Save this key.</strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
