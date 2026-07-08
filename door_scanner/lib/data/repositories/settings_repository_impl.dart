import '../../domain/repositories/i_settings_repository.dart';

class SettingsRepositoryImpl implements ISettingsRepository {
  @override
  Future<int> getScanInterval() async => 10;

  @override
  Future<void> setScanInterval(int seconds) async {}

  @override
  Future<int> getGpsInterval() async => 10;

  @override
  Future<void> setGpsInterval(int seconds) async {}
}
