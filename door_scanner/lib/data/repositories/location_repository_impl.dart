import '../../domain/repositories/i_location_repository.dart';

class LocationRepositoryImpl implements ILocationRepository {
  @override
  Future<void> insertLocation(Object ping) async {}

  @override
  Future<List<Object>> getUnsyncedLocations({int limit = 50}) async => [];

  @override
  Future<void> markSynced(String eventId) async {}

  @override
  Future<int> countUnsynced() async => 0;
}
