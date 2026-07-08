class PermissionHelper {
  PermissionHelper._();
  static Future<bool> requestCamera() async => false;
  static Future<bool> requestLocation() async => false;
  static Future<bool> requestStorage() async => false;
  static Future<bool> requestNotifications() async => false;
}
