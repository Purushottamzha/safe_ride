import '../entities/device_config.dart';

abstract class IDeviceRepository {
  Future<DeviceConfig> register({
    required String name,
    required String type,
    String? busId,
    String? schoolId,
    String? firmwareVersion,
  });
  Future<DeviceConfig> getDeviceById(String deviceId);
  Future<void> updateDeviceStatus(String deviceId, String status);
  Future<DeviceConfig?> getStoredDevice();
  Future<void> saveStoredDevice(DeviceConfig device);
  Future<void> clearStoredDevice();
  Future<bool> isDeviceRegistered();
}
