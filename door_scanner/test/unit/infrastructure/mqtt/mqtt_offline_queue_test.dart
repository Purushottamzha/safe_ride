import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/mqtt_queue_dao.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_offline_queue.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late MqttQueueDao dao;
  late MqttOfflineQueue queue;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS mqtt_queue ('
      'event_id TEXT NOT NULL PRIMARY KEY, '
      'topic TEXT NOT NULL, '
      'payload TEXT NOT NULL, '
      'qos INTEGER NOT NULL DEFAULT 1, '
      'retain INTEGER NOT NULL DEFAULT 0, '
      'status TEXT NOT NULL, '
      'retry_count INTEGER NOT NULL DEFAULT 0, '
      'max_retries INTEGER NOT NULL DEFAULT 5, '
      'last_attempt TEXT, '
      'next_retry TEXT, '
      'last_error TEXT, '
      'created_at TEXT NOT NULL DEFAULT (datetime(\'now\')), '
      'updated_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    dao = MqttQueueDao(database);
    queue = MqttOfflineQueue.withDao(dao);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  group('enqueue', () {
    test('should add message to queue', () async {
      await queue.enqueue('test/topic', '{"key":"value"}', 'event-1');
      expect(await queue.length, 1);
    });

    test('should increment length on multiple enqueues', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      await queue.enqueue('topic/b', '{}', 'event-2');
      await queue.enqueue('topic/c', '{}', 'event-3');
      expect(await queue.length, 3);
    });
  });

  group('flushBatch', () {
    test('should return all messages in order', () async {
      await queue.enqueue('topic/a', '{"a":1}', 'event-1');
      await queue.enqueue('topic/b', '{"b":2}', 'event-2');
      await queue.enqueue('topic/c', '{"c":3}', 'event-3');

      final batch = await queue.flushBatch();
      expect(batch.length, 3);
      expect(batch[0].eventId, 'event-1');
      expect(batch[1].eventId, 'event-2');
      expect(batch[2].eventId, 'event-3');
    });

    test('should remove flushed messages from queue', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      await queue.enqueue('topic/b', '{}', 'event-2');

      await queue.flushBatch();
      expect(await queue.length, 0);
    });

    test('should respect limit', () async {
      for (int i = 0; i < 10; i++) {
        await queue.enqueue('topic/$i', '{}', 'event-$i');
      }

      final batch = await queue.flushBatch(limit: 3);
      expect(batch.length, 3);
      expect(await queue.length, 7);
    });
  });

  group('removeAcknowledged', () {
    test('should remove acknowledged messages', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      await queue.enqueue('topic/b', '{}', 'event-2');
      await queue.enqueue('topic/c', '{}', 'event-3');

      await queue.removeAcknowledged(['event-1', 'event-3']);
      expect(await queue.length, 1);
    });

    test('should do nothing for unknown event IDs', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      await queue.removeAcknowledged(['unknown-event']);
      expect(await queue.length, 1);
    });
  });

  group('retryFailed', () {
    test('should add message back to queue', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      final batch = await queue.flushBatch();
      expect(await queue.length, 0);

      await queue.retryFailed(batch.first);
      expect(await queue.length, 1);
    });
  });

  group('clear', () {
    test('should remove all messages', () async {
      await queue.enqueue('topic/a', '{}', 'event-1');
      await queue.enqueue('topic/b', '{}', 'event-2');

      await queue.clear();
      expect(await queue.length, 0);
    });
  });
}
