class MqttConnectionManager {
  static final MqttConnectionManager instance = MqttConnectionManager._();
  MqttConnectionManager._();
  Future<bool> connect() async => false;
  Future<void> disconnect() async {}
}
