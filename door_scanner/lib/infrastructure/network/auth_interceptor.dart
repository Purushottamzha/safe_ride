import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorage _secureStorage;
  AuthInterceptor({required SecureStorage secureStorage}) : _secureStorage = secureStorage;
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (!options.path.contains('/auth/login') && !options.path.contains('/auth/register')) {
      final tokens = await _secureStorage.getAuthTokens();
      if (tokens != null) { options.headers['Authorization'] = 'Bearer ${tokens.accessToken}'; }
    }
    handler.next(options);
  }
}
