import os, pathlib, sys
BASE = r"C:\Users\ASUS\saferide-nepal\door_scanner"

def w(path, content):
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote: {path}")


def write_api_client():
    w(f'{BASE}/lib/infrastructure/network/api_client.dart', '''
import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import 'auth_interceptor.dart';
import 'logging_interceptor.dart';
import 'retry_interceptor.dart';
import 'token_refresh_interceptor.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;
  late final SecureStorage secureStorage;

  ApiClient._({required this.secureStorage}) {
    dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    dio.interceptors.addAll([
      AuthInterceptor(secureStorage: secureStorage),
      TokenRefreshInterceptor(secureStorage: secureStorage, dio: dio),
      RetryInterceptor(),
      LoggingInterceptor(),
    ]);
  }

  static ApiClient get instance {
    if (_instance == null) throw StateError('ApiClient not initialized');
    return _instance!;
  }

  static void initialize({required SecureStorage secureStorage}) {
    _instance = ApiClient._(secureStorage: secureStorage);
  }
}
''' )
def write_token_refresh_interceptor():
    w(f'{BASE}/lib/infrastructure/network/token_refresh_interceptor.dart', '''
import 'package:dio/dio.dart';
import '../../core/errors/auth_exception.dart';
import '../../core/utils/logger.dart';
import '../storage/secure_storage.dart';

class TokenRefreshInterceptor extends Interceptor {
  final SecureStorage _secureStorage;
  final Dio _dio;
  bool _isRefreshing = false;
  final List<_PendingRequest> _pendingRequests = [];

  TokenRefreshInterceptor({
    required SecureStorage secureStorage,
    required Dio dio,
  })  : _secureStorage = secureStorage,
        _dio = dio;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) { handler.next(err); return; }
    if (_isRefreshing) {
      _pendingRequests.add(_PendingRequest(
        resolve: handler.resolve, reject: handler.next,
        requestOptions: err.requestOptions,
      ));
      return;
    }
    await _handleTokenRefresh(err, handler);
  }

  Future<void> _handleTokenRefresh(DioException err, ErrorInterceptorHandler handler) async {
    _isRefreshing = true;
    try {
      final tokens = await _secureStorage.getAuthTokens();
      if (tokens == null) throw const AuthException('No tokens available for refresh');
      Logger.d('Refreshing access token...', tag: 'TOKEN_REFRESH');
      final response = await _dio.post('/api/v1/auth/refresh', data: {'refreshToken': tokens.refreshToken});
      final newAccessToken = response.data['accessToken'] as String;
      final newRefreshToken = response.data['refreshToken'] as String;
      await _secureStorage.clearAuthTokens();
      await _secureStorage.saveAuthTokens(AuthTokens(accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt: DateTime.now().add(const Duration(hours: 1))));
      _retryOriginalRequest(err.requestOptions, newAccessToken, handler);
      _replayPendingRequests(newAccessToken);
    } catch (e) {
      Logger.e('Token refresh failed: \', tag: 'TOKEN_REFRESH');
      await _secureStorage.clearAuthTokens();
      _rejectAllPending(err);
      handler.next(err);
    } finally { _isRefreshing = false; }
  }

  void _retryOriginalRequest(RequestOptions opts, String token, ErrorInterceptorHandler handler) {
    try {
      opts.headers['Authorization'] = 'Bearer \';
      _dio.fetch(opts).then((r) => handler.resolve(r)).catchError((e) => handler.next(e as DioException));
    } catch (e) { handler.next(DioException(requestOptions: opts, error: e, type: DioExceptionType.unknown)); }
  }

  void _replayPendingRequests(String token) {
    final pending = List<_PendingRequest>.from(_pendingRequests);
    _pendingRequests.clear();
    for (final pr in pending) {
      pr.requestOptions.headers['Authorization'] = 'Bearer \';
      _dio.fetch(pr.requestOptions).then((r) => pr.resolve(r)).catchError((e) => pr.reject(e as DioException));
    }
  }

  void _rejectAllPending(DioException err) {
    final pending = List<_PendingRequest>.from(_pendingRequests);
    _pendingRequests.clear();
    for (final pr in pending) { pr.reject(err); }
  }
}

class _PendingRequest {
  final void Function(Response) resolve;
  final void Function(DioException) reject;
  final RequestOptions requestOptions;
  _PendingRequest({required this.resolve, required this.reject, required this.requestOptions});
}
''' )

def write_auth_remote_datasource():
    w(f'{BASE}/lib/data/datasources/remote/auth_remote_datasource.dart', '''
import 'package:dio/dio.dart';
import '../../../core/errors/auth_exception.dart';
import '../../../core/errors/network_exception.dart';
import '../../models/auth_tokens_model.dart';

class AuthRemoteDataSource {
  final Dio _dio;
  AuthRemoteDataSource(this._dio);

  Future<AuthTokensModel> login(String email, String password) async {
    try {
      final response = await _dio.post('/api/v1/auth/login', data: {'email': email, 'password': password});
      return AuthTokensModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw const AuthException('Invalid email or password', code: 'INVALID_CREDENTIALS');
      throw NetworkException(e.message ?? 'Network error during login', statusCode: e.response?.statusCode);
    }
  }

  Future<AuthTokensModel> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post('/api/v1/auth/refresh', data: {'refreshToken': refreshToken});
      return AuthTokensModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw const AuthException('Invalid refresh token', code: 'INVALID_REFRESH_TOKEN');
      throw NetworkException(e.message ?? 'Network error during token refresh', statusCode: e.response?.statusCode);
    }
  }

  Future<void> logout() async {
    try { await _dio.post('/api/v1/auth/logout'); } on DioException catch (_) {}
  }
}
''' )

def write_auth_notifier():
    w(f'{BASE}/lib/application/notifiers/auth_notifier.dart', '''
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/auth_tokens.dart';
import '../../domain/repositories/i_auth_repository.dart';

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
    state = const AuthState.loading();
    try {
      final repo = ref.read(authRepositoryProvider);
      final tokens = await repo.login(LoginCredentials(email: email, password: password));
      state = AuthState.authenticated(tokens);
    } catch (e) { state = AuthState.error(e.toString()); }
  }

  Future<void> logout() async {
    state = const AuthState.loading();
    try { final repo = ref.read(authRepositoryProvider); await repo.logout(); } catch (_) {}
    state = const AuthState.unauthenticated();
  }

  Future<void> checkAuthStatus() async {
    state = const AuthState.loading();
    try {
      final repo = ref.read(authRepositoryProvider);
      final tokens = await repo.getStoredTokens();
      if (tokens != null && !tokens.isExpired) {
        state = AuthState.authenticated(tokens);
      } else if (tokens != null) {
        try {
          final r = await repo.refreshToken(tokens.refreshToken);
          state = AuthState.authenticated(r);
        } catch (_) { await repo.clearTokens(); state = const AuthState.unauthenticated(); }
      } else { state = const AuthState.unauthenticated(); }
    } catch (_) { state = const AuthState.unauthenticated(); }
  }
}
''' )
