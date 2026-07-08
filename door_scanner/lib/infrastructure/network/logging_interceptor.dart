import 'package:dio/dio.dart';
import '../../core/utils/logger.dart';

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    Logger.d('${options.method} ${options.path}', tag: 'HTTP');
    Logger.d('Headers: ${_redactSensitiveHeaders(options.headers)}', tag: 'HTTP');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    Logger.d('${response.statusCode} ${response.requestOptions.path}', tag: 'HTTP');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    Logger.e('${err.response?.statusCode ?? "NO_STATUS"} ${err.requestOptions.path}: ${err.message}', tag: 'HTTP', error: err);
    handler.next(err);
  }

  Map<String, dynamic> _redactSensitiveHeaders(Map<String, dynamic> headers) {
    final redacted = Map<String, dynamic>.from(headers);
    if (redacted.containsKey('Authorization')) {
      redacted['Authorization'] = 'Bearer ***';
    }
    return redacted;
  }
}
