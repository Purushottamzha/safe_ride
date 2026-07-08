class ForegroundServiceChannel {
  static final ForegroundServiceChannel instance = ForegroundServiceChannel._();
  ForegroundServiceChannel._();
  void start() {}
  void stop() {}
  void updateNotification(String title, String body) {}
}
