import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Data will appear here when available.',
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 240,
        gap: 1.5,
        px: 3,
        py: 6,
      }}
    >
      {icon ?? (
        <InboxIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
      )}
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', maxWidth: 280 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
