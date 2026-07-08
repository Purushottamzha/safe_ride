class HeartbeatPayloadModel {
  final String deviceId;
  final DateTime timestamp;
  const HeartbeatPayloadModel({required this.deviceId, required this.timestamp});
  factory HeartbeatPayloadModel.fromJson(Map<String, dynamic> json) => HeartbeatPayloadModel(deviceId: json['deviceId'] as String, timestamp: DateTime.parse(json['timestamp'] as String));
  Map<String, dynamic> toJson() => <String, dynamic>{'deviceId': deviceId, 'timestamp': timestamp.toIso8601String()};
}
