extension MapExtension on Map<String, dynamic> {
  String getString(String key) => this[key] as String? ?? '';
  int getInt(String key) => this[key] as int? ?? 0;
  double getDouble(String key) => this[key] as double? ?? 0.0;
  bool getBool(String key) => this[key] as bool? ?? false;
}
