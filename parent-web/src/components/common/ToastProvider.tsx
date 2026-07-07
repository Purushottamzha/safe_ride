import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';

interface ToastMessage {
  message: string;
  severity: AlertColor;
}

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage>({ message: '', severity: 'info' });

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({ message, severity });
    setOpen(true);
  }, []);

  const handleClose = useCallback((_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 6 }}
      >
        <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ minWidth: 300, borderRadius: 2, boxShadow: 4 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
