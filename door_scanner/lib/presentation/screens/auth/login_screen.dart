import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/notifiers/auth_notifier.dart';
import '../../../application/providers/auth_provider.dart';
import '../../../presentation/theme/colors.dart';
import '../../../presentation/theme/spacing.dart';
import '../../../presentation/theme/tokens.dart';
import 'login_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formState = ref.watch(loginFormProvider);

    ref.listen<AsyncValue<AuthState>>(authNotifierProvider, (previous, next) {
      next.whenOrNull(data: (state) {
        if (state.status == AuthStatus.authenticated) context.go('/scan');
      });
    });

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.school, size: 80, color: AppColors.primary),
                const SizedBox(height: AppSpacing.md),
                Text('SafeRide', style: Theme.of(context).textTheme.displayLarge?.copyWith(color: AppColors.primary), textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.xs),
                Text('Door Scanner', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.grey[600]), textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.xl),
                if (formState.error != null)
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(AppTokens.borderRadius)),
                    child: Text(formState.error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                  ),
                if (formState.error != null) const SizedBox(height: AppSpacing.md),
                TextField(
                  decoration: InputDecoration(labelText: 'Email', prefixIcon: const Icon(Icons.email_outlined), border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppTokens.borderRadius))),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  onChanged: (v) => ref.read(loginFormProvider.notifier).setEmail(v),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined), border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppTokens.borderRadius)),
                    suffixIcon: IconButton(icon: Icon(formState.isObscured ? Icons.visibility_off : Icons.visibility), onPressed: () => ref.read(loginFormProvider.notifier).toggleObscured())),
                  obscureText: formState.isObscured,
                  textInputAction: TextInputAction.done,
                  onChanged: (v) => ref.read(loginFormProvider.notifier).setPassword(v),
                  onSubmitted: (_) => _handleLogin(ref, context),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Checkbox(value: formState.rememberMe, onChanged: (_) => ref.read(loginFormProvider.notifier).toggleRememberMe()),
                    const Text('Remember Me'),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: formState.isLoading ? null : () => _handleLogin(ref, context),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTokens.borderRadius))),
                    child: formState.isLoading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin(WidgetRef ref, BuildContext context) async {
    final formNotifier = ref.read(loginFormProvider.notifier);
    final error = formNotifier.validate();
    if (error != null) { formNotifier.setError(error); return; }
    formNotifier.setLoading(true);
    await ref.read(authNotifierProvider.notifier).login(
      ref.read(loginFormProvider).email.trim(),
      ref.read(loginFormProvider).password,
    );
  }
}
