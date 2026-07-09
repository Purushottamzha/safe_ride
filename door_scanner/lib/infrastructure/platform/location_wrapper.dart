import 'package:geolocator/geolocator.dart';

class LocationWrapper {
  LocationWrapper._();

  static final LocationWrapper instance = LocationWrapper._();

  Future<bool> isLocationServiceEnabled() =>
      Geolocator.isLocationServiceEnabled();

  Future<LocationPermission> checkPermission() =>
      Geolocator.checkPermission();

  Future<LocationPermission> requestPermission() =>
      Geolocator.requestPermission();

  Future<Position> getCurrentPosition({LocationAccuracy accuracy = LocationAccuracy.high}) =>
      Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: accuracy,
        ),
      );

  Stream<Position> getPositionStream({
    LocationAccuracy accuracy = LocationAccuracy.high,
    int distanceFilter = 0,
  }) =>
      Geolocator.getPositionStream(
        locationSettings: LocationSettings(
          accuracy: accuracy,
          distanceFilter: distanceFilter,
        ),
      );

  static bool hasPermission(LocationPermission permission) =>
      permission == LocationPermission.always ||
      permission == LocationPermission.whileInUse;

  static bool isDenied(LocationPermission permission) =>
      permission == LocationPermission.denied;

  static bool isPermanentlyDenied(LocationPermission permission) =>
      permission == LocationPermission.deniedForever;
}
