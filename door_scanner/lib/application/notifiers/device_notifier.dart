import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/device_config.dart';
import '../providers/device_provider.dart';

enum DeviceStatus { initial, loading, registered, notRegistered, error }

class DeviceState {
  final DeviceStatus status;
  final DeviceConfig? device;
  final String? error;
  const DeviceState({required this.status, this.device, this.error});
  const DeviceState.initial() : status = DeviceStatus.initial, device = null, error = null;
  const DeviceState.loading() : status = DeviceStatus.loading, device = null, error = null;
  const DeviceState.registered(DeviceConfig d) : status = DeviceStatus.registered, device = d, error = null;
  const DeviceState.notRegistered() : status = DeviceStatus.notRegistered, device = null, error = null;
  const DeviceState.error(String e) : status = DeviceStatus.error, device = null, error = e;
}

class DeviceNotifier extends AsyncNotifier<DeviceState> {
  @override
  Future<DeviceState> build() async {
    try {
      final device = await ref.read(deviceRepositoryProvider).getStoredDevice();
      if (device != null) return DeviceState.registered(device);
      return const DeviceState.notRegistered();
    } catch (_) {
      return const DeviceState.notRegistered();
    }
  }

  Future<void> register({
    required String name,
    required String type,
    String? busId,
    String? schoolId,
    String? firmwareVersion,
  }) async {
    state = const AsyncValue.data(DeviceState.loading());
    try {
      final useCase = ref.read(registerDeviceUseCaseProvider);
      final device = await useCase(
        name: name,
        type: type,
        busId: busId,
        schoolId: schoolId,
        firmwareVersion: firmwareVersion,
      );
      state = AsyncValue.data(DeviceState.registered(device));
    } catch (e) {
      state = AsyncValue.data(DeviceState.error(e.toString()));
    }
  }

  Future<void> checkRegistration() async {
    state = const AsyncValue.data(DeviceState.loading());
    try {
      final device = await ref.read(deviceRepositoryProvider).getStoredDevice();
      if (device != null) {
        state = AsyncValue.data(DeviceState.registered(device));
      } else {
        state = const AsyncValue.data(DeviceState.notRegistered());
      }
    } catch (_) {
      state = const AsyncValue.data(DeviceState.notRegistered());
    }
  }
}
