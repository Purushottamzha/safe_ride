class DateTimeUtils {
  DateTimeUtils._();
  static String toIso8601(DateTime dt) => dt.toUtc().toIso8601String();
  static DateTime fromIso8601(String iso) => DateTime.parse(iso).toLocal();
  static String formatShort(DateTime dt) => '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
}
