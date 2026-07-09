import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:door_scanner/domain/entities/mqtt_connection_state.dart';
import 'package:door_scanner/domain/repositories/i_mqtt_repository.dart';
import 'package:door_scanner/application/notifiers/mqtt_notifier.dart';
import 'package:door_scanner/application/providers/mqtt_provider.dart';

class MockMqttRepository extends Mock implements IMqttRepository {}

void main() {
  late MockMqttRepository mockRepo;

  setUp(() {
    mockRepo = MockMqttRepository();
    registerFallbackValue(MqttConnectionState.disconnected);
  });

  group('connect', () {
    test('should set connecting then connected on success', () async {
      when(() => mockRepo.connect()).thenAnswer((_) async => true);
      when(() => mockRepo.connectionState).thenAnswer((_) => const Stream.empty());

      final container = ProviderContainer(overrides: [
        mqttRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(mqttNotifierProvider.notifier);

      await notifier.connect();

      expect(container.read(mqttNotifierProvider).connectionState,
        MqttConnectionState.connected);
      expect(container.read(mqttNotifierProvider).isConnected, isTrue);
      container.dispose();
    });

    test('should set error state on repeated failure', () async {
      when(() => mockRepo.connect()).thenAnswer((_) async => false);
      when(() => mockRepo.connectionState).thenAnswer((_) => const Stream.empty());

      final container = ProviderContainer(overrides: [
        mqttRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(mqttNotifierProvider.notifier);

      // Trigger multiple retries
      for (int i = 0; i < 6; i++) {
        await notifier.connect();
      }

      expect(container.read(mqttNotifierProvider).connectionState,
        MqttConnectionState.error);
      expect(container.read(mqttNotifierProvider).isConnected, isFalse);
      container.dispose();
    });
  });

  group('disconnect', () {
    test('should reset to disconnected state', () async {
      when(() => mockRepo.connect()).thenAnswer((_) async => true);
      when(() => mockRepo.disconnect()).thenReturn(null);
      when(() => mockRepo.connectionState).thenAnswer((_) => const Stream.empty());

      final container = ProviderContainer(overrides: [
        mqttRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(mqttNotifierProvider.notifier);

      await notifier.connect();
      notifier.disconnect();

      expect(container.read(mqttNotifierProvider).connectionState,
        MqttConnectionState.disconnected);
      expect(container.read(mqttNotifierProvider).isConnected, isFalse);
      container.dispose();
    });
  });

  group('updateConnectionState', () {
    test('should update state correctly', () {
      final container = ProviderContainer(overrides: [
        mqttRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(mqttNotifierProvider.notifier);

      notifier.updateConnectionState(MqttConnectionState.connected);

      expect(container.read(mqttNotifierProvider).isConnected, isTrue);
      container.dispose();
    });

    test('should set isConnected false for disconnected', () {
      final container = ProviderContainer(overrides: [
        mqttRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(mqttNotifierProvider.notifier);

      notifier.updateConnectionState(MqttConnectionState.disconnected);

      expect(container.read(mqttNotifierProvider).isConnected, isFalse);
      container.dispose();
    });
  });
}
