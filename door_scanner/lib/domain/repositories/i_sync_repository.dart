abstract class ISyncRepository {
  Future<void> syncAll();
  Future<int> getUnsyncedCount();
}
