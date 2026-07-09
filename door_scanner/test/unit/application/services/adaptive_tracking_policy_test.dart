import 'package:flutter_test/flutter_test.dart';
import 'package:door_scanner/application/services/adaptive_tracking_policy.dart';

void main() {
  group('forSpeed', () {
    test('parked when speed < 0.5 m/s', () {
      final policy = TrackingPolicy.forSpeed(0.1);
      expect(policy.interval, TrackingPolicy.parked.interval);
      expect(policy.distanceFilter, TrackingPolicy.parked.distanceFilter);
    });

    test('slow when speed between 0.5 and 5 m/s', () {
      final policy = TrackingPolicy.forSpeed(2.0);
      expect(policy.interval, TrackingPolicy.slow.interval);
      expect(policy.distanceFilter, TrackingPolicy.slow.distanceFilter);
    });

    test('moving when speed between 5 and 15 m/s', () {
      final policy = TrackingPolicy.forSpeed(10.0);
      expect(policy.interval, TrackingPolicy.moving.interval);
      expect(policy.distanceFilter, TrackingPolicy.moving.distanceFilter);
    });

    test('active when speed > 15 m/s', () {
      final policy = TrackingPolicy.forSpeed(20.0);
      expect(policy.interval, TrackingPolicy.active.interval);
      expect(policy.distanceFilter, TrackingPolicy.active.distanceFilter);
    });
  });
}
