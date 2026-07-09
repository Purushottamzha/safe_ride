import 'package:drift/drift.dart';
import '../app_database.dart';

class SyncMetadataDao extends DatabaseAccessor<AppDatabase> {
  SyncMetadataDao(super.db);

  Future<void> upsert(String entityType, String entityId, DateTime lastSynced, String status) async {
    final existing = await customSelect(
      'SELECT id FROM sync_metadata WHERE entity_type = ? AND entity_id = ?',
      variables: [Variable.withString(entityType), Variable.withString(entityId)],
    ).get();

    if (existing.isNotEmpty) {
      await customUpdate(
        'UPDATE sync_metadata SET last_synced = ?, status = ?, updated_at = ? WHERE entity_type = ? AND entity_id = ?',
        variables: [
          Variable.withDateTime(lastSynced),
          Variable.withString(status),
          Variable.withDateTime(DateTime.now()),
          Variable.withString(entityType),
          Variable.withString(entityId),
        ],
      );
    } else {
      await customInsert('INSERT INTO sync_metadata '
          '(entity_type, entity_id, last_synced, status, updated_at) VALUES (?, ?, ?, ?, ?)',
          variables: [
            Variable.withString(entityType),
            Variable.withString(entityId),
            Variable.withDateTime(lastSynced),
            Variable.withString(status),
            Variable.withDateTime(DateTime.now()),
          ]);
    }
  }

  Future<Map<String, dynamic>?> get(String entityType, String entityId) async {
    final result = await customSelect(
      'SELECT * FROM sync_metadata WHERE entity_type = ? AND entity_id = ?',
      variables: [Variable.withString(entityType), Variable.withString(entityId)],
    ).get();
    if (result.isEmpty) return null;
    return result.first.data;
  }

  Future<void> remove(String entityType, String entityId) async {
    await customUpdate('DELETE FROM sync_metadata WHERE entity_type = ? AND entity_id = ?',
        variables: [Variable.withString(entityType), Variable.withString(entityId)]);
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM sync_metadata');
  }
}
