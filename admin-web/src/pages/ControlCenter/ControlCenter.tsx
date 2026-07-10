import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, IconButton, ToggleButtonGroup,
  ToggleButton, Drawer, Stack, Divider, LinearProgress, Avatar, Grid, Tooltip,
} from '@mui/material';
import {
  DirectionsBus, Speed, SignalWifiStatusbar4Bar, BatteryStd, AccessTime,
  MyLocation, Person, Route, School, Close, Layers, DarkMode, LightMode,
  Terrain, Satellite, Warning, NotificationsActive,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socketService, type BusLocation, type IncidentAlert } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

type MapStyle = 'street' | 'dark' | 'satellite';

const MAP_STYLES: Record<MapStyle, { url: string; label: string; icon: React.ReactNode }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'Street',
    icon: <Terrain sx={{ fontSize: 16 }} />,
  },
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    label: 'Dark',
    icon: <DarkMode sx={{ fontSize: 16 }} />,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    label: 'Satellite',
    icon: <Satellite sx={{ fontSize: 16 }} />,
  },
};

const SCHOOL_POSITION: [number, number] = [27.6855, 85.3245];

function createBusIcon(heading: number, isSelected: boolean, occupancyPct: number, hasIncident: boolean): L.DivIcon {
  const baseColor = hasIncident ? '#ef4444' : occupancyPct >= 80 ? '#ef4444' : occupancyPct >= 50 ? '#f59e0b' : '#10b981';
  const pulseAnim = hasIncident ? 'animation: incident-pulse 1s ease-in-out infinite;' : '';
  const borderColor = hasIncident ? '#dc2626' : 'white';
  return L.divIcon({
    className: 'cc-bus-marker',
    html: `<div style="
      transform: rotate(${heading}deg);
      width: ${isSelected ? 44 : 34}px;
      height: ${isSelected ? 44 : 34}px;
      display: flex; align-items: center; justify-content: center;
      background: ${baseColor};
      border-radius: 8px; border: 3px solid ${borderColor};
      box-shadow: ${hasIncident ? '0 0 20px rgba(239,68,68,0.8)' : '0 2px 12px rgba(0,0,0,0.4)'};
      transition: all 0.3s ease;
      ${pulseAnim}
    "><svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg></div>
    <style>
      @keyframes incident-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.8); }
        50% { box-shadow: 0 0 40px rgba(239,68,68,1); }
      }
    </style>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -22],
  });
}

function createSchoolIcon(): L.DivIcon {
  return L.divIcon({
    className: 'cc-school-marker',
    html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#7c3aed;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.4);animation:pulse 2s infinite;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
    </div>
    <style>@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); } 50% { box-shadow: 0 0 0 12px rgba(124,58,237,0); } }</style>`,
    iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26],
  });
}

function MapUpdater({ buses, selectedBusId }: { buses: BusLocation[]; selectedBusId: string | null }) {
  const map = useMap();
  const prevBusesRef = useRef<Map<string, [number, number]>>(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (buses.length > 0 && !initializedRef.current) {
      const bounds = L.latLngBounds(buses.map(b => [b.lat, b.lng] as [number, number]));
      bounds.extend(SCHOOL_POSITION);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      initializedRef.current = true;
    }
  }, [buses, map]);

  useEffect(() => {
    buses.forEach(bus => {
      const prev = prevBusesRef.current.get(bus.busId);
      if (prev) {
        const [prevLat, prevLng] = prev;
        const latDiff = bus.lat - prevLat;
        const lngDiff = bus.lng - prevLng;
        if (Math.abs(latDiff) > 0.00001 || Math.abs(lngDiff) > 0.00001) {
          map.panTo([bus.lat, bus.lng], { animate: true, duration: 0.8 });
        }
      }
      prevBusesRef.current.set(bus.busId, [bus.lat, bus.lng]);
    });
  }, [buses, map]);

  useEffect(() => {
    if (selectedBusId) {
      const bus = buses.find(b => b.busId === selectedBusId);
      if (bus) map.panTo([bus.lat, bus.lng], { animate: true, duration: 0.5 });
    }
  }, [selectedBusId, buses, map]);

  return null;
}

export default function ControlCenter() {
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeIncidents, setActiveIncidents] = useState<IncidentAlert[]>([]);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const unsubLocation = socketService.onBusLocation((location) => {
      setBuses(prev => {
        const existing = prev.findIndex(b => b.busId === location.busId);
        const updated = existing >= 0
          ? prev.map((b, i) => i === existing ? location : b)
          : [...prev, location];
        return updated;
      });
      setLoading(false);
    });

    const unsubAllBuses = socketService.onAllBuses((allBuses) => {
      setBuses(allBuses);
      setLoading(false);
    });

    const unsubIncidentAlert = socketService.onIncidentAlert((alert) => {
      setActiveIncidents(prev => {
        if (prev.some(i => i.id === alert.id)) return prev;
        return [...prev, alert];
      });
    });

    const unsubIncidentResolved = socketService.onIncidentResolved((data) => {
      setActiveIncidents(prev => prev.filter(i => i.id !== data.id));
    });

    socketService.requestAllBuses();
    const interval = setInterval(() => socketService.requestAllBuses(), 15000);

    return () => { unsubLocation(); unsubAllBuses(); unsubIncidentAlert(); unsubIncidentResolved(); clearInterval(interval); };
  }, []);

  useEffect(() => {
    setSelectedBus(prev => {
      if (!prev) return null;
      const updated = buses.find(b => b.busId === prev.busId);
      return updated || prev;
    });
  }, [buses]);

  const handleBusClick = useCallback((bus: BusLocation) => {
    setSelectedBus(bus);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedBus(null);
  }, []);

  const activeBuses = buses.filter(b => b.tripStatus === 'ACTIVE' || b.tripStatus === 'DRIVING_TO_PICKUP' || b.tripStatus === 'DRIVING_TO_SCHOOL');
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
  const totalOccupancy = buses.reduce((sum, b) => sum + b.occupancy, 0);
  const avgSpeed = buses.length > 0 ? Math.round(buses.reduce((sum, b) => sum + b.speed, 0) / buses.length) : 0;

  const occupancyPct = (bus: BusLocation) => bus.capacity > 0 ? Math.round((bus.occupancy / bus.capacity) * 100) : 0;

  const currentTileUrl = MAP_STYLES[mapStyle].url;

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Top stats bar */}
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DirectionsBus sx={{ color: 'primary.main', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Fleet Status</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {activeBuses.length}/{buses.length} active
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Person sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption">{totalOccupancy}/{totalCapacity} onboard</Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Speed sx={{ color: 'info.main', fontSize: 16 }} />
              <Typography variant="caption">Avg {avgSpeed} km/h</Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BatteryStd sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption">
                {buses.filter(b => b.batteryLevel != null && b.batteryLevel < 20).length > 0
                  ? `${buses.filter(b => b.batteryLevel != null && b.batteryLevel < 20).length} low`
                  : 'Battery OK'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <SignalWifiStatusbar4Bar sx={{ color: 'success.main', fontSize: 16 }} />
              <Typography variant="caption">
                {buses.filter(b => b.scannerStatus === 'ONLINE').length}/{buses.length} online
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
              <ToggleButtonGroup
                value={mapStyle}
                exclusive
                onChange={(_, v) => v && setMapStyle(v)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.25, fontSize: '0.7rem' } }}
              >
                {Object.entries(MAP_STYLES).map(([key, style]) => (
                  <ToggleButton key={key} value={key}>
                    {style.icon} <Box sx={{ ml: 0.5 }}>{style.label}</Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Emergency banner */}
      {activeIncidents.length > 0 && (
        <Box sx={{
          px: 2, py: 1, bgcolor: '#fef2f2', borderBottom: '2px solid #ef4444',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <NotificationsActive sx={{ color: '#ef4444', animation: 'pulse-bell 1.5s ease-in-out infinite' }} />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700} color="#dc2626">
              {activeIncidents.length} Active Incident{activeIncidents.length > 1 ? 's' : ''}
            </Typography>
            {activeIncidents.map(inc => (
              <Chip
                key={inc.id}
                label={`${inc.busNumber ? inc.busNumber + ': ' : ''}${inc.title}`}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="#991b1b">
            Check incident details
          </Typography>
          <style>{`@keyframes pulse-bell { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </Box>
      )}

      {/* Map area */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer
          center={SCHOOL_POSITION}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={currentTileUrl}
          />
          <Marker position={SCHOOL_POSITION} icon={createSchoolIcon()}>
            <Popup><Typography variant="subtitle2" fontWeight={700}>SafeRide School</Typography></Popup>
          </Marker>
          <MapUpdater buses={buses} selectedBusId={selectedBus?.busId ?? null} />
          {buses.map((bus) => (
            <Marker
              key={bus.busId}
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(bus.heading, selectedBus?.busId === bus.busId, occupancyPct(bus), activeIncidents.some(i => i.busId === bus.busId))}
              eventHandlers={{ click: () => handleBusClick(bus) }}
            >
              <Popup>
                <Box sx={{ minWidth: 200, cursor: 'pointer' }} onClick={() => handleBusClick(bus)}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{bus.routeName}</Typography>
                  <Stack spacing={0.5} sx={{ fontSize: '0.8rem' }}>
                    <Typography variant="caption">Driver: {bus.driverName}</Typography>
                    <Typography variant="caption">Speed: {bus.speed.toFixed(1)} km/h</Typography>
                    <Typography variant="caption">Next: {bus.nextStopName}</Typography>
                    <Typography variant="caption">ETA: {bus.eta}</Typography>
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography variant="caption" fontWeight={600}>{bus.occupancy}/{bus.capacity}</Typography>
                      <Typography variant="caption" fontWeight={600}>{occupancyPct(bus)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={occupancyPct(bus)} color={occupancyPct(bus) >= 80 ? 'error' : occupancyPct(bus) >= 50 ? 'warning' : 'success'} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${bus.speed.toFixed(0)} km/h`} size="small" variant="outlined" />
                    <Chip label={bus.tripStatus} size="small" color={bus.tripStatus === 'ACTIVE' ? 'success' : 'default'} />
                  </Box>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating bus list overlay */}
        <Card sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: 240, maxHeight: 'calc(100% - 120px)', borderRadius: 2, overflow: 'auto' }} elevation={4}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block', px: 0.5 }}>
              Active Buses ({activeBuses.length})
            </Typography>
            <Stack spacing={0.5}>
              {buses.length === 0 && !loading && (
                <Typography variant="caption" color="text.secondary" sx={{ p: 1, textAlign: 'center' }}>
                  No buses active
                </Typography>
              )}
              {buses.map(bus => {
                const isActive = bus.tripStatus === 'ACTIVE' || bus.tripStatus === 'DRIVING_TO_PICKUP' || bus.tripStatus === 'DRIVING_TO_SCHOOL';
                const pct = occupancyPct(bus);
                return (
                  <Box
                    key={bus.busId}
                    onClick={() => handleBusClick(bus)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1.5,
                      cursor: 'pointer', transition: 'all 0.15s',
                      bgcolor: selectedBus?.busId === bus.busId ? 'action.selected' : 'transparent',
                      opacity: isActive ? 1 : 0.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      bgcolor: pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22c55e',
                      boxShadow: isActive ? `0 0 6px ${pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22c55e'}` : 'none',
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" noWrap fontWeight={600}>{bus.routeName || bus.busId.slice(0, 8)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                        {bus.speed.toFixed(0)} km/h · {bus.occupancy}/{bus.capacity}
                        {bus.batteryLevel != null && ` · ${bus.batteryLevel.toFixed(0)}%`}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {bus.batteryLevel != null && (
                        <Box sx={{
                          width: 6, height: 6, borderRadius: '50%',
                          bgcolor: bus.batteryLevel < 20 ? '#ef4444' : bus.batteryLevel < 50 ? '#f59e0b' : '#22c55e',
                        }} />
                      )}
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                        {bus.eta?.slice(0, 5) || '--:--'}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Bus detail drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        slotProps={{ backdrop: { invisible: true } }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 380,
            p: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {selectedBus && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedBus.routeName}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedBus.busId}</Typography>
              </Box>
              <IconButton onClick={handleCloseDrawer} size="small"><Close /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
              {/* Quick stats */}
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Speed sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                    <Typography variant="h6" fontWeight={700}>{Math.round(selectedBus.speed)}</Typography>
                    <Typography variant="caption" color="text.secondary">km/h</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <AccessTime sx={{ fontSize: 20, color: 'warning.main', mb: 0.5 }} />
                    <Typography variant="h6" fontWeight={700}>{selectedBus.eta?.slice(0, 5) || '--:--'}</Typography>
                    <Typography variant="caption" color="text.secondary">ETA</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Person sx={{ fontSize: 20, color: 'success.main', mb: 0.5 }} />
                    <Typography variant="h6" fontWeight={700}>{selectedBus.occupancy}</Typography>
                    <Typography variant="caption" color="text.secondary">onboard</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Occupancy */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Occupancy</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{selectedBus.occupancy}/{selectedBus.capacity}</Typography>
                  <Typography variant="body2" fontWeight={700}>{occupancyPct(selectedBus)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={occupancyPct(selectedBus)}
                  color={occupancyPct(selectedBus) >= 80 ? 'error' : occupancyPct(selectedBus) >= 50 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Route progress */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Route Progress</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{selectedBus.completedStops}/{selectedBus.totalStops} stops</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedBus.totalStops > 0 ? Math.round((selectedBus.completedStops / selectedBus.totalStops) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedBus.totalStops > 0 ? (selectedBus.completedStops / selectedBus.totalStops) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Details */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Trip Details</Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Driver</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedBus.driverName}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Route sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Route</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedBus.routeName}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MyLocation sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Next Stop</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedBus.nextStopName}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedBus.nextStopDistance > 1000 ? `${(selectedBus.nextStopDistance / 1000).toFixed(1)} km` : `${selectedBus.nextStopDistance} m`}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={selectedBus.tripStatus} size="small" color={selectedBus.tripStatus === 'ACTIVE' ? 'success' : 'default'} sx={{ mt: 0.25 }} />
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Device Health — live from telemetry */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Device Health</Typography>
              <Grid container spacing={1}>
                {[
                  {
                    label: 'Battery',
                    value: selectedBus.batteryLevel != null ? `${selectedBus.batteryLevel.toFixed(0)}%` : '--',
                    color: selectedBus.batteryLevel != null ? (selectedBus.batteryLevel < 20 ? 'error.main' : selectedBus.batteryLevel < 50 ? 'warning.main' : 'success.main') : 'text.secondary',
                    icon: <BatteryStd sx={{ fontSize: 16 }} />,
                  },
                  {
                    label: 'Scanner',
                    value: selectedBus.scannerStatus || '--',
                    color: selectedBus.scannerStatus === 'ONLINE' ? 'success.main' : selectedBus.scannerStatus === 'ERROR' ? 'error.main' : 'text.secondary',
                    icon: <DirectionsBus sx={{ fontSize: 16 }} />,
                  },
                  {
                    label: 'GPS Accuracy',
                    value: selectedBus.gpsAccuracy != null ? `${selectedBus.gpsAccuracy.toFixed(0)}m` : '--',
                    color: selectedBus.gpsAccuracy != null ? (selectedBus.gpsAccuracy > 50 ? 'warning.main' : 'success.main') : 'text.secondary',
                    icon: <MyLocation sx={{ fontSize: 16 }} />,
                  },
                  {
                    label: 'Last Heartbeat',
                    value: selectedBus.lastHeartbeatAt ? new Date(selectedBus.lastHeartbeatAt).toLocaleTimeString() : '--',
                    color: selectedBus.lastHeartbeatAt && Date.now() - new Date(selectedBus.lastHeartbeatAt).getTime() < 300000 ? 'success.main' : 'warning.main',
                    icon: <SignalWifiStatusbar4Bar sx={{ fontSize: 16 }} />,
                  },
                  {
                    label: 'Firmware',
                    value: selectedBus.firmwareVersion || '--',
                    color: 'text.secondary',
                    icon: <Speed sx={{ fontSize: 16 }} />,
                  },
                  {
                    label: 'Last QR Scan',
                    value: selectedBus.lastQrScanAt ? new Date(selectedBus.lastQrScanAt).toLocaleTimeString() : '--',
                    color: 'text.secondary',
                    icon: <AccessTime sx={{ fontSize: 16 }} />,
                  },
                ].map((item) => (
                  <Grid item xs={6} key={item.label}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                      <Box sx={{ color: item.color }}>{item.icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>{item.value}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
