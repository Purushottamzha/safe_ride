import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Students
import StudentList from './pages/Students/StudentList';
import StudentCreate from './pages/Students/StudentCreate';
import StudentDetail from './pages/Students/StudentDetail';
import StudentEdit from './pages/Students/StudentEdit';
import PendingApprovals from './pages/Students/PendingApprovals';

// Parents
import ParentList from './pages/Parents/ParentList';
import ParentCreate from './pages/Parents/ParentCreate';
import ParentDetail from './pages/Parents/ParentDetail';
import ParentEdit from './pages/Parents/ParentEdit';

// Drivers
import DriverList from './pages/Drivers/DriverList';
import DriverCreate from './pages/Drivers/DriverCreate';
import DriverDetail from './pages/Drivers/DriverDetail';
import DriverEdit from './pages/Drivers/DriverEdit';

// Buses
import BusList from './pages/Buses/BusList';
import BusCreate from './pages/Buses/BusCreate';
import BusDetail from './pages/Buses/BusDetail';
import BusEdit from './pages/Buses/BusEdit';

// Routes
import RouteList from './pages/Routes/RouteList';
import RouteCreate from './pages/Routes/RouteCreate';
import RouteDetail from './pages/Routes/RouteDetail';

// Stops
import StopList from './pages/Stops/StopList';
import StopCreate from './pages/Stops/StopCreate';
import StopDetail from './pages/Stops/StopDetail';
import StopEdit from './pages/Stops/StopEdit';

// Assignments
import AssignmentList from './pages/Assignments/AssignmentList';
import AssignmentCreate from './pages/Assignments/AssignmentCreate';
import AssignmentEdit from './pages/Assignments/AssignmentEdit';
import AssignmentCalendar from './pages/Assignments/AssignmentCalendar';

// Trips
import TripList from './pages/Trips/TripList';
import TripDetail from './pages/Trips/TripDetail';
import TripCreate from './pages/Trips/TripCreate';
import TripReplayPage from './pages/Trips/TripReplayPage';

// Attendance
import AttendanceList from './pages/Attendance/AttendanceList';

// Schools
import SchoolList from './pages/Schools/SchoolList';
import SchoolCreate from './pages/Schools/SchoolCreate';
import SchoolDetail from './pages/Schools/SchoolDetail';
import SchoolEdit from './pages/Schools/SchoolEdit';

// Users
import UserList from './pages/Users/UserList';
import UserCreate from './pages/Users/UserCreate';
import UserDetail from './pages/Users/UserDetail';

// Notifications
import NotificationList from './pages/Notifications/NotificationList';

// Incidents
import IncidentList from './pages/Incidents/IncidentList';
import IncidentCreate from './pages/Incidents/IncidentCreate';
import IncidentDetail from './pages/Incidents/IncidentDetail';

// Core pages (kept static for fast navigation)
import NotFound from './pages/NotFound';
import UserProfile from './pages/Profile/UserProfile';
import SchoolSettings from './pages/Settings/SchoolSettings';
import GateScanner from './pages/GateScanner';
import DeviceList from './pages/Devices/DeviceList';

// Heavy pages — lazy loaded
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));
const AnalyticsPage = lazy(() => import('./pages/Analytics/AnalyticsPage'));
const MaintenancePage = lazy(() => import('./pages/Maintenance/MaintenancePage'));
const FleetDashboard = lazy(() => import('./pages/Fleet/FleetDashboard'));
const DriverSafetyPage = lazy(() => import('./pages/DriverSafety/DriverSafetyPage'));
const ControlCenter = lazy(() => import('./pages/ControlCenter/ControlCenter'));
const QRDashboard = lazy(() => import('./pages/QRManagement/QRDashboard'));
const StudentQR = lazy(() => import('./pages/QRManagement/StudentQR'));
const BulkQR = lazy(() => import('./pages/QRManagement/BulkQR'));
const PrintCards = lazy(() => import('./pages/QRManagement/PrintCards'));
const ExportQR = lazy(() => import('./pages/QRManagement/ExportQR'));
const AuditLogList = lazy(() => import('./pages/AuditLogs/AuditLogList'));
const BulkImportExport = lazy(() => import('./pages/Export/BulkImportExport'));
const DailyOperations = lazy(() => import('./pages/DailyOperations'));
const KathmanduTools = lazy(() => import('./pages/KathmanduTools'));
const GuidedWorkflow = lazy(() => import('./pages/GuidedWorkflow'));

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
        { path: 'students/:id/edit', element: <StudentEdit /> },

        { path: 'parents', element: <ParentList /> },
        { path: 'parents/new', element: <ParentCreate /> },
        { path: 'parents/:id', element: <ParentDetail /> },
        { path: 'parents/:id/edit', element: <ParentEdit /> },

        { path: 'drivers', element: <DriverList /> },
        { path: 'drivers/new', element: <DriverCreate /> },
        { path: 'drivers/:id', element: <DriverDetail /> },
        { path: 'drivers/:id/edit', element: <DriverEdit /> },

        { path: 'buses', element: <BusList /> },
        { path: 'buses/new', element: <BusCreate /> },
        { path: 'buses/:id', element: <BusDetail /> },
        { path: 'buses/:id/edit', element: <BusEdit /> },

        { path: 'routes', element: <RouteList /> },
        { path: 'routes/new', element: <RouteCreate /> },
        { path: 'routes/:id', element: <RouteDetail /> },

        { path: 'stops', element: <StopList /> },
        { path: 'stops/new', element: <StopCreate /> },
        { path: 'stops/:id', element: <StopDetail /> },
        { path: 'stops/:id/edit', element: <StopEdit /> },
        { path: 'assignments', element: <AssignmentList /> },
        { path: 'assignments/new', element: <AssignmentCreate /> },
        { path: 'assignments/:id/edit', element: <AssignmentEdit /> },
        { path: 'assignments/calendar', element: <AssignmentCalendar /> },
        { path: 'trips', element: <TripList /> },
        { path: 'trips/new', element: <TripCreate /> },
        { path: 'trips/:id', element: <TripDetail /> },
        { path: 'trips/:id/replay', element: <TripReplayPage /> },
        { path: 'attendance', element: <AttendanceList /> },
        { path: 'schools', element: <SchoolList /> },
        { path: 'schools/new', element: <SchoolCreate /> },
        { path: 'schools/:id', element: <SchoolDetail /> },
        { path: 'schools/:id/edit', element: <SchoolEdit /> },

        { path: 'users', element: <UserList /> },
        { path: 'users/new', element: <UserCreate /> },
        { path: 'users/:id', element: <UserDetail /> },

        { path: 'notifications', element: <NotificationList /> },

        { path: 'incidents', element: <IncidentList /> },
        { path: 'incidents/new', element: <IncidentCreate /> },
        { path: 'incidents/:id', element: <IncidentDetail /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'analytics', element: <AnalyticsPage /> },
        { path: 'profile', element: <UserProfile /> },
        { path: 'settings', element: <SchoolSettings /> },
        { path: 'audit-logs', element: <AuditLogList /> },
        { path: 'export', element: <BulkImportExport /> },
        { path: 'maintenance', element: <MaintenancePage /> },
        { path: 'fleet', element: <FleetDashboard /> },
        { path: 'driver-safety', element: <DriverSafetyPage /> },
        { path: 'devices', element: <DeviceList /> },
        { path: 'gate-scanner', element: <GateScanner /> },
        { path: 'control-center', element: <ControlCenter /> },
        { path: 'qr-management', element: <QRDashboard /> },
        { path: 'qr-management/students', element: <StudentQR /> },
        { path: 'qr-management/bulk', element: <BulkQR /> },
        { path: 'qr-management/print', element: <PrintCards /> },
        { path: 'qr-management/export', element: <ExportQR /> },
        { path: 'admission-workflow', element: <GuidedWorkflow /> },
        { path: 'daily-operations', element: <DailyOperations /> },
        { path: 'kathmandu-tools', element: <KathmanduTools /> },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);
}
