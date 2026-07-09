import 'package:drift/drift.dart';
import '../app_database.dart';

class HeartbeatDao extends DatabaseAccessor<AppDatabase> {
  HeartbeatDao(super.db);

  Future<void> insert(Map<String, dynamic> data) async {
    await customInsert('INSERT INTO heartbeat_events '
        '(event_id, battery_level, is_charging, connectivity_type, gps_status, app_version, device_model, timestamp, sync_status) '
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', variables: [
      Variable.withString(data['eventId'] as String),
      Variable<int>(data['batteryLevel'] as int?),
      Variable.withBool(data['isCharging'] as bool? ?? false),
      Variable.withString(data['connectivityType'] as String? ?? ''),
      Variable.withString(data['gpsStatus'] as String? ?? ''),
      Variable.withString(data['appVersion'] as String? ?? ''),
      Variable.withString(data['deviceModel'] as String? ?? ''),
      Variable.withDateTime(data['timestamp'] as DateTime? ?? DateTime.now()),
      Variable.withString(data['syncStatus'] as String? ?? 'pending'),
    ]);
  }

  Future<List<Map<String, dynamic>>> getUnsynced({int limit = 50}) async {
    final result = await customSelect(
      'SELECT * FROM heartbeat_events WHERE sync_status = ? LIMIT ?',
      variables: [Variable.withString('pending'), Variable.withInt(limit)],
    ).get();
    return result.map((row) => row.data).toList();
  }

  Future<void> markSyncedByEventId(String eventId) async {
    await customUpdate(
      'UPDATE heartbeat_events SET sync_status = ? WHERE event_id = ?',
      variables: [Variable.withString('synced'), Variable.withString(eventId)],
    );
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM heartbeat_events');
  }
}
