import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:door_scanner/application/services/location_validator.dart';

Position _pos({
  double lat = 27.7172,
  double lng = 85.3240,
  double accuracy = 10,
  double speed = 0,
}) {
  return Position(
    latitude: lat,
    longitude: lng,
    accuracy: accuracy,
    speed: speed,
    speedAccuracy: 0,
    timestamp: DateTime.now(),
    altitude: 0,
    altitudeAccuracy: 0,
    heading: 0,
    headingAccuracy: 0,
  );
}

void main() {
  group('bounds check', () {
    test('valid coordinates pass', () {
      final result = LocationValidator.validate(_pos());
      expect(result.valid, isTrue);
    });

    test('latitude out of bounds fails', () {
      final result = LocationValidator.validate(_pos(lat: 100));
      expect(result.valid, isFalse);
    });

    test('longitude out of bounds fails', () {
      final result = LocationValidator.validate(_pos(lng: 200));
      expect(result.valid, isFalse);
    });
  });

  group('accuracy filter', () {
    test('high accuracy passes', () {
      final result = LocationValidator.validate(_pos(accuracy: 10));
      expect(result.valid, isTrue);
    });

    test('low accuracy fails', () {
      final result = LocationValidator.validate(_pos(accuracy: 100));
      expect(result.valid, isFalse);
    });
  });

  group('speed filter', () {
    test('normal speed passes', () {
      final result = LocationValidator.validate(_pos(speed: 30));
      expect(result.valid, isTrue);
    });

    test('impossible speed fails', () {
      final result = LocationValidator.validate(_pos(speed: 500));
      expect(result.valid, isFalse);
    });
  });

  group('duplicate filter', () {
    test('identical position fails', () {
      final pos = _pos();
      final result = LocationValidator.validate(pos, lastPosition: pos);
      expect(result.valid, isFalse);
    });

    test('different position passes', () {
      final pos1 = _pos(lat: 27.7172, lng: 85.3240);
      final pos2 = _pos(lat: 27.7175, lng: 85.3245);
      final result = LocationValidator.validate(pos2, lastPosition: pos1);
      expect(result.valid, isTrue);
    });
  });
}
