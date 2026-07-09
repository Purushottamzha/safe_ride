import 'package:flutter_test/flutter_test.dart';
import 'package:door_scanner/data/datasources/mqtt/mqtt_topic_provider.dart';

void main() {
  late MqttTopicProvider provider;

  setUp(() {
    provider = MqttTopicProvider(
      schoolId: 'school-1',
      busId: 'bus-42',
      deviceId: 'dev-abc',
    );
  });

  group('scan topic', () {
    test('should return correct scan topic', () {
      expect(provider.topicScan, 'saferide/school-1/bus/bus-42/scan');
    });
  });

  group('location topic', () {
    test('should return correct location topic', () {
      expect(provider.topicLocation, 'saferide/school-1/bus/bus-42/location');
    });
  });

  group('heartbeat topic', () {
    test('should return correct heartbeat topic', () {
      expect(provider.topicHeartbeat, 'saferide/school-1/bus/bus-42/heartbeat');
    });
  });

  group('command topic', () {
    test('should return correct command topic', () {
      expect(provider.topicCommand, 'saferide/school-1/bus/bus-42/command');
    });
  });

  group('status topic', () {
    test('should return correct status topic', () {
      expect(provider.topicStatus, 'saferide/device/dev-abc/status');
    });
  });

  group('eventTopic', () {
    test('should generate correct topic for custom event type', () {
      expect(provider.eventTopic('test'), 'saferide/school-1/bus/bus-42/test');
    });

    test('should handle empty strings', () {
      final emptyProvider = MqttTopicProvider(
        schoolId: '',
        busId: '',
        deviceId: '',
      );
      expect(emptyProvider.eventTopic('scan'), 'saferide//bus//scan');
    });
  });
}
