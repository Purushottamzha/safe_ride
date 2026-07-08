abstract class ILocationRepository {
  Future<void> insertLocation(Object ping);
  Future<List<Object>> getUnsyncedLocations({int limit = 50});
  Future<void> markSynced(String eventId);
  Future<int> countUnsynced();
}
