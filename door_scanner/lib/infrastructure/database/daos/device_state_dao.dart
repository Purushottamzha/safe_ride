import 'package:drift/drift.dart';
import '../app_database.dart';

class DeviceStateDao extends DatabaseAccessor<AppDatabase> {
  DeviceStateDao(super.db);

  Future<void> upsert(String key, String value) async {
    final existing = await get(key);
    if (existing != null) {
      await customUpdate(
        'UPDATE device_state SET value = ?, updated_at = ? WHERE key = ?',
        variables: [
          Variable.withString(value),
          Variable.withDateTime(DateTime.now()),
          Variable.withString(key),
        ],
      );
    } else {
      await customInsert('INSERT INTO device_state (key, value, updated_at) VALUES (?, ?, ?)',
          variables: [
            Variable.withString(key),
            Variable.withString(value),
            Variable.withDateTime(DateTime.now()),
          ]);
    }
  }

  Future<String?> get(String key) async {
    final result = await customSelect(
      'SELECT value FROM device_state WHERE key = ?',
      variables: [Variable.withString(key)],
    ).get();
    if (result.isEmpty) return null;
    return result.first.data['value'] as String?;
  }

  Future<Map<String, String>> getAll() async {
    final result = await customSelect('SELECT key, value FROM device_state').get();
    return {for (final row in result) row.data['key'] as String: row.data['value'] as String};
  }

  Future<void> remove(String key) async {
    await customUpdate('DELETE FROM device_state WHERE key = ?',
        variables: [Variable.withString(key)]);
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM device_state');
  }
}
