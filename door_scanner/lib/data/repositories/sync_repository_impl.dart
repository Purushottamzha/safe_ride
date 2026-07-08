import '../../domain/repositories/i_sync_repository.dart';

class SyncRepositoryImpl implements ISyncRepository {
  @override
  Future<void> syncAll() async {}

  @override
  Future<int> getUnsyncedCount() async => 0;
}
