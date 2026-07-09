import '../../infrastructure/platform/location_wrapper.dart';

class PermissionHelper {
  PermissionHelper._();
  static Future<bool> requestCamera() async => false;
  static Future<bool> requestLocation() async {
    final permission = await LocationWrapper.instance.requestPermission();
    return LocationWrapper.hasPermission(permission);
  }
  static Future<bool> requestStorage() async => false;
  static Future<bool> requestNotifications() async => false;
}
