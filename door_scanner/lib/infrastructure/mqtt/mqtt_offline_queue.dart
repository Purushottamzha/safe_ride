class MqttOfflineQueue {
  static final MqttOfflineQueue instance = MqttOfflineQueue._();
  MqttOfflineQueue._();
  void enqueue(String payload) {}
  Future<List<String>> flushBatch({int limit = 50}) async => [];
}
