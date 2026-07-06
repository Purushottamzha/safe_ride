import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from './Header';
import BottomNav from './BottomNav';
import LoadingScreen from '@/components/common/LoadingScreen';
import { useAuthStore } from '@/store/authStore';
import { getMyChildren } from '@/services/students';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getMyChildren,
    enabled: isAuthenticated,
  });

  const initialStudentId = useMemo(() => {
    if (!selectedStudentId && students.length > 0) {
      return students[0].id;
    }
    return selectedStudentId;
  }, [selectedStudentId, students]);

  const handleStudentChange = useCallback((id: string) => {
    setSelectedStudentId(id);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Starting up..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header
        students={students}
        selectedStudentId={initialStudentId}
        onStudentChange={handleStudentChange}
        showBack={false}
      />

      <Box
        component="main"
        sx={{
          pt: { xs: '56px', sm: '64px' },
          pb: { xs: '72px', sm: 3 },
          minHeight: '100vh',
        }}
      >
        {loadingStudents ? (
          <LoadingScreen message="Loading students..." />
        ) : (
          <Outlet context={{ students, selectedStudentId: initialStudentId, onStudentChange: handleStudentChange }} />
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
