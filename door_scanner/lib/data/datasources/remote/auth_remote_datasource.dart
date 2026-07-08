
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
      if (e.response?.statusCode == 401) throw const AuthException('Invalid email or password', code: 'INVALID_CREDENTIALS');
      throw NetworkException(e.message ?? 'Network error during login', statusCode: e.response?.statusCode);
    }
  }
  Future<AuthTokensModel> refreshToken(String rt) async {
    try {
      final r = await _dio.post('/api/v1/auth/refresh', data: {'refreshToken': rt});
      return AuthTokensModel.fromJson(r.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw const AuthException('Invalid refresh token', code: 'INVALID_REFRESH_TOKEN');
      throw NetworkException(e.message ?? 'Network error during token refresh', statusCode: e.response?.statusCode);
    }
  }
  Future<void> logout() async { try { await _dio.post('/api/v1/auth/logout'); } on DioException catch (_) {} }
}
