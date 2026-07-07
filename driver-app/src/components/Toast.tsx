import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [fadeAnim, translateY]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = String(++toastId);
    setToast({ id, message, type });
    fadeAnim.setValue(0);
    translateY.setValue(-100);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(hideToast, 3500);
  }, [fadeAnim, translateY, hideToast]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const bgColor = toast?.type === 'success' ? colors.success
    : toast?.type === 'error' ? colors.error
    : toast?.type === 'warning' ? colors.warning
    : colors.info;

  const icon = toast?.type === 'success' ? '✓'
    : toast?.type === 'error' ? '✕'
    : toast?.type === 'warning' ? '⚠'
    : 'ℹ';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.container, { backgroundColor: bgColor, opacity: fadeAnim, transform: [{ translateY }] }]}
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
          <TouchableOpacity onPress={hideToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 50, left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.md,
    borderRadius: 12, zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  icon: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginRight: spacing.sm, width: 24, textAlign: 'center' },
  message: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dismiss: { color: '#FFFFFFCC', fontSize: 16, fontWeight: '700', marginLeft: spacing.sm },
});
