class MqttAckTracker {
  static final MqttAckTracker instance = MqttAckTracker._();
  MqttAckTracker._();
  void track(String eventId) {}
  void onAck(String eventId) {}
  void onTimeout(String eventId) {}
}
