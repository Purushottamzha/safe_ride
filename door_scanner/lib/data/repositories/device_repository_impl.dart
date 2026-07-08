import '../../domain/repositories/i_device_repository.dart';
import '../../domain/entities/device_config.dart';
import '../datasources/remote/device_remote_datasource.dart';
import '../models/device_registration_request.dart';
import '../../infrastructure/storage/secure_storage.dart';

class DeviceRepositoryImpl implements IDeviceRepository {
  final DeviceRemoteDataSource _remoteDataSource;
  final SecureStorage _secureStorage;

  DeviceRepositoryImpl({
    required DeviceRemoteDataSource remoteDataSource,
    required SecureStorage secureStorage,
  })  : _remoteDataSource = remoteDataSource,
        _secureStorage = secureStorage;

  @override
  Future<DeviceConfig> register({
    required String name,
    required String type,
    String? busId,
    String? schoolId,
    String? firmwareVersion,
  }) async {
    final request = DeviceRegistrationRequest(
      name: name,
      type: type,
      busId: busId,
      schoolId: schoolId,
      firmwareVersion: firmwareVersion,
    );
    final response = await _remoteDataSource.registerDevice(request);
    final device = response.toEntity();
    await _secureStorage.saveDeviceConfig(device);
    return device;
  }

  @override
  Future<DeviceConfig> getDeviceById(String deviceId) async {
    final data = await _remoteDataSource.getDeviceById(deviceId);
    return DeviceConfig(
      deviceId: data['id'] as String,
      name: data['name'] as String,
      type: data['type'] as String,
      busId: data['busId'] as String?,
      schoolId: data['schoolId'] as String?,
      apiKey: '',
      firmwareVersion: data['firmwareVersion'] as String?,
      status: data['status'] as String?,
      lastSeenAt: data['lastSeenAt'] != null ? DateTime.parse(data['lastSeenAt'] as String) : null,
    );
  }

  @override
  Future<void> updateDeviceStatus(String deviceId, String status) async {
    await _remoteDataSource.updateDeviceStatus(deviceId, status);
  }

  @override
  Future<DeviceConfig?> getStoredDevice() async {
    return _secureStorage.getDeviceConfig();
  }

  @override
  Future<void> saveStoredDevice(DeviceConfig device) async {
    await _secureStorage.saveDeviceConfig(device);
  }

  @override
  Future<void> clearStoredDevice() async {
    await _secureStorage.clearDeviceConfig();
  }

  @override
  Future<bool> isDeviceRegistered() async {
    final device = await _secureStorage.getDeviceConfig();
    return device != null;
  }
}
