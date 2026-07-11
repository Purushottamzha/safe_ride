import { Fab, Tooltip, alpha, useTheme } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SosButtonProps {
  onClick: () => void;
  pulse?: boolean;
}

export default function SosButton({ onClick, pulse = true }: SosButtonProps) {
  const theme = useTheme();

  return (
    <Tooltip title="Emergency SOS" placement="left">
      <motion.div
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        animate={pulse ? {
          scale: [1, 1.05, 1],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        } : {}}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Fab
          color="error"
          onClick={onClick}
          sx={{
            width: 56,
            height: 56,
            boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.4)}`,
            '&:hover': {
              boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.5)}`,
            },
          }}
        >
          <Warning sx={{ fontSize: 28 }} />
        </Fab>
      </motion.div>
    </Tooltip>
  );
}
