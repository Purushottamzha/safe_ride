import { Box, Typography, Button, type ButtonProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';

interface ActionButton {
  label: string;
  onClick?: () => void;
  to?: string;
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ActionButton[];
  showBack?: boolean;
  backTo?: string;
}

export default function PageHeader({ title, subtitle, actions, showBack, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {showBack && (
            <Button
              onClick={() => navigate(backTo ?? -1 as any)}
              startIcon={<ArrowBackIcon />}
              variant="text"
              color="inherit"
              sx={{ minWidth: 0, p: 1 }}
            >
              Back
            </Button>
          )}
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant ?? 'contained'}
                color={action.color ?? 'primary'}
                startIcon={action.icon ?? (action.variant === 'contained' ? <AddIcon /> : undefined)}
                onClick={() => {
                  if (action.to) navigate(action.to);
                  else action.onClick?.();
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
