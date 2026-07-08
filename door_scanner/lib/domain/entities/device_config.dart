import 'dart:convert';

class DeviceConfig {
  final String deviceId;
  final String name;
  final String type;
  final String? busId;
  final String? schoolId;
  final String apiKey;
  final String? firmwareVersion;
  final String? status;
  final DateTime? lastSeenAt;

  const DeviceConfig({
    required this.deviceId,
    required this.name,
    required this.type,
    this.busId,
    this.schoolId,
    required this.apiKey,
    this.firmwareVersion,
    this.status,
    this.lastSeenAt,
  });

  bool get isActive => status == 'ACTIVE';

  Map<String, dynamic> toMap() => {
    'deviceId': deviceId,
    'name': name,
    'type': type,
    'busId': busId,
    'schoolId': schoolId,
    'apiKey': apiKey,
    'firmwareVersion': firmwareVersion,
    'status': status,
    'lastSeenAt': lastSeenAt?.toIso8601String(),
  };

  factory DeviceConfig.fromMap(Map<String, dynamic> map) => DeviceConfig(
    deviceId: map['deviceId'] as String,
    name: map['name'] as String,
    type: map['type'] as String,
    busId: map['busId'] as String?,
    schoolId: map['schoolId'] as String?,
    apiKey: map['apiKey'] as String,
    firmwareVersion: map['firmwareVersion'] as String?,
    status: map['status'] as String?,
    lastSeenAt: map['lastSeenAt'] != null ? DateTime.parse(map['lastSeenAt'] as String) : null,
  );

  String toJson() => jsonEncode(toMap());
  factory DeviceConfig.fromJson(String json) => DeviceConfig.fromMap(jsonDecode(json) as Map<String, dynamic>);
}
