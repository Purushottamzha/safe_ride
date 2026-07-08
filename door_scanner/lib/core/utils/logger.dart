class Logger {
  Logger._();
  static void d(String message, {String? tag}) => _log('DEBUG', message, tag);
  static void i(String message, {String? tag}) => _log('INFO', message, tag);
  static void w(String message, {String? tag}) => _log('WARN', message, tag);
  static void e(String message, {String? tag, Object? error}) => _log('ERROR', message, tag);
  static void _log(String level, String message, String? tag) {
    final tagName = tag ?? 'SafeRide';
    print('[$tagName] [$level] $message');
  }
}
