import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';

export interface RouteStop {
  id: string;
  name: string;
  sequence: number;
  isCurrent?: boolean;
  isCompleted?: boolean;
  isSchool?: boolean;
  isHome?: boolean;
}

interface RouteProgressProps {
  stops: RouteStop[];
  direction?: 'TO_SCHOOL' | 'FROM_SCHOOL';
  compact?: boolean;
}

export default function RouteProgress({ stops, direction = 'TO_SCHOOL', compact = false }: RouteProgressProps) {
  const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <Box sx={{ py: compact ? 0 : 1 }}>
      {direction === 'FROM_SCHOOL' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, pl: compact ? 0 : 0.5 }}>
          <SchoolIcon sx={{ fontSize: compact ? 18 : 22, color: 'primary.main' }} />
          <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600} color="primary.main">
            School
          </Typography>
        </Box>
      )}

      {sortedStops.map((stop, idx) => (
        <Box key={stop.id} sx={{ display: 'flex', alignItems: 'stretch', gap: compact ? 1 : 1.5, minHeight: compact ? 32 : 40 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: compact ? 20 : 24 }}>
            {stop.isCompleted ? (
              <CheckCircleIcon sx={{ fontSize: compact ? 16 : 20, color: '#22c55e' }} />
            ) : stop.isCurrent ? (
              <Box sx={{ position: 'relative' }}>
                <RadioButtonCheckedIcon sx={{ fontSize: compact ? 16 : 20, color: '#2563eb', animation: 'pulse 2s infinite' }} />
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #2563eb', animation: 'ping 2s infinite', opacity: 0.4 }} />
              </Box>
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: compact ? 14 : 18, color: 'text.disabled' }} />
            )}
            {idx < sortedStops.length - 1 && (
              <Box sx={{
                flex: 1, width: 2, my: 0.5,
                bgcolor: stop.isCompleted ? '#22c55e' : 'divider',
                borderRadius: 1,
              }} />
            )}
          </Box>

          <Box sx={{
            flex: 1, pb: idx < sortedStops.length - 1 ? 1 : 0,
            opacity: stop.isCompleted ? 0.7 : stop.isCurrent ? 1 : stop.sequence > (stops.find(s => s.isCurrent)?.sequence ?? 0) ? 0.6 : 0.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant={compact ? 'caption' : 'body2'}
                fontWeight={stop.isCurrent ? 700 : stop.isCompleted ? 500 : 400}
                color={stop.isCurrent ? 'primary.main' : stop.isCompleted ? 'text.secondary' : 'text.secondary'}
                noWrap
              >
                {stop.name}
              </Typography>
              {stop.isCurrent && (
                <Box sx={{
                  px: 0.75, py: 0.15, borderRadius: 1, bgcolor: 'primary.main',
                  color: '#fff', fontSize: '0.55rem', fontWeight: 700, lineHeight: 1.2,
                }}>
                  NOW
                </Box>
              )}
              {stop.isCompleted && (
                <Typography variant="caption" sx={{ color: '#22c55e', fontSize: '0.55rem' }}>
                  done
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ))}

      {(direction === 'TO_SCHOOL' || sortedStops.length === 0) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1, pl: compact ? 0 : 0.5 }}>
          {direction === 'TO_SCHOOL' ? (
            <SchoolIcon sx={{ fontSize: compact ? 18 : 22, color: 'secondary.main' }} />
          ) : (
            <HomeIcon sx={{ fontSize: compact ? 18 : 22, color: 'secondary.main' }} />
          )}
          <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600} color="secondary.main">
            {direction === 'TO_SCHOOL' ? 'School (Destination)' : 'Home'}
          </Typography>
        </Box>
      )}

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}
