import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/scan/scan_screen.dart';
import '../screens/status/status_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/setup/setup_screen.dart';
import '../screens/trip/trip_screen.dart';
import '../screens/map/map_screen.dart';
import '../screens/auth/login_screen.dart';
import '../../application/notifiers/auth_notifier.dart';
import '../../application/notifiers/device_notifier.dart';
import '../../application/providers/auth_provider.dart';
import '../../application/providers/device_provider.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final container = ProviderScope.containerOf(context);
      final authAsync = container.read(authNotifierProvider);
      final deviceAsync = container.read(deviceNotifierProvider);
      final authState = authAsync.valueOrNull;
      final deviceState = deviceAsync.valueOrNull;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';
      final isSetup = state.matchedLocation == '/setup';

      if (authState == null || authState.status == AuthStatus.initial) {
        if (!isSplash) return '/splash';
        return null;
      }
      if (authState.status == AuthStatus.authenticated) {
        if (isSplash || isLogin) {
          if (deviceState?.status == DeviceStatus.registered) return '/scan';
          if (deviceState?.status == DeviceStatus.notRegistered) return '/setup';
          return null;
        }
        if (!isSetup && deviceState?.status == DeviceStatus.notRegistered) return '/setup';
        if (isSetup && deviceState?.status == DeviceStatus.registered) return '/scan';
        return null;
      }
      if (authState.status == AuthStatus.unauthenticated || authState.status == AuthStatus.error) {
        if (!isLogin && !isSplash) return '/login';
        return null;
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', name: 'splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', name: 'login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/setup', name: 'setup', builder: (context, state) => const SetupScreen()),
      GoRoute(path: '/scan', name: 'scan', builder: (context, state) => const ScanScreen()),
      GoRoute(path: '/status', name: 'status', builder: (context, state) => const StatusScreen()),
      GoRoute(path: '/settings', name: 'settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/trip', name: 'trip', builder: (context, state) => const TripScreen(),
        routes: [GoRoute(path: ':tripId', name: 'tripDetail', builder: (context, state) => TripScreen(tripId: state.pathParameters['tripId']))]),
      GoRoute(path: '/map', name: 'map', builder: (context, state) => const MapScreen()),
    ],
  );
}
