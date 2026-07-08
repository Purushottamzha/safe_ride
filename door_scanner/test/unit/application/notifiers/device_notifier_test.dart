import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:door_scanner/domain/entities/device_config.dart';
import 'package:door_scanner/domain/usecases/register_device.dart';
import 'package:door_scanner/domain/repositories/i_device_repository.dart';
import 'package:door_scanner/application/notifiers/device_notifier.dart';
import 'package:door_scanner/application/providers/device_provider.dart';

class MockDeviceRepository extends Mock implements IDeviceRepository {}
class MockRegisterDeviceUseCase extends Mock implements RegisterDeviceUseCase {}

void main() {
  setUpAll(() {
    registerFallbackValue(const DeviceConfig(deviceId: '', name: '', type: '', apiKey: ''));
  });
  late MockDeviceRepository mockRepo;
  late MockRegisterDeviceUseCase mockUseCase;

  setUp(() {
    mockRepo = MockDeviceRepository();
    mockUseCase = MockRegisterDeviceUseCase();
  });

  group('build', () {
    test('should emit notRegistered when no device stored', () async {
      when(() => mockRepo.getStoredDevice()).thenAnswer((_) async => null);

      final container = ProviderContainer(overrides: [
        deviceRepositoryProvider.overrideWithValue(mockRepo),
        registerDeviceUseCaseProvider.overrideWithValue(mockUseCase),
      ]);
      final state = await container.read(deviceNotifierProvider.future);
      expect(state.status, DeviceStatus.notRegistered);
      container.dispose();
    });

    test('should emit registered when device is stored', () async {
      const config = DeviceConfig(
        deviceId: 'dev-1',
        name: 'Test',
        type: 'ESP32_CAM',
        apiKey: 'key-123',
      );
      when(() => mockRepo.getStoredDevice()).thenAnswer((_) async => config);

      final container = ProviderContainer(overrides: [
        deviceRepositoryProvider.overrideWithValue(mockRepo),
        registerDeviceUseCaseProvider.overrideWithValue(mockUseCase),
      ]);
      final state = await container.read(deviceNotifierProvider.future);
      expect(state.status, DeviceStatus.registered);
      expect(state.device?.deviceId, 'dev-1');
      container.dispose();
    });
  });

  group('register', () {
    test('should set registered on success', () async {
      const config = DeviceConfig(
        deviceId: 'dev-1',
        name: 'Test Device',
        type: 'ESP32_CAM',
        apiKey: 'key-123',
      );
      when(() => mockUseCase.call(
        name: any(named: 'name'),
        type: any(named: 'type'),
        busId: any(named: 'busId'),
        schoolId: any(named: 'schoolId'),
        firmwareVersion: any(named: 'firmwareVersion'),
      )).thenAnswer((_) async => config);
      when(() => mockRepo.getStoredDevice()).thenAnswer((_) async => null);

      final container = ProviderContainer(overrides: [
        deviceRepositoryProvider.overrideWithValue(mockRepo),
        registerDeviceUseCaseProvider.overrideWithValue(mockUseCase),
      ]);
      final notifier = container.read(deviceNotifierProvider.notifier);
      await notifier.register(name: 'Test Device', type: 'ESP32_CAM');
      final state = container.read(deviceNotifierProvider);
      state.whenOrNull(data: (s) {
        expect(s.status, DeviceStatus.registered);
        expect(s.device?.deviceId, 'dev-1');
      });
      container.dispose();
    });

    test('should set error on failure', () async {
      when(() => mockUseCase.call(
        name: any(named: 'name'),
        type: any(named: 'type'),
        busId: any(named: 'busId'),
        schoolId: any(named: 'schoolId'),
        firmwareVersion: any(named: 'firmwareVersion'),
      )).thenAnswer((_) => Future.error(Exception('Registration failed')));
      when(() => mockRepo.getStoredDevice()).thenAnswer((_) async => null);

      final container = ProviderContainer(overrides: [
        deviceRepositoryProvider.overrideWithValue(mockRepo),
        registerDeviceUseCaseProvider.overrideWithValue(mockUseCase),
      ]);
      final notifier = container.read(deviceNotifierProvider.notifier);
      await notifier.register(name: 'Test', type: 'ESP32_CAM');
      final state = container.read(deviceNotifierProvider);
      state.whenOrNull(data: (s) {
        expect(s.status, DeviceStatus.error);
      });
      container.dispose();
    });
  });
}
