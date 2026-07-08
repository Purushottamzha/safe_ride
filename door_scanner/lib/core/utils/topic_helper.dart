class TopicHelper {
  TopicHelper._();
  static String scanTopic(String schoolId, String busId) => 'saferide/$schoolId/bus/$busId/scan';
  static String locationTopic(String schoolId, String busId) => 'saferide/$schoolId/bus/$busId/location';
  static String heartbeatTopic(String schoolId, String busId) => 'saferide/$schoolId/bus/$busId/heartbeat';
}
