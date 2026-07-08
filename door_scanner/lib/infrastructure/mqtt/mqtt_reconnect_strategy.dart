class MqttReconnectStrategy {
  static final MqttReconnectStrategy instance = MqttReconnectStrategy._();
  MqttReconnectStrategy._();
  void onDisconnect() {}
  void onConnect() {}
}
