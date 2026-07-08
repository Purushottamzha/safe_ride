import os, pathlib, textwrap
def write_file(path, content):
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(textwrap.dedent(content).lstrip('\n'))
    print(f'Wrote: {path}')
def gen_retry_interceptor(base):
    write_file(f'{base}/lib/infrastructure/network/retry_interceptor.dart', '''
import 'package:dio/dio.dart';
import '../../core/utils/logger.dart';

class RetryInterceptor extends Interceptor {
  final int maxRetries;

  RetryInterceptor({this.maxRetries = 3});

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRetry(err) && _getRetryCount(err) < maxRetries) {
      final retryCount = _getRetryCount(err);
      Logger.d('Retrying \ (attempt \/\)', tag: 'RETRY');
      final delays = [const Duration(seconds: 1), const Duration(seconds: 2), const Duration(seconds: 3)];
      if (retryCount < delays.length) await Future.delayed(delays[retryCount]);
      try {
        final options = Options(method: err.requestOptions.method, headers: err.requestOptions.headers,
          extra: {...err.requestOptions.extra, 'retryCount': retryCount + 1});
        final dio = Dio();
        final response = await dio.request(err.requestOptions.path, data: err.requestOptions.data,
          queryParameters: err.requestOptions.queryParameters, options: options);
        handler.resolve(response); return;
      } catch (_) { handler.next(err); return; }
    }
    handler.next(err);
  }

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        (err.response != null && err.response!.statusCode != null && err.response!.statusCode! >= 500);
  }

  int _getRetryCount(DioException err) {
    return (err.requestOptions.extra['retryCount'] as int?) ?? 0;
  }
}
''')
