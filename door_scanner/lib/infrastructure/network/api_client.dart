import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
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
    dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: ApiConstants.connectTimeoutSeconds),
        receiveTimeout: const Duration(seconds: ApiConstants.receiveTimeoutSeconds),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      AuthInterceptor(secureStorage: secureStorage),
      TokenRefreshInterceptor(secureStorage: secureStorage, dio: dio),
      RetryInterceptor(),
      LoggingInterceptor(),
    ]);
  }

  static ApiClient get instance {
    if (_instance == null) throw StateError('ApiClient not initialized. Call initialize() first.');
    return _instance!;
  }

  static void initialize({required SecureStorage secureStorage}) {
    _instance = ApiClient._(secureStorage: secureStorage);
  }

  static void reset() { _instance = null; }
}
