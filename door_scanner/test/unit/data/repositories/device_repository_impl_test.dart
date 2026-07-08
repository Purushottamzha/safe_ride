import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:door_scanner/domain/entities/device_config.dart';
import 'package:door_scanner/infrastructure/storage/secure_storage.dart';
import 'package:door_scanner/data/datasources/remote/device_remote_datasource.dart';
import 'package:door_scanner/data/models/device_registration_request.dart';
import 'package:door_scanner/data/models/device_registration_response.dart';
import 'package:door_scanner/data/repositories/device_repository_impl.dart';

class MockDeviceRemoteDataSource extends Mock implements DeviceRemoteDataSource {}
class MockSecureStorage extends Mock implements SecureStorage {}

void main() {
  setUpAll(() {
    registerFallbackValue(const DeviceRegistrationRequest(name: '', type: ''));
    registerFallbackValue(const DeviceConfig(deviceId: '', name: '', type: '', apiKey: ''));
  });
  late MockDeviceRemoteDataSource mockDataSource;
  late MockSecureStorage mockStorage;
  late DeviceRepositoryImpl repository;

  setUp(() {
    mockDataSource = MockDeviceRemoteDataSource();
    mockStorage = MockSecureStorage();
    repository = DeviceRepositoryImpl(remoteDataSource: mockDataSource, secureStorage: mockStorage);
  });

  group('register', () {
    test('should call datasource and save device config', () async {
      const response = DeviceRegistrationResponse(
        id: 'dev-1',
        name: 'Test Device',
        type: 'ESP32_CAM',
        apiKey: 'key-123',
        message: 'Save this key',
      );
      when(() => mockDataSource.registerDevice(any())).thenAnswer((_) async => response);
      when(() => mockStorage.saveDeviceConfig(any())).thenAnswer((_) async => {});

      final result = await repository.register(
        name: 'Test Device',
        type: 'ESP32_CAM',
      );

      expect(result.deviceId, 'dev-1');
      expect(result.name, 'Test Device');
      expect(result.type, 'ESP32_CAM');
      expect(result.apiKey, 'key-123');
      verify(() => mockDataSource.registerDevice(any())).called(1);
      verify(() => mockStorage.saveDeviceConfig(any())).called(1);
    });
  });

  group('getStoredDevice', () {
    test('should return stored device config', () async {
      const config = DeviceConfig(
        deviceId: 'dev-1',
        name: 'Test Device',
        type: 'ESP32_CAM',
        apiKey: 'key-123',
      );
      when(() => mockStorage.getDeviceConfig()).thenAnswer((_) async => config);

      final result = await repository.getStoredDevice();

      expect(result, isNotNull);
      expect(result!.deviceId, 'dev-1');
    });

    test('should return null when no device stored', () async {
      when(() => mockStorage.getDeviceConfig()).thenAnswer((_) async => null);

      final result = await repository.getStoredDevice();

      expect(result, isNull);
    });
  });

  group('isDeviceRegistered', () {
    test('should return true when device is stored', () async {
      when(() => mockStorage.getDeviceConfig()).thenAnswer((_) async =>
        const DeviceConfig(deviceId: 'dev-1', name: 'Test', type: 'ESP32_CAM', apiKey: 'key'),
      );

      final result = await repository.isDeviceRegistered();

      expect(result, isTrue);
    });

    test('should return false when no device stored', () async {
      when(() => mockStorage.getDeviceConfig()).thenAnswer((_) async => null);

      final result = await repository.isDeviceRegistered();

      expect(result, isFalse);
    });
  });
}
