import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import StudentsList from '@/pages/StudentsList';
import StudentStatus from '@/pages/StudentStatus';
import AttendanceTimeline from '@/pages/AttendanceTimeline';
import TripHistory from '@/pages/TripHistory';
import Notifications from '@/pages/Notifications';
import BusTracking from '@/pages/BusTracking';
import Profile from '@/pages/Profile';
import NotificationPreferences from '@/pages/NotificationPreferences';
import NotFound from '@/pages/NotFound';
import RegisterStudent from '@/pages/RegisterStudent';
import DriverDetails from '@/pages/driver/DriverDetails';
import BusDetails from '@/pages/bus/BusDetails';
import EmergencyContacts from '@/pages/EmergencyContacts';
import PickupAuthorization from '@/pages/PickupAuthorization';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'students', element: <StudentsList /> },
      { path: 'register-student', element: <RegisterStudent /> },
      { path: 'student/:id', element: <StudentStatus /> },
      { path: 'student/:id/attendance', element: <AttendanceTimeline /> },
      { path: 'student/:id/trips', element: <TripHistory /> },
      { path: 'student/:id/driver', element: <DriverDetails /> },
      { path: 'student/:id/bus', element: <BusDetails /> },
      { path: 'student/:id/emergency', element: <EmergencyContacts /> },
      { path: 'student/:id/pickup', element: <PickupAuthorization /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'notification-preferences', element: <NotificationPreferences /> },
      { path: 'bus-tracking', element: <BusTracking /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
