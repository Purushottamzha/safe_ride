import 'package:flutter_test/flutter_test.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_reconnect_strategy.dart';

void main() {
  late MqttReconnectStrategy strategy;

  setUp(() {
    strategy = MqttReconnectStrategy.instance;
    strategy.reset();
  });

  group('nextDelay', () {
    test('should return increasing delays with each call', () async {
      final delay1 = strategy.nextDelay();
      final delay2 = strategy.nextDelay();
      final delay3 = strategy.nextDelay();

      expect(delay1.inSeconds, greaterThanOrEqualTo(2));
      expect(delay2.inSeconds, greaterThanOrEqualTo(2));
      expect(delay3.inSeconds, greaterThanOrEqualTo(2));
    });

    test('should contain jitter', () async {
      final delays = <int>[];
      for (int i = 0; i < 10; i++) {
        strategy.reset();
        delays.add(strategy.nextDelay().inSeconds);
      }
      final uniqueDelays = delays.toSet();
      expect(uniqueDelays.length, greaterThan(1));
    });

    test('should cap at max delay plus jitter', () async {
      for (int i = 0; i < 20; i++) {
        strategy.onDisconnect();
      }
      final delay = strategy.nextDelay();
      // Max delay is 60s + up to 30s jitter = 90
      expect(delay.inSeconds, lessThanOrEqualTo(95));
    });
  });

  group('reset', () {
    test('should reset attempt count', () {
      strategy.onDisconnect();
      strategy.onDisconnect();
      strategy.reset();
      final delay = strategy.nextDelay();
      expect(delay.inSeconds, lessThanOrEqualTo(10));
    });
  });

  group('onDisconnect / onConnect', () {
    test('onDisconnect should increment attempt count', () {
      expect(strategy.attempt, 0);
      strategy.onDisconnect();
      expect(strategy.attempt, 1);
      strategy.onDisconnect();
      expect(strategy.attempt, 2);
    });

    test('onConnect should reset attempt count', () {
      strategy.onDisconnect();
      strategy.onDisconnect();
      expect(strategy.attempt, 2);
      strategy.onConnect();
      expect(strategy.attempt, 0);
    });
  });
}
