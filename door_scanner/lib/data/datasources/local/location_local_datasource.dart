import '../../../infrastructure/database/app_database.dart';
import '../../../infrastructure/database/daos/location_event_dao.dart';

class LocationLocalDataSource {
  LocationLocalDataSource({AppDatabase? database})
      : _dao = database?.locationEventDao ?? AppDatabase.instance.locationEventDao;

  final LocationEventDao _dao;

  Future<void> insertLocation(Map<String, dynamic> data) async {
    await _dao.insert(data);
  }

  Future<List<Map<String, dynamic>>> getUnsynced({int limit = 50}) async {
    return _dao.getUnsynced(limit: limit);
  }

  Future<void> markSyncedByEventId(String eventId) async {
    await _dao.markSyncedByEventId(eventId);
  }
}
