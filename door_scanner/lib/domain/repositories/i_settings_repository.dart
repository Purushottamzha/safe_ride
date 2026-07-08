abstract class ISettingsRepository {
  Future<int> getScanInterval();
  Future<void> setScanInterval(int seconds);
  Future<int> getGpsInterval();
  Future<void> setGpsInterval(int seconds);
}
