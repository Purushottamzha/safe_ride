class PreferencesStorage {
  static final PreferencesStorage instance = PreferencesStorage._();
  PreferencesStorage._();
  Future<String?> get(String key) async => null;
  Future<void> set(String key, String value) async {}
}
