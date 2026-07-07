import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

export function CardSkeleton() {
  return (
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Stack>
    </Box>
  );
}

export function StatSkeleton() {
  return (
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', boxShadow: 1 }}>
      <Skeleton variant="text" width="50%" height={14} />
      <Skeleton variant="text" width="80%" height={36} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="30%" height={12} sx={{ mt: 0.5 }} />
    </Box>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rounded" width="100%" height={height} />
    </Box>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="100%" height={40} sx={{ mb: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${60 + Math.random() * 40}%`} height={20} sx={{ my: 1.5 }} />
      ))}
    </Box>
  );
}

export function PageSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={320} height={16} sx={{ mb: 3 }} />
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map(i => <Box key={i} sx={{ flex: 1 }}><StatSkeleton /></Box>)}
      </Stack>
      <Skeleton variant="rounded" width="100%" height={300} />
    </Box>
  );
}
