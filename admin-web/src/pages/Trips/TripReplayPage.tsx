import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Slider, IconButton, Chip,
  Button, Alert, Skeleton, Grid, Stack, Avatar,
} from '@mui/material';
import {
  PlayArrow, Pause, Stop, Replay, Speed, Timeline, MyLocation,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../../components/common/PageHeader';
import { tripService } from '../../services/trips';

function createBusIcon(rotation: number): L.DivIcon {
  return L.divIcon({
    className: 'replay-bus',
    html: `<div style="
      transform: rotate(${rotation}deg);
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: #2563eb; border-radius: 8px;
      border: 3px solid white;
      box-shadow: 0 2px 12px rgba(37,99,235,0.5);
      transition: transform 0.15s ease;
    "><svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg></div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function createEventIcon(type: string): L.DivIcon {
  const isBoard = type === 'BOARD_IN';
  return L.divIcon({
    className: 'event-marker',
    html: `<div style="
      width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
      background: ${isBoard ? '#16a34a' : '#d97706'};
      border-radius: 50%; border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      color: white; font-size: 10px; font-weight: 700;
    ">${isBoard ? 'B' : 'E'}</div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

function createStopIcon(isSchool: boolean): L.DivIcon {
  return L.divIcon({
    className: 'stop-marker',
    html: `<div style="
      width: ${isSchool ? 32 : 24}px; height: ${isSchool ? 32 : 24}px;
      display: flex; align-items: center; justify-content: center;
      background: ${isSchool ? '#7c3aed' : '#64748b'};
      border-radius: ${isSchool ? '50%' : '4px'};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    "><svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <path d="${isSchool ? 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z' : 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'}"/>
    </svg></div>`,
    iconSize: [isSchool ? 32 : 24, isSchool ? 32 : 24],
    iconAnchor: [isSchool ? 16 : 12, isSchool ? 16 : 12],
  });
}

function MapBounds({ waypoints, stops }: { waypoints: [number, number][]; stops: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const all: L.LatLngTuple[] = [...waypoints, ...stops];
    if (all.length > 0) {
      const bounds = L.latLngBounds(all);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, waypoints, stops]);
  return null;
}

interface ReplayWaypoint {
  id: string; latitude: number; longitude: number; speed: number | null;
  heading: number | null; occupancy: number | null; timestamp: string;
}

interface ReplayEvent {
  id: string; scanType: string; latitude: number | null; longitude: number | null;
  createdAt: string; student?: { firstName: string; lastName: string; grade: string; profilePicture?: string };
}

export default function TripReplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentWaypoint, setCurrentWaypoint] = useState<ReplayWaypoint | null>(null);
  const [visibleEvents, setVisibleEvents] = useState<ReplayEvent[]>([]);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trip-replay', id],
    queryFn: () => tripService.getReplay(id!),
    enabled: !!id,
  });

  const waypoints = useMemo(() => (data?.waypoints ?? []) as ReplayWaypoint[], [data]);
  const tripEvents = useMemo(() => (data?.tripEvents ?? []) as ReplayEvent[], [data]);
  const trip = data?.trip;
  const routeStops = trip?.route?.routeStops ?? [];

  const stopCoords = useMemo((): [number, number][] => {
    return routeStops
      .filter((rs: any) => rs.stop?.latitude && rs.stop?.longitude)
      .map((rs: any) => [rs.stop.latitude, rs.stop.longitude] as [number, number]);
  }, [routeStops]);

  const routeLine = useMemo((): [number, number][] => {
    return waypoints.map((w) => [w.latitude, w.longitude] as [number, number]);
  }, [waypoints]);

  const totalDuration = useMemo(() => {
    if (waypoints.length < 2) return 0;
    const first = new Date(waypoints[0].timestamp).getTime();
    const last = new Date(waypoints[waypoints.length - 1].timestamp).getTime();
    return last - first;
  }, [waypoints]);

  const getWaypointAt = useCallback((pct: number) => {
    if (waypoints.length === 0) return null;
    const idx = Math.min(Math.floor(pct * waypoints.length), waypoints.length - 1);
    return waypoints[idx];
  }, [waypoints]);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) * speed;
    const pct = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;
    progressRef.current = pct;
    setProgress(pct);

    const wp = getWaypointAt(pct);
    if (wp) setCurrentWaypoint(wp);

    const eventCutoff = pct * totalDuration;
    const activeEvents = tripEvents.filter((e) => {
      const t = new Date(e.createdAt).getTime() - new Date(waypoints[0]?.timestamp).getTime();
      return t <= eventCutoff;
    });
    setVisibleEvents(activeEvents);

    if (pct < 1) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      setPlaying(false);
    }
  }, [speed, totalDuration, waypoints, tripEvents, getWaypointAt]);

  useEffect(() => {
    if (playing) {
      startTimeRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, animate]);

  const handlePlayPause = () => {
    if (progress >= 1) {
      setProgress(0);
      setCurrentWaypoint(null);
      setVisibleEvents([]);
    }
    setPlaying(p => !p);
  };

  const handleStop = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentWaypoint(null);
    setVisibleEvents([]);
  };

  const handleRestart = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentWaypoint(null);
    setVisibleEvents([]);
    requestAnimationFrame(() => setPlaying(true));
  };

  const handleScrub = (_: Event, val: number | number[]) => {
    const pct = (val as number) / 100;
    setProgress(pct);
    const wp = getWaypointAt(pct);
    if (wp) setCurrentWaypoint(wp);

    const eventCutoff = pct * totalDuration;
    const activeEvents = tripEvents.filter((e) => {
      const t = new Date(e.createdAt).getTime() - new Date(waypoints[0]?.timestamp).getTime();
      return t <= eventCutoff;
    });
    setVisibleEvents(activeEvents);
  };

  const busPos = currentWaypoint ? [currentWaypoint.latitude, currentWaypoint.longitude] as [number, number] : null;
  const busHeading = currentWaypoint?.heading ?? 0;

  if (error) {
    return (
      <Box>
        <PageHeader title="Trip Replay" showBack backTo="/trips" />
        <Alert severity="error">Failed to load replay data</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Trip Replay" showBack backTo="/trips" />
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!data || waypoints.length === 0) {
    return (
      <Box>
        <PageHeader title="Trip Replay" showBack backTo="/trips" />
        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No replay data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This trip has no recorded GPS waypoints. Run the simulator to generate trip data with waypoints.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/trips')}>
            Back to Trips
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Trip Replay"
        subtitle={`${trip?.route?.name || 'Unknown Route'} · ${trip?.bus?.plateNumber || trip?.bus?.busNumber || ''}`}
        showBack backTo="/trips"
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ height: 500, width: '100%', position: 'relative' }}>
              {busPos ? (
                <MapContainer center={busPos} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapBounds waypoints={routeLine} stops={stopCoords} />
                  {routeLine.length > 1 && (
                    <Polyline positions={routeLine} color="#2563eb" weight={3} opacity={0.5} dashArray="8 8" />
                  )}
                  {stopCoords.map((pos: [number, number], i: number) => (
                    <Marker key={i} position={pos} icon={createStopIcon(i === stopCoords.length - 1)}>
                      <Popup>{routeStops[i]?.stop?.name || `Stop ${i + 1}`}</Popup>
                    </Marker>
                  ))}
                  {tripEvents.filter(e => e.latitude && e.longitude).map((ev) => (
                    <Marker key={ev.id} position={[ev.latitude!, ev.longitude!]} icon={createEventIcon(ev.scanType)}>
                      <Popup>
                        <Typography variant="body2" fontWeight={600}>
                          {ev.scanType === 'BOARD_IN' ? 'Boarded' : 'Exited'}: {ev.student?.firstName} {ev.student?.lastName}
                        </Typography>
                        <Typography variant="caption">{new Date(ev.createdAt).toLocaleString()}</Typography>
                      </Popup>
                    </Marker>
                  ))}
                  <Marker position={busPos} icon={createBusIcon(busHeading)}>
                    <Popup>
                      <Typography variant="body2" fontWeight={600}>Bus Location</Typography>
                      <Typography variant="caption">
                        Speed: {Math.round(currentWaypoint?.speed ?? 0)} km/h<br />
                        Occupancy: {currentWaypoint?.occupancy ?? '?'}
                      </Typography>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                  <Typography color="text.secondary">Press play to start replay</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  <Timeline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Trip Stats
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Waypoints</Typography>
                    <Typography variant="caption" fontWeight={600}>{waypoints.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Events</Typography>
                    <Typography variant="caption" fontWeight={600}>{tripEvents.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {totalDuration > 0 ? `${Math.round(totalDuration / 1000)}s` : '-'}
                    </Typography>
                  </Box>
                  {currentWaypoint && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Speed</Typography>
                        <Typography variant="caption" fontWeight={600}>{Math.round(currentWaypoint.speed ?? 0)} km/h</Typography>
                      </Box>
                      {currentWaypoint.occupancy != null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Occupancy</Typography>
                          <Typography variant="caption" fontWeight={600}>{currentWaypoint.occupancy}</Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  <MyLocation sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Events ({visibleEvents.length})
                </Typography>
                <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                  {visibleEvents.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No events yet</Typography>
                  ) : (
                    <Stack spacing={0.75}>
                      {visibleEvents.map((ev) => (
                        <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'grey.50' }}>
                          <Avatar sx={{ width: 22, height: 22, bgcolor: ev.scanType === 'BOARD_IN' ? '#16a34a' : '#d97706', fontSize: '0.6rem', fontWeight: 700 }}>
                            {ev.scanType === 'BOARD_IN' ? 'B' : 'E'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" fontWeight={600}>
                              {ev.student?.firstName} {ev.student?.lastName}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {new Date(ev.createdAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                          <Chip label={ev.scanType === 'BOARD_IN' ? 'Board' : 'Exit'} size="small" color={ev.scanType === 'BOARD_IN' ? 'success' : 'warning'} variant="outlined" sx={{ height: 18, fontSize: '0.55rem' }} />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <IconButton onClick={handlePlayPause} color="primary" size="small">
                  {playing ? <Pause /> : progress >= 1 ? <Replay /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={handleStop} size="small" disabled={progress === 0}>
                  <Stop />
                </IconButton>
                <IconButton onClick={handleRestart} size="small" disabled={waypoints.length === 0}>
                  <Replay />
                </IconButton>
                <Box sx={{ flex: 1, mx: 1 }}>
                  <Slider
                    size="small"
                    value={progress * 100}
                    onChange={handleScrub}
                    sx={{ py: 0 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                  {[0.5, 1, 2, 5].map((s) => (
                    <Chip
                      key={s}
                      label={`${s}x`}
                      size="small"
                      variant={speed === s ? 'filled' : 'outlined'}
                      color={speed === s ? 'primary' : 'default'}
                      onClick={() => setSpeed(s)}
                      sx={{ height: 24, fontSize: '0.65rem', cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
}
