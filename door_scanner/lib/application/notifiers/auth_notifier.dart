import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/auth_tokens.dart';
import '../../domain/entities/login_credentials.dart';
import '../providers/auth_provider.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  final AuthStatus status;
  final AuthTokens? tokens;
  final String? error;
  const AuthState({required this.status, this.tokens, this.error});
  const AuthState.initial() : status = AuthStatus.initial, tokens = null, error = null;
  const AuthState.loading() : status = AuthStatus.loading, tokens = null, error = null;
  const AuthState.authenticated(AuthTokens t) : status = AuthStatus.authenticated, tokens = t, error = null;
  const AuthState.unauthenticated() : status = AuthStatus.unauthenticated, tokens = null, error = null;
  const AuthState.error(String e) : status = AuthStatus.error, tokens = null, error = e;
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override Future<AuthState> build() async => const AuthState.initial();

  Future<void> login(String email, String password) async {
    state = const AsyncValue.data(AuthState.loading());
    try {
      final repo = ref.read(authRepositoryProvider);
      final tokens = await repo.login(LoginCredentials(email: email, password: password));
      state = AsyncValue.data(AuthState.authenticated(tokens));
    } catch (e) {
      state = AsyncValue.data(AuthState.error(e.toString()));
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.data(AuthState.loading());
    try { final repo = ref.read(authRepositoryProvider); await repo.logout(); } catch (e) { /* Silently ignore logout errors */ }
    state = const AsyncValue.data(AuthState.unauthenticated());
  }

  Future<void> checkAuthStatus() async {
    state = const AsyncValue.data(AuthState.loading());
    try {
      final repo = ref.read(authRepositoryProvider);
      final tokens = await repo.getStoredTokens();
      if (tokens != null && !tokens.isExpired) {
        state = AsyncValue.data(AuthState.authenticated(tokens));
      } else if (tokens != null) {
        try {
          final refreshed = await repo.refreshToken(tokens.refreshToken);
          state = AsyncValue.data(AuthState.authenticated(refreshed));
        } catch (e) { await repo.clearTokens(); state = const AsyncValue.data(AuthState.unauthenticated()); }
      } else { state = const AsyncValue.data(AuthState.unauthenticated()); }
    } catch (e) { state = const AsyncValue.data(AuthState.unauthenticated()); }
  }
}
