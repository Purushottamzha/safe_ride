import 'package:dio/dio.dart';
import '../../core/errors/auth_exception.dart';
import '../../core/utils/logger.dart';
import '../storage/secure_storage.dart';
import '../../domain/entities/auth_tokens.dart';

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
        resolve: handler.resolve,
        reject: handler.next,
        requestOptions: err.requestOptions,
      ));
      return;
    }
    await _handleTokenRefresh(err, handler);
  }

  Future<void> _handleTokenRefresh(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    _isRefreshing = true;
    try {
      final tokens = await _secureStorage.getAuthTokens();
      if (tokens == null) throw const AuthException('No tokens available for refresh');
      Logger.d('Refreshing access token...', tag: 'TOKEN_REFRESH');
      final response = await _dio.post('/api/v1/auth/refresh', data: {'refreshToken': tokens.refreshToken});
      final newAccessToken = response.data['accessToken'] as String;
      final newRefreshToken = response.data['refreshToken'] as String;
      await _secureStorage.clearAuthTokens();
      await _secureStorage.saveAuthTokens(AuthTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
      ));
      _retryOriginalRequest(err.requestOptions, newAccessToken, handler);
      _replayPendingRequests(newAccessToken);
    } catch (e) {
      Logger.e('Token refresh failed: ', tag: 'TOKEN_REFRESH');
      await _secureStorage.clearAuthTokens();
      _rejectAllPending(err);
      handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }

  void _retryOriginalRequest(
    RequestOptions opts,
    String token,
    ErrorInterceptorHandler handler,
  ) {
    try {
      opts.headers['Authorization'] = 'Bearer ';
      _dio
          .fetch(opts)
          .then((r) => handler.resolve(r))
          .catchError((e) => handler.next(e as DioException));
    } catch (e) {
      handler.next(DioException(
        requestOptions: opts,
        error: e,
        type: DioExceptionType.unknown,
      ));
    }
  }

  void _replayPendingRequests(String token) {
    final pending = List<_PendingRequest>.from(_pendingRequests);
    _pendingRequests.clear();
    for (final pr in pending) {
      pr.requestOptions.headers['Authorization'] = 'Bearer ';
      _dio
          .fetch(pr.requestOptions)
          .then((r) => pr.resolve(r))
          .catchError((e) => pr.reject(e as DioException));
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
  _PendingRequest({
    required this.resolve,
    required this.reject,
    required this.requestOptions,
  });
}
