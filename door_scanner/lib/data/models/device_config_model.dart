class DeviceConfigModel {
  final String deviceId;
  final String schoolId;
  final String busId;
  const DeviceConfigModel({required this.deviceId, required this.schoolId, required this.busId});
  factory DeviceConfigModel.fromJson(Map<String, dynamic> json) => DeviceConfigModel(deviceId: json['deviceId'] as String, schoolId: json['schoolId'] as String, busId: json['busId'] as String);
  Map<String, dynamic> toJson() => <String, dynamic>{'deviceId': deviceId, 'schoolId': schoolId, 'busId': busId};
}
