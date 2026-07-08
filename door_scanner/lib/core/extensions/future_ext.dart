extension FutureExtension<T> on Future<T> {
  Future<T> withTimeout(Duration duration) => timeout(duration);
  Future<T> retry(int times, {Duration delay = const Duration(seconds: 1)}) async {
    for (var i = 0; i < times; i++) {
      try { return await this; } catch (_) {}
      await Future.delayed(delay);
    }
    return await this;
  }
}
