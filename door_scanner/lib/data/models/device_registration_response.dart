import '../../domain/entities/device_config.dart';

class DeviceRegistrationResponse {
  final String id;
  final String name;
  final String type;
  final String? busId;
  final String apiKey;
  final String message;

  const DeviceRegistrationResponse({
    required this.id,
    required this.name,
    required this.type,
    this.busId,
    required this.apiKey,
    required this.message,
  });

  factory DeviceRegistrationResponse.fromJson(Map<String, dynamic> json) =>
      DeviceRegistrationResponse(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String,
        busId: json['busId'] as String?,
        apiKey: json['apiKey'] as String,
        message: json['message'] as String,
      );

  DeviceConfig toEntity() => DeviceConfig(
    deviceId: id,
    name: name,
    type: type,
    busId: busId,
    apiKey: apiKey,
  );
}
