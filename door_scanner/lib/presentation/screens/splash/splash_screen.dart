import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/notifiers/auth_notifier.dart';
import '../../../application/providers/auth_provider.dart';
import '../../../presentation/theme/colors.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 800));
    final authNotifier = ref.read(authNotifierProvider.notifier);
    await authNotifier.checkAuthStatus();
    final authState = ref.read(authNotifierProvider);
    authState.whenOrNull(
      data: (state) {
        if (state.status == AuthStatus.authenticated) {
          context.go('/scan');
        } else {
          context.go('/login');
        }
      },
      error: (_, __) => context.go('/login'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.school, size: 80, color: Colors.white),
            const SizedBox(height: 24),
            Text('SafeRide', style: Theme.of(context).textTheme.displayLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Door Scanner', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white70)),
            const SizedBox(height: 48),
            const CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
