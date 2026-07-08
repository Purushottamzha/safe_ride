abstract class IMqttRepository {
  Future<bool> connect();
  Future<void> disconnect();
  Future<bool> publish(String topic, String payload);
  Stream<Object> get connectionState;
}
