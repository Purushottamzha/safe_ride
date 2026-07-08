class DeviceRegistrationRequest {
  final String name;
  final String type;
  final String? busId;
  final String? schoolId;
  final String? firmwareVersion;

  const DeviceRegistrationRequest({
    required this.name,
    required this.type,
    this.busId,
    this.schoolId,
    this.firmwareVersion,
  });

  Map<String, dynamic> toJson() => {
    'name': name,
    'type': type,
    if (busId != null) 'busId': busId,
    if (schoolId != null) 'schoolId': schoolId,
    if (firmwareVersion != null) 'firmwareVersion': firmwareVersion,
  };
}
