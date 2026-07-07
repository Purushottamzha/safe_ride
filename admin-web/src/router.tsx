import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/Students/StudentList';
import StudentCreate from './pages/Students/StudentCreate';
import StudentDetail from './pages/Students/StudentDetail';
import PendingApprovals from './pages/Students/PendingApprovals';
import DriverList from './pages/Drivers/DriverList';
import DriverCreate from './pages/Drivers/DriverCreate';
import BusList from './pages/Buses/BusList';
import BusCreate from './pages/Buses/BusCreate';
import RouteList from './pages/Routes/RouteList';
import AssignmentList from './pages/Assignments/AssignmentList';
import AssignmentCalendar from './pages/Assignments/AssignmentCalendar';
import TripList from './pages/Trips/TripList';
import TripDetail from './pages/Trips/TripDetail';
import TripReplayPage from './pages/Trips/TripReplayPage';
import AttendanceList from './pages/Attendance/AttendanceList';
import SchoolList from './pages/Schools/SchoolList';
import SchoolCreate from './pages/Schools/SchoolCreate';
import UserList from './pages/Users/UserList';
import NotificationList from './pages/Notifications/NotificationList';
import IncidentList from './pages/Incidents/IncidentList';
import ReportsPage from './pages/Reports/ReportsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import DriverSafetyPage from './pages/DriverSafety/DriverSafetyPage';
import NotFound from './pages/NotFound';
import GateScanner from './pages/GateScanner';

export function createRouter(isAuthenticated: boolean) {
  return createBrowserRouter([
    {
      path: '/login',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />,
    },
    {
      path: '/',
      element: isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'students', element: <StudentList /> },
        { path: 'students/new', element: <StudentCreate /> },
        { path: 'students/:id', element: <StudentDetail /> },
        { path: 'students/pending-approvals', element: <PendingApprovals /> },
        { path: 'drivers', element: <DriverList /> },
        { path: 'drivers/new', element: <DriverCreate /> },
        { path: 'buses', element: <BusList /> },
        { path: 'buses/new', element: <BusCreate /> },
        { path: 'routes', element: <RouteList /> },
        { path: 'assignments', element: <AssignmentList /> },
        { path: 'assignments/calendar', element: <AssignmentCalendar /> },
        { path: 'trips', element: <TripList /> },
        { path: 'trips/:id', element: <TripDetail /> },
        { path: 'trips/:id/replay', element: <TripReplayPage /> },
        { path: 'attendance', element: <AttendanceList /> },
        { path: 'schools', element: <SchoolList /> },
        { path: 'schools/new', element: <SchoolCreate /> },
        { path: 'users', element: <UserList /> },
        { path: 'notifications', element: <NotificationList /> },
        { path: 'incidents', element: <IncidentList /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'maintenance', element: <MaintenancePage /> },
        { path: 'driver-safety', element: <DriverSafetyPage /> },
        { path: 'gate-scanner', element: <GateScanner /> },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
}
