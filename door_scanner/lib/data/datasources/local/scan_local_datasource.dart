import '../../../infrastructure/database/app_database.dart';
import '../../../infrastructure/database/daos/scan_event_dao.dart';

class ScanLocalDataSource {
  ScanLocalDataSource({AppDatabase? database})
      : _dao = database?.scanEventDao ?? AppDatabase.instance.scanEventDao;

  final ScanEventDao _dao;

  Future<void> insertScan(Map<String, dynamic> data) async {
    await _dao.insert(data);
  }

  Future<List<Map<String, dynamic>>> getUnsynced({int limit = 50}) async {
    return _dao.getUnsynced(limit: limit);
  }

  Future<void> markSyncedByEventId(String eventId) async {
    await _dao.markSyncedByEventId(eventId);
  }

  Future<int> countUnsynced() async {
    return _dao.length;
  }
}
