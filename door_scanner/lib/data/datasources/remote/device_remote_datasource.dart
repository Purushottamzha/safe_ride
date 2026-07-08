import 'package:dio/dio.dart';
import '../../models/device_registration_request.dart';
import '../../models/device_registration_response.dart';
import '../../../core/constants/api_constants.dart';

class DeviceRemoteDataSource {
  final Dio _dio;
  DeviceRemoteDataSource(this._dio);

  Future<DeviceRegistrationResponse> registerDevice(DeviceRegistrationRequest request) async {
    final response = await _dio.post(
      '${ApiConstants.baseUrlKey}/devices',
      data: request.toJson(),
    );
    return DeviceRegistrationResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> getDeviceById(String deviceId) async {
    final response = await _dio.get(
      '${ApiConstants.baseUrlKey}/devices/$deviceId',
    );
    return response.data as Map<String, dynamic>;
  }

  Future<void> updateDeviceStatus(String deviceId, String status) async {
    await _dio.post(
      '${ApiConstants.baseUrlKey}/devices/$deviceId/status',
      data: {'status': status},
    );
  }
}
