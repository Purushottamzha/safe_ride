class DebounceHelper {
  DebounceHelper._();
  static final Map<String, DateTime> _cache = {};
  static bool isDuplicate(String eventId, {Duration ttl = const Duration(seconds: 10)}) {
    final now = DateTime.now();
    final last = _cache[eventId];
    if (last != null && now.difference(last) < ttl) return true;
    _cache[eventId] = now;
    return false;
  }
  static void clean() => _cache.clear();
}
