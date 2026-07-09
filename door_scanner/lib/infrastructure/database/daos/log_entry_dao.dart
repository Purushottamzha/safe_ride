import 'package:drift/drift.dart';
import '../app_database.dart';

class LogEntryDao extends DatabaseAccessor<AppDatabase> {
  LogEntryDao(super.db);

  Future<void> insert(Map<String, dynamic> data) async {
    await customInsert(
      'INSERT INTO log_entries '
      '(timestamp, level, category, event_id, trip_id, message, metadata_json) '
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
      variables: [
        Variable.withDateTime(data['timestamp'] as DateTime? ?? DateTime.now()),
        Variable.withString(data['level'] as String? ?? 'info'),
        Variable.withString(data['category'] as String? ?? 'general'),
        Variable<String>(data['eventId'] as String?),
        Variable<String>(data['tripId'] as String?),
        Variable.withString(data['message'] as String? ?? ''),
        Variable<String>(data['metadataJson'] as String?),
      ],
    );
  }

  Future<List<Map<String, dynamic>>> getRecent({int limit = 100, String? category, String? level}) async {
    String sql = 'SELECT * FROM log_entries WHERE 1=1';
    final variables = <Variable>[];
    if (category != null) {
      sql += ' AND category = ?';
      variables.add(Variable.withString(category));
    }
    if (level != null) {
      sql += ' AND level = ?';
      variables.add(Variable.withString(level));
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    variables.add(Variable.withInt(limit));
    final result = await customSelect(sql, variables: variables).get();
    return result.map((r) => r.data).toList();
  }

  Future<List<Map<String, dynamic>>> getByTripId(String tripId, {int limit = 1000}) async {
    final result = await customSelect(
      'SELECT * FROM log_entries WHERE trip_id = ? ORDER BY id ASC LIMIT ?',
      variables: [Variable.withString(tripId), Variable.withInt(limit)],
    ).get();
    return result.map((r) => r.data).toList();
  }

  Future<void> cleanOldEntries({int keepCount = 10000}) async {
    await customUpdate(
      'DELETE FROM log_entries WHERE id NOT IN (SELECT id FROM log_entries ORDER BY id DESC LIMIT ?)',
      variables: [Variable.withInt(keepCount)],
    );
  }

  Future<int> get length async {
    final result = await customSelect('SELECT COUNT(*) as cnt FROM log_entries').get();
    return result.first.data['cnt'] as int;
  }

  Future<int> countByLevel(String level) async {
    final result = await customSelect(
      'SELECT COUNT(*) as cnt FROM log_entries WHERE level = ?',
      variables: [Variable.withString(level)],
    ).get();
    return result.first.data['cnt'] as int;
  }

  Future<int> countByCategory(String category) async {
    final result = await customSelect(
      'SELECT COUNT(*) as cnt FROM log_entries WHERE category = ?',
      variables: [Variable.withString(category)],
    ).get();
    return result.first.data['cnt'] as int;
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final result = await customSelect('SELECT * FROM log_entries ORDER BY id ASC').get();
    return result.map((r) => r.data).toList();
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM log_entries');
  }
}
