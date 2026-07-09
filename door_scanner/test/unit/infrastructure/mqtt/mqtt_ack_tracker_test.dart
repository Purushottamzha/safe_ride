import 'package:flutter_test/flutter_test.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_ack_tracker.dart';

void main() {
  late MqttAckTracker tracker;

  setUp(() {
    tracker = MqttAckTracker.instance;
    tracker.clear();
  });

  tearDown(() {
    tracker.clear();
  });

  group('track', () {
    test('should track an event and return future', () {
      final future = tracker.track(eventId: 'event-1', topic: 'test/topic');
      expect(future, isA<Future<bool>>());
    });

    test('should return true for already acked events', () {
      tracker.onAck('event-1');
      final future = tracker.track(eventId: 'event-1', topic: 'test/topic');
      expect(future, completion(isTrue));
    });

    test('should resolve to true on ack', () async {
      final future = tracker.track(eventId: 'event-1', topic: 'test/topic');
      tracker.onAck('event-1');
      expect(await future, isTrue);
    });

    test('should resolve to false on timeout', () async {
      final future = tracker.track(
        eventId: 'event-1',
        topic: 'test/topic',
        timeout: const Duration(milliseconds: 50),
      );
      expect(await future, isFalse);
    });
  });

  group('onAck', () {
    test('should mark event as acked', () {
      tracker.onAck('event-1');
      expect(tracker.isAcked('event-1'), isTrue);
    });

    test('should complete pending future', () async {
      final future = tracker.track(eventId: 'event-1', topic: 'test/topic');
      tracker.onAck('event-1');
      expect(await future, isTrue);
    });
  });

  group('onTimeout', () {
    test('should resolve pending future to false', () async {
      final future = tracker.track(eventId: 'event-1', topic: 'test/topic');
      tracker.onTimeout('event-1');
      expect(await future, isFalse);
    });

    test('should not affect isAcked', () {
      tracker.track(eventId: 'event-1', topic: 'test/topic');
      tracker.onTimeout('event-1');
      expect(tracker.isAcked('event-1'), isFalse);
    });
  });

  group('isAcked', () {
    test('should return true for acked events', () {
      tracker.onAck('event-1');
      expect(tracker.isAcked('event-1'), isTrue);
    });

    test('should return false for unacked events', () {
      expect(tracker.isAcked('event-1'), isFalse);
    });
  });

  group('pendingCount', () {
    test('should return correct count', () {
      expect(tracker.pendingCount, 0);
      tracker.track(eventId: 'event-1', topic: 'test/topic');
      expect(tracker.pendingCount, 1);
      tracker.track(eventId: 'event-2', topic: 'test/topic');
      expect(tracker.pendingCount, 2);
      tracker.onAck('event-1');
      expect(tracker.pendingCount, 1);
    });
  });

  group('clear', () {
    test('should clear all pending and acked events', () {
      tracker.track(eventId: 'event-1', topic: 'test/topic');
      tracker.onAck('event-1');
      tracker.clear();
      expect(tracker.pendingCount, 0);
      expect(tracker.isAcked('event-1'), isFalse);
    });
  });
}
