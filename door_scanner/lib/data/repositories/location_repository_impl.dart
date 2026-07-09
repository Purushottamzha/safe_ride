import '../../domain/repositories/i_location_repository.dart';
import '../datasources/local/location_local_datasource.dart';

class LocationRepositoryImpl implements ILocationRepository {
  final LocationLocalDataSource _local;

  LocationRepositoryImpl({LocationLocalDataSource? localDataSource})
      : _local = localDataSource ?? LocationLocalDataSource();

  @override
  Future<void> insertLocation(Object ping) async {
    final data = ping as Map<String, dynamic>;
    await _local.insertLocation({
      'eventId': data['eventId'] as String,
      'latitude': data['latitude'] as double,
      'longitude': data['longitude'] as double,
      'accuracy': data['accuracy'] as double?,
      'speed': data['speed'] as double?,
      'heading': data['heading'] as double?,
      'timestamp': data['timestamp'] as DateTime? ?? DateTime.now(),
      'syncStatus': 'pending',
    });
  }

  @override
  Future<List<Object>> getUnsyncedLocations({int limit = 50}) async {
    final results = await _local.getUnsynced(limit: limit);
    return results.map((e) => e as Object).toList();
  }

  @override
  Future<void> markSynced(String eventId) async {
    await _local.markSyncedByEventId(eventId);
  }

  @override
  Future<int> countUnsynced() async {
    final all = await _local.getUnsynced(limit: 100000);
    return all.length;
  }
}
