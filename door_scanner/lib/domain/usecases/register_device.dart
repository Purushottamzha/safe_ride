import '../repositories/i_device_repository.dart';
import '../entities/device_config.dart';

class RegisterDeviceUseCase {
  final IDeviceRepository _repository;
  RegisterDeviceUseCase(this._repository);

  Future<DeviceConfig> call({
    required String name,
    required String type,
    String? busId,
    String? schoolId,
    String? firmwareVersion,
  }) {
    if (name.trim().isEmpty) throw ArgumentError('Device name is required');
    if (type.trim().isEmpty) throw ArgumentError('Device type is required');
    return _repository.register(
      name: name.trim(),
      type: type.trim(),
      busId: busId,
      schoolId: schoolId,
      firmwareVersion: firmwareVersion,
    );
  }
}
