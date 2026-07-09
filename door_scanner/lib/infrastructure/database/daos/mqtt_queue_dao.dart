import 'package:drift/drift.dart';
import '../app_database.dart';

class MqttQueueDao extends DatabaseAccessor<AppDatabase> {
  MqttQueueDao(super.db);

  Future<void> insertOrReplace(Map<String, dynamic> entry) async {
    await customInsert(
      'INSERT OR REPLACE INTO mqtt_queue '
      '(event_id, topic, payload, qos, status, retry_count, max_retries, created_at, updated_at, last_attempt, next_retry, last_error) '
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      variables: [
        Variable.withString(entry['eventId'] as String),
        Variable.withString(entry['topic'] as String? ?? ''),
        Variable.withString(entry['payload'] as String? ?? ''),
        Variable.withInt(entry['qos'] as int? ?? 1),
        Variable.withString(entry['status'] as String? ?? 'queued'),
        Variable.withInt(entry['retryCount'] as int? ?? 0),
        Variable.withInt(entry['maxRetries'] as int? ?? 5),
        Variable.withDateTime(entry['createdAt'] as DateTime? ?? DateTime.now()),
        Variable.withDateTime(DateTime.now()),
        Variable<DateTime>(entry['lastAttempt'] as DateTime?),
        Variable<DateTime>(entry['nextRetry'] as DateTime?),
        Variable<String>(entry['lastError'] as String?),
      ],
    );
  }

  Future<List<Map<String, dynamic>>> getByStatus(String status) async {
    final result = await customSelect(
      'SELECT * FROM mqtt_queue WHERE status = ? ORDER BY created_at ASC',
      variables: [Variable.withString(status)],
    ).get();
    return result.map((r) => r.data).toList();
  }

  Future<List<Map<String, dynamic>>> getByStatuses(List<String> statuses) async {
    final placeholders = statuses.map((_) => '?').join(',');
    final result = await customSelect(
      'SELECT * FROM mqtt_queue WHERE status IN ($placeholders) ORDER BY created_at ASC',
      variables: [for (final s in statuses) Variable.withString(s)],
    ).get();
    return result.map((r) => r.data).toList();
  }

  Future<Map<String, dynamic>?> getByEventId(String eventId) async {
    final result = await customSelect(
      'SELECT * FROM mqtt_queue WHERE event_id = ?',
      variables: [Variable.withString(eventId)],
    ).get();
    if (result.isEmpty) return null;
    return result.first.data;
  }

  Future<void> updateStatus(String eventId, String status, {String? error, DateTime? nextRetry}) async {
    await customUpdate(
      'UPDATE mqtt_queue SET status = ?, last_error = ?, next_retry = ?, updated_at = ? WHERE event_id = ?',
      variables: [
        Variable.withString(status),
        Variable<String>(error),
        Variable<DateTime>(nextRetry),
        Variable.withDateTime(DateTime.now()),
        Variable.withString(eventId),
      ],
    );
  }

  Future<void> incrementRetry(String eventId, {String? error}) async {
    await customUpdate(
      'UPDATE mqtt_queue SET retry_count = retry_count + 1, last_error = ?, last_attempt = ?, updated_at = ? WHERE event_id = ?',
      variables: [
        Variable<String>(error),
        Variable.withDateTime(DateTime.now()),
        Variable.withDateTime(DateTime.now()),
        Variable.withString(eventId),
      ],
    );
  }

  Future<int> countByStatus(String status) async {
    final result = await customSelect(
      'SELECT COUNT(*) as cnt FROM mqtt_queue WHERE status = ?',
      variables: [Variable.withString(status)],
    ).get();
    return result.first.data['cnt'] as int;
  }

  Future<List<Map<String, dynamic>>> getPendingForRetry({int limit = 50}) async {
    final result = await customSelect(
      'SELECT * FROM mqtt_queue WHERE status IN (\'queued\', \'publishing\', \'waiting_puback\') '
      'AND (next_retry IS NULL OR next_retry < ?) ORDER BY created_at ASC LIMIT ?',
      variables: [Variable.withDateTime(DateTime.now()), Variable.withInt(limit)],
    ).get();
    return result.map((r) => r.data).toList();
  }

  Future<List<Map<String, dynamic>>> getArchived({int limit = 100}) async {
    final result = await customSelect(
      'SELECT * FROM mqtt_queue WHERE status = \'archived\' LIMIT ?',
      variables: [Variable.withInt(limit)],
    ).get();
    return result.map((r) => r.data).toList();
  }

  Future<int> cleanExpiredArchived({required DateTime before}) async {
    return await customUpdate(
      'DELETE FROM mqtt_queue WHERE status = \'archived\' AND updated_at < ?',
      variables: [Variable.withDateTime(before)],
    );
  }

  Future<int> deleteByEventId(String eventId) async {
    return await customUpdate(
      'DELETE FROM mqtt_queue WHERE event_id = ?',
      variables: [Variable.withString(eventId)],
    );
  }

  Future<int> deleteByStatus(String status) async {
    return await customUpdate(
      'DELETE FROM mqtt_queue WHERE status = ?',
      variables: [Variable.withString(status)],
    );
  }

  Future<List<Map<String, dynamic>>> getAll() async {
    final result = await customSelect('SELECT * FROM mqtt_queue ORDER BY created_at ASC').get();
    return result.map((r) => r.data).toList();
  }

  Future<int> get length async {
    final result = await customSelect('SELECT COUNT(*) as cnt FROM mqtt_queue').get();
    return result.first.data['cnt'] as int;
  }

  Future<void> clear() async {
    await customUpdate('DELETE FROM mqtt_queue');
  }
}
