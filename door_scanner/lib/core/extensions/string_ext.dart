extension StringExtension on String {
  bool get isValidHex => RegExp(r'^[0-9a-fA-F]+$').hasMatch(this);
  String get capitalize => isEmpty ? this : this[0].toUpperCase() + substring(1);
}
