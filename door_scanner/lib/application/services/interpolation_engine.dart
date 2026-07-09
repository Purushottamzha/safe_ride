import 'dart:math';
import 'package:latlong2/latlong.dart';

class InterpolationEngine {
  InterpolationEngine._();

  static const double _earthRadius = 6371000.0;

  static LatLng lerp(LatLng a, LatLng b, double t) {
    return LatLng(
      a.latitude + (b.latitude - a.latitude) * t,
      a.longitude + (b.longitude - a.longitude) * t,
    );
  }

  static LatLng catmullRom(LatLng p0, LatLng p1, LatLng p2, LatLng p3, double t) {
    final t2 = t * t;
    final t3 = t2 * t;
    return LatLng(
      0.5 * ((2 * p1.latitude) +
          (-p0.latitude + p2.latitude) * t +
          (2 * p0.latitude - 5 * p1.latitude + 4 * p2.latitude - p3.latitude) * t2 +
          (-p0.latitude + 3 * p1.latitude - 3 * p2.latitude + p3.latitude) * t3),
      0.5 * ((2 * p1.longitude) +
          (-p0.longitude + p2.longitude) * t +
          (2 * p0.longitude - 5 * p1.longitude + 4 * p2.longitude - p3.longitude) * t2 +
          (-p0.longitude + 3 * p1.longitude - 3 * p2.longitude + p3.longitude) * t3),
    );
  }

  static double bearing(LatLng from, LatLng to) {
    final dLng = (to.longitude - from.longitude) * (pi / 180);
    final lat1 = from.latitude * (pi / 180);
    final lat2 = to.latitude * (pi / 180);
    final y = sin(dLng) * cos(lat2);
    final x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLng);
    return (atan2(y, x) * (180 / pi) + 360) % 360;
  }

  static double distance(LatLng a, LatLng b) {
    final dLat = (b.latitude - a.latitude) * (pi / 180);
    final dLng = (b.longitude - a.longitude) * (pi / 180);
    final sinDLat = sin(dLat / 2);
    final sinDLng = sin(dLng / 2);
    final h = sinDLat * sinDLat +
        cos(a.latitude * (pi / 180)) * cos(b.latitude * (pi / 180)) * sinDLng * sinDLng;
    return 2 * _earthRadius * asin(sqrt(h));
  }

  static LatLng predict(LatLng current, double speed, double heading, double deltaSeconds) {
    if (speed <= 0 || deltaSeconds <= 0) return current;
    final dist = speed * deltaSeconds;
    final angularDist = dist / _earthRadius;
    final headingRad = heading * (pi / 180);
    final latRad = current.latitude * (pi / 180);
    final lngRad = current.longitude * (pi / 180);
    final sinLat = sin(latRad);
    final cosLat = cos(latRad);
    final sinAng = sin(angularDist);
    final cosAng = cos(angularDist);
    final newLat = asin(sinLat * cosAng + cosLat * sinAng * cos(headingRad));
    final newLng = lngRad + atan2(sin(headingRad) * sinAng * cosLat, cosAng - sinLat * sin(newLat));
    return LatLng(newLat * (180 / pi), newLng * (180 / pi));
  }

  static double animationDuration(double speedMps) {
    final speedKph = speedMps * 3.6;
    if (speedKph < 1) return 0;
    if (speedKph < 10) return 2.0;
    if (speedKph < 40) return 1.5;
    if (speedKph < 80) return 1.0;
    return 0.5;
  }

  static bool isInDeadZone(
      double markerScreenX, double markerScreenY, double screenWidth, double screenHeight,
      double deadZoneFraction) {
    final centerX = screenWidth / 2;
    final centerY = screenHeight / 2;
    final halfW = screenWidth * deadZoneFraction / 2;
    final halfH = screenHeight * deadZoneFraction / 2;
    return (markerScreenX - centerX).abs() <= halfW &&
        (markerScreenY - centerY).abs() <= halfH;
  }
}
