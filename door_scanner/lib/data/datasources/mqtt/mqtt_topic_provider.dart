class MqttTopicProvider {
  final String schoolId;
  final String busId;
  final String deviceId;

  MqttTopicProvider({
    required this.schoolId,
    required this.busId,
    required this.deviceId,
  });

  String get topicScan => 'saferide/$schoolId/bus/$busId/scan';
  String get topicLocation => 'saferide/$schoolId/bus/$busId/location';
  String get topicHeartbeat => 'saferide/$schoolId/bus/$busId/heartbeat';
  String get topicCommand => 'saferide/$schoolId/bus/$busId/command';
  String get topicStatus => 'saferide/device/$deviceId/status';

  String eventTopic(String eventType) {
    return 'saferide/$schoolId/bus/$busId/$eventType';
  }
}
