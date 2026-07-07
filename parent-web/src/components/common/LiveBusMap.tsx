import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

interface BusLocationData {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  tripId: string;
  driverName: string;
  routeName: string;
  occupancy: number;
  capacity: number;
  eta: string;
  nextStopName: string;
  nextStopDistance: number;
  remainingDistance: number;
  stopSequence: number;
  totalStops: number;
  completedStops: number;
  tripStatus: string;
  lastUpdate: string;
}

interface LiveBusMapProps {
  busLocation?: BusLocationData;
  routePath?: [number, number][];
  homePosition?: [number, number];
  schoolPosition?: [number, number];
  studentName?: string;
}

function busIcon(heading: number): L.DivIcon {
  return L.divIcon({
    className: 'bus-marker',
    html: `<div style="
      transform: rotate(${heading}deg);
      width: 36px; height: 36px;
      background: #2563EB; border: 3px solid white;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.3s ease;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
      </svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20],
  });
}

const homeIcon = L.divIcon({
  className: 'home-marker',
  html: `<div style="width:28px;height:28px;background:#22c55e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  </div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const schoolIcon = L.divIcon({
  className: 'school-marker',
  html: `<div style="width:32px;height:32px;background:#7c3aed;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
  </div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

function AnimatedBusMarker({ position, heading }: { position: [number, number]; heading: number }) {
  const markerRef = useRef<L.Marker>(null);
  const currentPos = useRef(position);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const [targetLat, targetLng] = position;
    const [currentLat, currentLng] = currentPos.current;

    const steps = 30;
    const latStep = (targetLat - currentLat) / steps;
    const lngStep = (targetLng - currentLng) / steps;
    let step = 0;

    const animate = () => {
      if (step >= steps) {
        marker.setLatLng([targetLat, targetLng]);
        currentPos.current = [targetLat, targetLng];
        return;
      }
      step++;
      const newLat = currentLat + latStep * step;
      const newLng = currentLng + lngStep * step;
      marker.setLatLng([newLat, newLng]);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [position]);

  return <Marker ref={markerRef} position={position} icon={busIcon(heading)} />;
}

function LocationInfo({ bus }: { bus: BusLocationData }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, fontSize: '0.85rem' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Current Speed</Typography>
        <Typography variant="body2" fontWeight={600}>{bus.speed.toFixed(0)} km/h</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Next Stop</Typography>
        <Typography variant="body2" fontWeight={600}>{bus.nextStopName}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Distance</Typography>
        <Typography variant="body2" fontWeight={600}>
          {bus.nextStopDistance > 0 ? `${bus.nextStopDistance} m` : 'Arriving'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Remaining</Typography>
        <Typography variant="body2" fontWeight={600}>
          {bus.remainingDistance > 1000 ? `${(bus.remainingDistance / 1000).toFixed(1)} km` : `${bus.remainingDistance} m`}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Expected Arrival</Typography>
        <Typography variant="body2" fontWeight={600} color="primary">{bus.eta}</Typography>
      </Box>
      <Box sx={{ mt: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" fontWeight={600}>Occupancy</Typography>
          <Typography variant="caption">{bus.occupancy}/{bus.capacity}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={bus.capacity > 0 ? (bus.occupancy / bus.capacity) * 100 : 0}
          color={bus.occupancy >= bus.capacity * 0.8 ? 'error' : bus.occupancy >= bus.capacity * 0.5 ? 'warning' : 'success'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      {bus.totalStops > 0 && (
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" fontWeight={600}>Route Progress</Typography>
            <Typography variant="caption">{bus.completedStops}/{bus.totalStops} stops</Typography>
          </Box>
          <LinearProgress variant="determinate" value={(bus.completedStops / bus.totalStops) * 100} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      )}
    </Box>
  );
}

export default function LiveBusMap({ busLocation, routePath, homePosition, schoolPosition, studentName }: LiveBusMapProps) {
  const defaultCenter: [number, number] = [27.6855, 85.3245];

  return (
    <Box sx={{ height: '100%', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {schoolPosition && (
          <Marker position={schoolPosition} icon={schoolIcon}>
            <Popup><Typography variant="subtitle2" fontWeight={600}>SafeRide School</Typography></Popup>
          </Marker>
        )}

        {homePosition && (
          <Marker position={homePosition} icon={homeIcon}>
            <Popup>
              <Typography variant="subtitle2" fontWeight={600}>{studentName || 'Home'}</Typography>
              <Typography variant="caption">Pickup/Drop Location</Typography>
            </Popup>
          </Marker>
        )}

        {routePath && routePath.length > 1 && (
          <Polyline positions={routePath} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.6, dashArray: '10, 10' }} />
        )}

        {busLocation && (
          <AnimatedBusMarker position={[busLocation.lat, busLocation.lng]} heading={busLocation.heading} />
        )}
      </MapContainer>
    </Box>
  );
}

export type { BusLocationData };
export { LocationInfo };
