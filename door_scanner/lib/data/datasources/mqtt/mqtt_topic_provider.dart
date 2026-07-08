class MqttTopicProvider {
  final String schoolId;
  final String busId;

  MqttTopicProvider({required this.schoolId, required this.busId});

  String get topicScan => 'saferide/$schoolId/bus/$busId/scan';
  String get topicLocation => 'saferide/$schoolId/bus/$busId/location';
  String get topicHeartbeat => 'saferide/$schoolId/bus/$busId/heartbeat';
}
