import 'package:drift/drift.dart';
import '../app_database.dart';

class ScanEventDao extends DatabaseAccessor<AppDatabase> {
  ScanEventDao(super.db);

  Future<void> insert(Map<String, dynamic> data) async {
    await customInsert('INSERT INTO scan_events (event_id, student_id, trip_id, scan_type, timestamp, sync_status) '
        'VALUES (?, ?, ?, ?, ?, ?)',
        variables: [
      Variable.withString(data['eventId'] as String),
      Variable.withString(data['studentId'] as String? ?? ''),
      Variable.withString(data['tripId'] as String? ?? ''),
      Variable.withString(data['scanType'] as String? ?? ''),
      Variable.withDateTime(data['timestamp'] as DateTime? ?? DateTime.now()),
      Variable.withString(data['syncStatus'] as String? ?? 'pending'),
    ]);
  }

  Future<List<Map<String, dynamic>>> getUnsynced({int limit = 50}) async {
    final result = await customSelect(
      'SELECT * FROM scan_events WHERE sync_status = ? LIMIT ?',
      variables: [Variable.withString('pending'), Variable.withInt(limit)],
    ).get();
    return result.map((row) => row.data).toList();
  }

  Future<void> markSynced(int id) async {
    await customUpdate(
      'UPDATE scan_events SET sync_status = ? WHERE id = ?',
      variables: [Variable.withString('synced'), Variable.withInt(id)],
    );
  }

  Future<void> markSyncedByEventId(String eventId) async {
    await customUpdate(
      'UPDATE scan_events SET sync_status = ? WHERE event_id = ?',
      variables: [Variable.withString('synced'), Variable.withString(eventId)],
    );
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final result = await customSelect('SELECT * FROM scan_events').get();
    return result.map((row) => row.data).toList();
  }

  Future<int> get length async {
    final result = await customSelect('SELECT COUNT(*) as cnt FROM scan_events').get();
    return result.first.data['cnt'] as int;
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM scan_events');
  }
}
