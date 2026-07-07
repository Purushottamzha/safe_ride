import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Chip,
  Dialog,
  DialogContent,
  Link,
} from '@mui/material';
import {
  QrCodeScanner,
  PersonSearch,
  CheckCircle,
  Error as ErrorIcon,
  Close,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import api from '../services/api';
import { busService } from '../services/buses';

const DEBOUNCE_MS = 3000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000;

type ScanResult = {
  success: boolean;
  scanType?: 'BOARD_IN' | 'EXIT_OUT';
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    grade: string;
    section: string | null;
    profilePicture: string | null;
  };
  trip?: { id: string; type: string; status: string };
  message?: string;
  error?: string;
} | null;

type RetryItem = {
  qrToken: string;
  attempts: number;
  nextRetryAt: number;
};

export default function GateScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScanByToken = useRef<Map<string, number>>(new Map());
  const retryQueueRef = useRef<RetryItem[]>([]);
  const retryTimerRef = useRef<number | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');
  const [cameraSupported, setCameraSupported] = useState(true);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      setError('Camera access is not available in this browser or context (HTTPS required). Use manual entry instead.');
    }
  }, []);

  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busService.list({ limit: 200 }),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices', { params: { limit: 200 } }).then(r => r.data?.data || r.data?.data?.data || []),
  });

  const buses = busesData?.data ?? [];
  const devices = Array.isArray(devicesData) ? devicesData : [];

  const processRetryQueue = useCallback(() => {
    const now = Date.now();
    const pending = retryQueueRef.current.filter(item => item.nextRetryAt <= now);
    retryQueueRef.current = retryQueueRef.current.filter(item => item.nextRetryAt > now);

    for (const item of pending) {
      submitScan(item.qrToken).catch(() => {});
    }

    if (retryQueueRef.current.length > 0) {
      retryTimerRef.current = window.setTimeout(processRetryQueue, 500);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraSupported(false);
        setError('Camera access is not available in this browser or context (HTTPS required). Use manual entry instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings or use manual entry.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera hardware found. Use manual entry instead.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown'}. Use manual entry.`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const decodeQR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !selectedBusId) return;
    if (scannerPaused) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        const now = Date.now();
        const lastScan = lastScanByToken.current.get(code.data) || 0;
        if (now - lastScan < DEBOUNCE_MS) return;

        lastScanByToken.current.set(code.data, now);
        await submitScan(code.data);
      }
    } catch {
      // jsQR not installed or error
    }
  }, [selectedBusId, scannerPaused]);

  useEffect(() => {
    if (cameraActive && selectedBusId) {
      scanIntervalRef.current = window.setInterval(decodeQR, 500);
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraActive, selectedBusId, decodeQR]);

  useEffect(() => {
    return () => { stopCamera(); if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, [stopCamera]);

  const submitScan = async (qrToken: string, isRetry = false): Promise<void> => {
    try {
      setError('');
      const deviceId = selectedDeviceId || 'unknown';
      const { data } = await api.post('/hardware/qr-scan', {
        deviceId,
        busId: selectedBusId,
        qrToken,
        capturedAt: new Date().toISOString(),
      });
      setScanResult({ success: true, ...data });
      setShowResult(true);
      setScannerPaused(true);
      setTimeout(() => { setShowResult(false); setScanResult(null); setScannerPaused(false); }, 3000);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Scan failed';

      if (!status || status >= 500 || err.code === 'ERR_NETWORK') {
        const existing = retryQueueRef.current.find(r => r.qrToken === qrToken);
        if (!existing) {
          retryQueueRef.current.push({ qrToken, attempts: 1, nextRetryAt: Date.now() + RETRY_BACKOFF_MS });
          if (!retryTimerRef.current) {
            retryTimerRef.current = window.setTimeout(processRetryQueue, RETRY_BACKOFF_MS);
          }
          setScanResult({ success: false, error: `${message} — queued for retry (1/${MAX_RETRIES})` });
          setShowResult(true);
          setScannerPaused(true);
          setTimeout(() => { setShowResult(false); setScanResult(null); setScannerPaused(false); }, 3000);
          return;
        } else if (existing.attempts < MAX_RETRIES) {
          existing.attempts++;
          existing.nextRetryAt = Date.now() + RETRY_BACKOFF_MS * Math.pow(2, existing.attempts - 1);
          if (!retryTimerRef.current) {
            retryTimerRef.current = window.setTimeout(processRetryQueue, RETRY_BACKOFF_MS * Math.pow(2, existing.attempts - 1));
          }
          return;
        }
        retryQueueRef.current = retryQueueRef.current.filter(r => r.qrToken !== qrToken);
      }

      setScanResult({ success: false, error: message });
      setShowResult(true);
      setScannerPaused(true);
      setTimeout(() => { setShowResult(false); setScanResult(null); setScannerPaused(false); }, 3000);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualToken.trim()) return;
    await submitScan(manualToken.trim());
    setManualToken('');
    setManualEntryOpen(false);
  };

  const isMorningScantype = scanResult?.scanType === 'BOARD_IN';

  return (
    <Box>
      <PageHeader
        title="Gate Scanner"
        subtitle="Scan student QR codes at the bus gate"
      />

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {!cameraSupported && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Camera not available in this context. Use <strong>Manual Entry</strong> below to scan QR codes by pasting tokens.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Bus / Gate"
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select a bus...</MenuItem>
              {buses.map((bus: any) => (
                <MenuItem key={bus.id} value={bus.id}>
                  {bus.busNumber} - {bus.plateNumber}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Scanner Device"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select a device...</MenuItem>
              {devices.map((dev: any) => (
                <MenuItem key={dev.id} value={dev.id}>
                  {dev.name} ({dev.type})
                </MenuItem>
              ))}
            </TextField>

            {!cameraActive ? (
              <Button
                variant="contained"
                onClick={startCamera}
                disabled={!selectedBusId || !cameraSupported}
                startIcon={<QrCodeScanner />}
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={stopCamera}
                startIcon={<Close />}
              >
                Stop Camera
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={() => setManualEntryOpen(true)}
              startIcon={<PersonSearch />}
            >
              Manual Entry
            </Button>
          </Box>

          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 640,
              height: 480,
              bgcolor: 'grey.900',
              borderRadius: 2,
              overflow: 'hidden',
              mx: 'auto',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }}
            />
            {!cameraActive && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                <Typography color="grey.500">
                  {!cameraSupported
                    ? 'Camera unavailable — use Manual Entry'
                    : selectedBusId
                    ? 'Click "Start Camera" to begin scanning'
                    : 'Select a bus and start the camera'}
                </Typography>
                {!cameraSupported && (
                  <Button variant="outlined" size="small" onClick={() => setManualEntryOpen(true)} startIcon={<PersonSearch />}>
                    Open Manual Entry
                  </Button>
                )}
              </Box>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={showResult} onClose={() => { setShowResult(false); setScanResult(null); setScannerPaused(false); }} maxWidth="sm">
        <DialogContent sx={{ textAlign: 'center', py: 4, px: 4 }}>
          {scanResult?.success ? (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Chip
                label={scanResult.scanType === 'BOARD_IN' ? 'BOARDING' : 'EXITING'}
                color={isMorningScantype ? 'primary' : 'warning'}
                sx={{ mb: 2, fontWeight: 700 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {scanResult.student?.firstName} {scanResult.student?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Grade {scanResult.student?.grade} · {scanResult.student?.studentId}
              </Typography>
              <Typography variant="body1" color="success.main" sx={{ fontWeight: 600 }}>
                {scanResult.message}
              </Typography>
            </>
          ) : scanResult ? (
            <>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
                Scan Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {scanResult.error}
              </Typography>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Manual QR Entry
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the student's QR code token manually if the camera cannot read it.
          </Typography>
          <TextField
            fullWidth
            label="QR Token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste QR token here..."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setManualEntryOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleManualSubmit} disabled={!manualToken.trim()}>
              Submit
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
