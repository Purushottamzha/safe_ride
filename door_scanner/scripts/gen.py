import os, pathlib
B = r'C:\Users\ASUS\saferide-nepal\door_scanner'
def w(p,c): pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True); open(p,'w',encoding='utf-8').write(c); print(f'W: {p}')

# Auth interceptor
w(f"{B}/lib/infrastructure/network/auth_interceptor.dart", """
import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorage _secureStorage;
  AuthInterceptor({required SecureStorage secureStorage}) : _secureStorage = secureStorage;
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (!options.path.contains('/auth/login') && !options.path.contains('/auth/register')) {
      final tokens = await _secureStorage.getAuthTokens();
      if (tokens != null) { options.headers['Authorization'] = 'Bearer \'; }
    }
    handler.next(options);
  }
}
""")

# Logging interceptor
w(f"{B}/lib/infrastructure/network/logging_interceptor.dart", """
import 'package:dio/dio.dart';
import '../../core/utils/logger.dart';

class LoggingInterceptor extends Interceptor {
  @override void onRequest(RequestOptions o, RequestInterceptorHandler h) {
    Logger.d('\ \', tag: 'HTTP');
    Logger.d('Headers: \', tag: 'HTTP'); h.next(o); }
  @override void onResponse(Response r, ResponseInterceptorHandler h) {
    Logger.d('\ \', tag: 'HTTP'); h.next(r); }
  @override void onError(DioException e, ErrorInterceptorHandler h) {
    Logger.e('\ \: \', tag: 'HTTP', error: e); h.next(e); }
  Map _redact(Map h) { var r = Map.of(h); if (r.containsKey('Authorization')) r['Authorization'] = 'Bearer ***'; return r; }
}
""")

# Retry interceptor
w(f"{B}/lib/infrastructure/network/retry_interceptor.dart", """
import 'package:dio/dio.dart'; import '../../core/utils/logger.dart';
class RetryInterceptor extends Interceptor {
  final int maxRetries; RetryInterceptor({this.maxRetries = 3});
  @override void onError(DioException e, ErrorInterceptorHandler h) async {
    if ((e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout ||
         e.type == DioExceptionType.connectionError || (e.response != null && e.response!.statusCode! >= 500))
        && (e.requestOptions.extra['retryCount'] as int? ?? 0) < maxRetries) {
      final rc = (e.requestOptions.extra['retryCount'] as int? ?? 0);
      Logger.d('Retry \ attempt \/\', tag: 'RETRY');
      final delays = [const Duration(seconds: 1), const Duration(seconds: 2), const Duration(seconds: 3)];
      if (rc < delays.length) await Future.delayed(delays[rc]);
      try {
        final opts = Options(method: e.requestOptions.method, headers: e.requestOptions.headers,
          extra: {...e.requestOptions.extra, 'retryCount': rc + 1});
        final r = await Dio().request(e.requestOptions.path, data: e.requestOptions.data,
          queryParameters: e.requestOptions.queryParameters, options: opts);
        h.resolve(r); return;
      } catch (_) { h.next(e); return; }
    } h.next(e);
  }
}
""")

# AuthRemoteDataSource
w(f"{B}/lib/data/datasources/remote/auth_remote_datasource.dart", """
import 'package:dio/dio.dart';
import '../../../core/errors/auth_exception.dart';
import '../../../core/errors/network_exception.dart';
import '../../models/auth_tokens_model.dart';
class AuthRemoteDataSource {
  final Dio _dio; AuthRemoteDataSource(this._dio);
  Future<AuthTokensModel> login(String email, String password) async {
    try {
      final r = await _dio.post('/api/v1/auth/login', data: {'email': email, 'password': password});
      return AuthTokensModel.fromJson(r.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw AuthException('Invalid email or password', code: 'INVALID_CREDENTIALS');
      throw NetworkException(e.message ?? 'Network error during login', statusCode: e.response?.statusCode);
    }
  }
  Future<AuthTokensModel> refreshToken(String rt) async {
    try {
      final r = await _dio.post('/api/v1/auth/refresh', data: {'refreshToken': rt});
      return AuthTokensModel.fromJson(r.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw AuthException('Invalid refresh token', code: 'INVALID_REFRESH_TOKEN');
      throw NetworkException(e.message ?? 'Network error during token refresh', statusCode: e.response?.statusCode);
    }
  }
  Future<void> logout() async { try { await _dio.post('/api/v1/auth/logout'); } on DioException catch (_) {} }
}
""")

# AuthTokensModel
w(f"{B}/lib/data/models/auth_tokens_model.dart", """
import '../../domain/entities/auth_tokens.dart';
class AuthTokensModel {
  final String accessToken; final String refreshToken; final DateTime? expiresAt;
  const AuthTokensModel({required this.accessToken, required this.refreshToken, this.expiresAt});
  factory AuthTokensModel.fromJson(Map<String, dynamic> j) => AuthTokensModel(
    accessToken: j['accessToken'] as String, refreshToken: j['refreshToken'] as String,
    expiresAt: j['expiresAt'] != null ? DateTime.parse(j['expiresAt'] as String) : null);
  Map<String, dynamic> toJson() => {'accessToken': accessToken, 'refreshToken': refreshToken, if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String()};
  AuthTokens toEntity() => AuthTokens(accessToken: accessToken, refreshToken: refreshToken, expiresAt: expiresAt ?? DateTime.now().add(const Duration(hours: 1)));
  factory AuthTokensModel.fromEntity(AuthTokens e) => AuthTokensModel(accessToken: e.accessToken, refreshToken: e.refreshToken, expiresAt: e.expiresAt);
}
""")

# AuthRepositoryImpl
w(f"{B}/lib/data/repositories/auth_repository_impl.dart", """
import '../../domain/entities/auth_tokens.dart';
import '../../domain/entities/login_credentials.dart';
import '../../domain/repositories/i_auth_repository.dart';
import '../../infrastructure/storage/secure_storage.dart';
import '../datasources/remote/auth_remote_datasource.dart';
import '../models/auth_tokens_model.dart';
class AuthRepositoryImpl implements IAuthRepository {
  final AuthRemoteDataSource remoteDataSource; final SecureStorage secureStorage;
  AuthRepositoryImpl({required this.remoteDataSource, required this.secureStorage});
  @override Future<AuthTokens> login(LoginCredentials c) async {
    final m = await remoteDataSource.login(c.email, c.password); final e = m.toEntity();
    await secureStorage.saveAuthTokens(e); return e;
  }
  @override Future<void> logout() async {
    try { await remoteDataSource.logout(); } catch (_) {}
    await secureStorage.clearAuthTokens();
  }
  @override Future<AuthTokens> refreshToken(String rt) async {
    final m = await remoteDataSource.refreshToken(rt); final e = m.toEntity();
    await secureStorage.saveAuthTokens(e); return e;
  }
  @override Future<AuthTokens?> getStoredTokens() async => secureStorage.getAuthTokens();
  @override Future<void> clearTokens() async => secureStorage.clearAuthTokens();
  @override Future<bool> isLoggedIn() async {
    final t = await secureStorage.getAuthTokens();
    if (t == null) return false;
    if (t.isExpired) {
      try { await refreshToken(t.refreshToken); return true; } catch (_) { await secureStorage.clearAuthTokens(); return false; }
    }
    return true;
  }
}
""")

# AuthProvider
w(f"{B}/lib/application/providers/auth_provider.dart", """
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/i_auth_repository.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../data/datasources/remote/auth_remote_datasource.dart';
import '../../infrastructure/network/api_client.dart';
import '../../infrastructure/storage/secure_storage.dart';
import '../notifiers/auth_notifier.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(ApiClient.instance.dio);
});

final authRepositoryProvider = Provider<IAuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.read(authRemoteDataSourceProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
});

final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
""")

# LoginProvider
w(f"{B}/lib/presentation/screens/auth/login_provider.dart", """
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginFormState {
  final String email; final String password; final bool rememberMe;
  final bool isLoading; final String? error; final bool isObscured;
  const LoginFormState({this.email='', this.password='', this.rememberMe=false, this.isLoading=false, this.error, this.isObscured=true});
  LoginFormState copyWith({String? email, String? password, bool? rememberMe, bool? isLoading, String? error, bool? isObscured}) =>
    LoginFormState(email: email??this.email, password: password??this.password, rememberMe: rememberMe??this.rememberMe,
      isLoading: isLoading??this.isLoading, error: error, isObscured: isObscured??this.isObscured);
}
class LoginFormNotifier extends StateNotifier<LoginFormState> {
  LoginFormNotifier() : super(const LoginFormState());
  void setEmail(String v) => state = state.copyWith(email: v, error: null);
  void setPassword(String v) => state = state.copyWith(password: v, error: null);
  void toggleRememberMe() => state = state.copyWith(rememberMe: !state.rememberMe);
  void toggleObscured() => state = state.copyWith(isObscured: !state.isObscured);
  void setLoading(bool v) => state = state.copyWith(isLoading: v);
  void setError(String e) => state = state.copyWith(error: e, isLoading: false);
  String? validate() {
    if (state.email.trim().isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(state.email.trim())) return 'Invalid email format';
    if (state.password.isEmpty) return 'Password is required';
    if (state.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  }
}

final loginFormProvider = StateNotifierProvider<LoginFormNotifier, LoginFormState>((ref) => LoginFormNotifier());
""")

# LoginScreen
w(f"{B}/lib/presentation/screens/auth/login_screen.dart", """
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/notifiers/auth_notifier.dart';
import '../../../application/providers/auth_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../presentation/theme/colors.dart';
import '../../../presentation/theme/spacing.dart';
import '../../../presentation/theme/tokens.dart';
import 'login_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formState = ref.watch(loginFormProvider);
    final authState = ref.watch(authNotifierProvider);

    ref.listen<AuthState>(authNotifierProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) context.go('/scan');
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
                Icon(Icons.school, size: 80, color: AppColors.primary),
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
    final authNotifier = ref.read(authNotifierProvider.notifier);
    await authNotifier.login(formNotifier.state.email.trim(), formNotifier.state.password);
  }
}
""")

# SplashScreen
w(f"{B}/lib/presentation/screens/splash/splash_screen.dart", """
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
""")

# Router with guards
w(f"{B}/lib/presentation/app/router.dart", """
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
import '../../application/providers/auth_provider.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final container = ProviderScope.containerOf(context);
      final authAsync = container.read(authNotifierProvider);
      final authState = authAsync.valueOrNull;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';

      if (authState == null || authState.status == AuthStatus.initial) {
        if (!isSplash) return '/splash';
        return null;
      }
      if (authState.status == AuthStatus.authenticated) {
        if (isSplash || isLogin) return '/scan';
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
      GoRoute(path: '/scan', name: 'scan', builder: (context, state) => const ScanScreen()),
      GoRoute(path: '/status', name: 'status', builder: (context, state) => const StatusScreen()),
      GoRoute(path: '/settings', name: 'settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/setup', name: 'setup', builder: (context, state) => const SetupScreen()),
      GoRoute(path: '/trip', name: 'trip', builder: (context, state) => const TripScreen(),
        routes: [GoRoute(path: ':tripId', name: 'tripDetail', builder: (context, state) => TripScreen(tripId: state.pathParameters['tripId']))]),
      GoRoute(path: '/map', name: 'map', builder: (context, state) => const MapScreen()),
    ],
  );
}
""")

