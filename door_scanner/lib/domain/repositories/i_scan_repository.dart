abstract class IScanRepository {
  Future<void> insertScan(Object event);
  Future<List<Object>> getUnsyncedScans({int limit = 50});
  Future<void> markSynced(String eventId);
  Future<int> countUnsynced();
}
