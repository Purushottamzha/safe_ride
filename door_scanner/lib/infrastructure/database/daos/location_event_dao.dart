import 'package:drift/drift.dart';
import '../app_database.dart';

class LocationEventDao extends DatabaseAccessor<AppDatabase> {
  LocationEventDao(super.db);

  Future<void> insert(Map<String, dynamic> data) async {
    await customInsert('INSERT INTO location_events '
        '(event_id, latitude, longitude, accuracy, speed, heading, timestamp, sync_status) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)', variables: [
      Variable.withString(data['eventId'] as String),
      Variable.withReal((data['latitude'] as num).toDouble()),
      Variable.withReal((data['longitude'] as num).toDouble()),
      Variable<double>(data['accuracy'] as double?),
      Variable<double>(data['speed'] as double?),
      Variable<double>(data['heading'] as double?),
      Variable.withDateTime(data['timestamp'] as DateTime? ?? DateTime.now()),
      Variable.withString(data['syncStatus'] as String? ?? 'pending'),
    ]);
  }

  Future<List<Map<String, dynamic>>> getUnsynced({int limit = 50}) async {
    final result = await customSelect(
      'SELECT * FROM location_events WHERE sync_status = ? LIMIT ?',
      variables: [Variable.withString('pending'), Variable.withInt(limit)],
    ).get();
    return result.map((row) => row.data).toList();
  }

  Future<void> markSyncedByEventId(String eventId) async {
    await customUpdate(
      'UPDATE location_events SET sync_status = ? WHERE event_id = ?',
      variables: [Variable.withString('synced'), Variable.withString(eventId)],
    );
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final result = await customSelect('SELECT * FROM location_events').get();
    return result.map((row) => row.data).toList();
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM location_events');
  }
}
