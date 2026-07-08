extension DateTimeExtension on DateTime {
  String get toSafeRideIso => toUtc().toIso8601String();
  bool get isToday => DateTime.now().difference(this).inDays == 0;
}
