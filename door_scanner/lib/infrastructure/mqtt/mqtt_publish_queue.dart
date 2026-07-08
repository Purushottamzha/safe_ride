class MqttPublishQueue {
  static final MqttPublishQueue instance = MqttPublishQueue._();
  MqttPublishQueue._();
  Future<bool> publish(String topic, String payload) async => false;
}
