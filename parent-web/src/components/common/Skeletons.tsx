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

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${70 + Math.random() * 30}%`} height={20} sx={{ my: 1.5 }} />
      ))}
    </Box>
  );
}

export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <Stack spacing={1.5} sx={{ p: 2 }}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={72} />
      ))}
    </Stack>
  );
}
