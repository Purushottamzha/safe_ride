import { useEffect, useState, useRef } from 'react';
import { Box, Paper, Typography, Chip, CircularProgress, LinearProgress, Stack } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socketService } from '../../services/socket';
import type { BusLocation } from '../../services/socket';

interface LiveBusMapProps {
  height?: number | string;
  showControls?: boolean;
}

function createBusIcon(heading: number, isSelected: boolean): L.DivIcon {
  return L.divIcon({
    className: 'bus-marker',
    html: `<div style="
      transform: rotate(${heading}deg);
      width: ${isSelected ? 40 : 32}px;
      height: ${isSelected ? 40 : 32}px;
      display: flex; align-items: center; justify-content: center;
      background: ${isSelected ? '#2563eb' : '#10b981'};
      border-radius: 8px; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    "><svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg></div>`,
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20],
  });
}

function createSchoolIcon(): L.DivIcon {
  return L.divIcon({
    className: 'school-marker',
    html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#7c3aed;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
  });
}

function OccupancyBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const color = pct >= 80 ? 'error' : pct >= 50 ? 'warning' : 'success';
  return (
    <Box sx={{ width: '100%', mt: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" fontWeight={600}>{current}/{max}</Typography>
        <Typography variant="caption" color={`${color}.main`}>{pct}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

function RouteProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" fontWeight={500}>Route Progress</Typography>
        <Typography variant="caption">{completed}/{total} stops</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color="primary" sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

const MapUpdater = ({ buses }: { buses: BusLocation[] }) => {
  const map = useMap();
  const prevBuses = useRef<Map<string, [number, number]>>(new Map());

  useEffect(() => {
    if (buses.length === 0) return;
    const bounds = L.latLngBounds(buses.map(b => [b.lat, b.lng] as [number, number]));
    if (buses.length === 1) bounds.pad(0.01);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, []);

  useEffect(() => {
    buses.forEach(bus => {
      const prev = prevBuses.current.get(bus.busId);
      if (prev) {
        const [prevLat, prevLng] = prev;
        const latDiff = bus.lat - prevLat;
        const lngDiff = bus.lng - prevLng;
        if (Math.abs(latDiff) > 0.00005 || Math.abs(lngDiff) > 0.00005) {
          map.panTo([bus.lat, bus.lng], { animate: true, duration: 0.5 });
        }
      }
      prevBuses.current.set(bus.busId, [bus.lat, bus.lng]);
    });
  }, [buses, map]);

  return null;
};

export default function LiveBusMap({ height = 500, showControls = true }: LiveBusMapProps) {
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLocation = socketService.onBusLocation((location) => {
      setBuses(prev => {
        const existing = prev.findIndex(b => b.busId === location.busId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = location;
          return updated;
        }
        return [...prev, location];
      });
      setLoading(false);
    });

    const unsubAllBuses = socketService.onAllBuses((allBuses) => {
      setBuses(allBuses);
      setLoading(false);
    });

    socketService.requestAllBuses();
    const interval = setInterval(() => socketService.requestAllBuses(), 30000);

    return () => { unsubLocation(); unsubAllBuses(); clearInterval(interval); };
  }, []);

  const defaultCenter: [number, number] = [27.6855, 85.3245];

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={showControls}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[27.6855, 85.3245]} icon={createSchoolIcon()}>
          <Popup><Typography variant="subtitle2" fontWeight={600}>SafeRide School</Typography></Popup>
        </Marker>
        <MapUpdater buses={buses} />
        {buses.map((bus) => (
          <Marker key={bus.busId} position={[bus.lat, bus.lng]} icon={createBusIcon(bus.heading, selectedBusId === bus.busId)}>
            <Popup>
              <Box sx={{ minWidth: 220 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{bus.routeName}</Typography>
                <Stack spacing={0.5} sx={{ fontSize: '0.8rem' }}>
                  <Typography variant="caption">Driver: {bus.driverName}</Typography>
                  <Typography variant="caption">Speed: {bus.speed.toFixed(1)} km/h</Typography>
                  <Typography variant="caption">Next Stop: {bus.nextStopName} ({bus.nextStopDistance}m)</Typography>
                  <Typography variant="caption">Remaining: {bus.remainingDistance > 1000 ? `${(bus.remainingDistance / 1000).toFixed(1)} km` : `${bus.remainingDistance} m`}</Typography>
                  <Typography variant="caption">ETA: {bus.eta}</Typography>
                </Stack>
                <Box sx={{ mt: 1 }}>
                  <OccupancyBar current={bus.occupancy} max={bus.capacity} />
                </Box>
                {bus.totalStops > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <RouteProgress completed={bus.completedStops} total={bus.totalStops} />
                  </Box>
                )}
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip label={`${bus.speed.toFixed(0)} km/h`} size="small" variant="outlined" />
                  <Chip label={bus.tripStatus} size="small" color={bus.tripStatus === 'ACTIVE' || bus.tripStatus === 'DRIVING_TO_PICKUP' ? 'success' : 'default'} />
                  <Chip label={new Date(bus.lastUpdate).toLocaleTimeString()} size="small" variant="outlined" />
                </Box>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Paper sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, p: 1.5, borderRadius: 2, minWidth: 200 }} elevation={3}>
        <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block' }}>Active Buses: {buses.length}</Typography>
        {buses.map(bus => (
          <Box
            key={bus.busId}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, cursor: 'pointer', opacity: selectedBusId && selectedBusId !== bus.busId ? 0.5 : 1, '&:hover': { opacity: 1 } }}
            onClick={() => setSelectedBusId(selectedBusId === bus.busId ? null : bus.busId)}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: bus.occupancy >= bus.capacity * 0.8 ? '#ef4444' : '#22c55e' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" noWrap fontWeight={500}>{bus.routeName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {bus.occupancy}/{bus.capacity} · {bus.nextStopName || 'En route'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
