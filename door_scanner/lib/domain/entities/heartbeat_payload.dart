class HeartbeatPayload {
  final String deviceId;
  final DateTime timestamp;

  const HeartbeatPayload({required this.deviceId, required this.timestamp});
}
