class MqttDataSource {
  Future<bool> connect() async => false;
  Future<void> disconnect() async {}
  Future<bool> publish(String topic, String payload) async => false;
}
