import 'package:dio/dio.dart';
import '../../core/utils/logger.dart';

class RetryInterceptor extends Interceptor {
  final int maxRetries;
  final List<Duration> delays;

  RetryInterceptor({this.maxRetries = 3})
      : delays = [
          const Duration(seconds: 1),
          const Duration(seconds: 2),
          const Duration(seconds: 3),
        ];

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRetry(err) && _hasRemainingRetries(err)) {
      final retryCount = _getRetryCount(err);
      Logger.d('Retrying ${err.requestOptions.path} (attempt ${retryCount + 1}/$maxRetries)', tag: 'RETRY');
      if (retryCount < delays.length) {
        await Future.delayed(delays[retryCount]);
      }
      try {
        final response = await _retry(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (_) {
        handler.next(err);
        return;
      }
    }
    handler.next(err);
  }

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        (err.response != null &&
            err.response!.statusCode != null &&
            err.response!.statusCode! >= 500);
  }

  bool _hasRemainingRetries(DioException err) {
    return _getRetryCount(err) < maxRetries;
  }

  int _getRetryCount(DioException err) {
    return (err.requestOptions.extra['retryCount'] as int?) ?? 0;
  }

  Future<Response> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
      extra: {
        ...requestOptions.extra,
        'retryCount': (requestOptions.extra['retryCount'] as int? ?? 0) + 1,
      },
    );
    final dio = Dio();
    return dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}
