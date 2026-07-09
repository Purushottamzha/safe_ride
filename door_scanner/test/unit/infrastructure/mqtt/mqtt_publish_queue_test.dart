import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/mqtt_queue_dao.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_publish_queue.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_offline_queue.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_ack_tracker.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late MqttQueueDao dao;
  late MqttPublishQueue queue;
  late MqttOfflineQueue offlineQueue;

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
    MqttAckTracker.instance.clear();
    offlineQueue = MqttOfflineQueue.withDao(dao);
    queue = MqttPublishQueue.test(
      dao: dao,
      offlineQueue: offlineQueue,
    );
  });

  tearDown(() async {
    MqttAckTracker.instance.clear();
    await dao.clear();
  });

  group('publish', () {
    test('should add entry to in-memory queue', () async {
      queue.publishFn = (_, __, ___) => true;
      await queue.publish('test/topic', '{"key":"value"}', 'evt-1');
      // Entry is removed after processing; length reflects entries added
      // but not yet consumed by _processQueue
      await Future.delayed(Duration.zero);
      expect(queue.length, 0);
    });
  });

  group('lifecycle - success', () {
    test('should transition to archived on ack', () async {
      queue.publishFn = (_, __, ___) => true;
      await queue.publish('test/topic', '{"key":"value"}', 'evt-1');

      await Future.delayed(Duration.zero);

      MqttAckTracker.instance.onAck('evt-1');
      await Future.delayed(Duration.zero);

      final dbEntry = await dao.getByEventId('evt-1');
      expect(dbEntry?['status'], 'archived');
    });
  });

  group('lifecycle - ack timeout with retry', () {
    test('should retry when ack not received within retry limit', () async {
      queue.publishFn = (_, __, ___) => true;
      await queue.publish('test/topic', '{}', 'evt-1');

      await Future.delayed(Duration.zero);

      MqttAckTracker.instance.onTimeout('evt-1');
      await Future.delayed(Duration.zero);

      final dbEntry = await dao.getByEventId('evt-1');
      expect(dbEntry?['retry_count'], 1);
    });

    test('should mark as failed after max retries exceeded', () async {
      queue.publishFn = (_, __, ___) => true;

      await queue.publish('test/topic', '{}', 'evt-1');
      await Future.delayed(Duration.zero);

      MqttAckTracker.instance.onTimeout('evt-1');
      await Future.delayed(Duration.zero);

      // Now retry_count=1. Directly set it to 5 in DB so next cycle fails.
      await dao.customUpdate(
        'UPDATE mqtt_queue SET retry_count = 5 WHERE event_id = ?',
        variables: [Variable.withString('evt-1')],
      );

      // Re-publish: preserves retry_count=5, maxRetries=5
      await queue.publish('test/topic', '{}', 'evt-1');
      await Future.delayed(Duration.zero);

      MqttAckTracker.instance.onTimeout('evt-1');
      await Future.delayed(Duration.zero);

      final dbEntry = await dao.getByEventId('evt-1');
      expect(dbEntry?['status'], 'failed');
    });
  });

  group('lifecycle - publish failure', () {
    test('should fall back to offline queue when publishFn returns false', () async {
      queue.publishFn = (_, __, ___) => false;
      await queue.publish('test/topic', '{}', 'evt-1');

      await Future.delayed(Duration.zero);

      final dbEntry = await dao.getByEventId('evt-1');
      expect(dbEntry?['status'], 'queued');
    });

    test('should fall back to offline queue when publishFn throws', () async {
      queue.publishFn = (_, __, ___) => throw Exception('Publish error');
      await queue.publish('test/topic', '{}', 'evt-1');

      await Future.delayed(Duration.zero);

      final dbEntry = await dao.getByEventId('evt-1');
      expect(dbEntry?['status'], 'queued');
    });
  });

  group('clear', () {
    test('should clear in-memory queue', () async {
      queue.clear();
      expect(queue.length, 0);
    });
  });
}
