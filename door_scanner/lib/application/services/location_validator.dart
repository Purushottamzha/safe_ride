import 'package:geolocator/geolocator.dart';
import 'dart:math';

class LocationValidationResult {
  final bool valid;
  final String? reason;

  const LocationValidationResult({required this.valid, this.reason});

  static const accepted = LocationValidationResult(valid: true);
  static LocationValidationResult rejected(String reason) =>
      LocationValidationResult(valid: false, reason: reason);
}

class LocationValidator {
  LocationValidator._();

  static const double maxAccuracy = 50.0;
  static const double maxSpeed = 100.0;
  static const double minLatitude = -90.0;
  static const double maxLatitude = 90.0;
  static const double minLongitude = -180.0;
  static const double maxLongitude = 180.0;
  static const double minDistanceDelta = 1.0;
  static const double maxJumpDistance = 200.0;

  static double _haversineDistance(Position a, Position b) {
    const R = 6371000.0;
    final dLat = _toRadians(b.latitude - a.latitude);
    final dLon = _toRadians(b.longitude - a.longitude);
    final lat1 = _toRadians(a.latitude);
    final lat2 = _toRadians(b.latitude);
    final h = sin(dLat / 2) * sin(dLat / 2) +
        sin(dLon / 2) * sin(dLon / 2) * cos(lat1) * cos(lat2);
    return R * 2 * atan2(sqrt(h), sqrt(1 - h));
  }

  static double _toRadians(double deg) => deg * pi / 180.0;

  static LocationValidationResult validate(
    Position position, {
    Position? lastPosition,
    DateTime? lastTimestamp,
  }) {
    if (position.latitude < minLatitude || position.latitude > maxLatitude) {
      return LocationValidationResult.rejected(
          'Latitude ${position.latitude} out of bounds');
    }

    if (position.longitude < minLongitude || position.longitude > maxLongitude) {
      return LocationValidationResult.rejected(
          'Longitude ${position.longitude} out of bounds');
    }

    if (position.accuracy > maxAccuracy) {
      return LocationValidationResult.rejected(
          'Accuracy ${position.accuracy}m exceeds ${maxAccuracy}m limit');
    }

    if (position.speed > maxSpeed) {
      return LocationValidationResult.rejected(
          'Speed ${position.speed}m/s exceeds ${maxSpeed}m/s limit');
    }

    if (lastPosition != null) {
      final distance = _haversineDistance(lastPosition, position);

      if (distance < minDistanceDelta) {
        return LocationValidationResult.rejected(
            'Distance ${distance.toStringAsFixed(1)}m below ${minDistanceDelta}m threshold');
      }

      if (distance > maxJumpDistance && lastTimestamp != null) {
        final elapsed = position.timestamp.difference(lastTimestamp);
        if (elapsed.inSeconds < 5) {
          return LocationValidationResult.rejected(
              'Jump ${distance.toStringAsFixed(0)}m exceeds ${maxJumpDistance}m limit');
        }
      }
    }

    return LocationValidationResult.accepted;
  }
}
