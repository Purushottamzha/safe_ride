import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/mqtt_queue_dao.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_offline_queue.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_publish_queue.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_ack_tracker.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  group('Offline Queue Pipeline', () {
    late AppDatabase database;
    late MqttQueueDao dao;
    late MqttOfflineQueue offlineQueue;
    late MqttPublishQueue publishQueue;
    late MqttAckTracker ackTracker;

    setUp(() async {
      final dir = Directory.systemTemp.createTempSync('drift_integration_');
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
      ackTracker = MqttAckTracker.instance;
      ackTracker.clear();
      offlineQueue = MqttOfflineQueue.withDao(dao);
      publishQueue = MqttPublishQueue.test(
        dao: dao,
        ackTracker: ackTracker,
        offlineQueue: offlineQueue,
      );
    });

    tearDown(() async {
      ackTracker.clear();
      await dao.clear();
    });

    test('Scenario 1: Basic offline queue — enqueue while offline, flush on reconnect', () async {
      await offlineQueue.enqueue('scanner/scan', '{"eventId":"e1"}', 'e1');
      await offlineQueue.enqueue('scanner/scan', '{"eventId":"e2"}', 'e2');
      await offlineQueue.enqueue('scanner/scan', '{"eventId":"e3"}', 'e3');

      expect(await offlineQueue.length, 3);

      final batch = await offlineQueue.flushBatch();
      expect(batch.length, 3);
      expect(batch[0].eventId, 'e1');
      expect(batch[1].eventId, 'e2');
      expect(batch[2].eventId, 'e3');
    });

    test('Scenario 2: Queue drains completely after flush', () async {
      for (int i = 0; i < 10; i++) {
        await offlineQueue.enqueue('scanner/scan', '{"idx":$i}', 'evt-$i');
      }
      expect(await offlineQueue.length, 10);

      await offlineQueue.flushBatch();
      expect(await offlineQueue.length, 0);
    });

    test('Scenario 3: Duplicate eventId is idempotent (INSERT OR REPLACE)', () async {
      await offlineQueue.enqueue('scanner/scan', '{"v":1}', 'dup-evt');
      await offlineQueue.enqueue('scanner/scan', '{"v":2}', 'dup-evt');

      final batch = await offlineQueue.flushBatch();
      expect(batch.length, 1);
      final payload = batch.first.payload;
      expect(payload, '{"v":2}');
    });

    test('Scenario 4: Removed acknowledged events are persisted correctly', () async {
      await offlineQueue.enqueue('scanner/scan', '{}', 'e1');
      await offlineQueue.enqueue('scanner/scan', '{}', 'e2');
      await offlineQueue.enqueue('scanner/scan', '{}', 'e3');

      await offlineQueue.flushBatch();
      await offlineQueue.removeAcknowledged(['e1', 'e3']);

      final remaining = await dao.getByStatus('publishing');
      expect(remaining.length, 1);
      expect(remaining[0]['event_id'], 'e2');
    });

    test('Scenario 5: FIFO preserved across 100 events', () async {
      const count = 100;
      for (int i = 0; i < count; i++) {
        await offlineQueue.enqueue('scanner/scan', '{"i":$i}', 'evt-$i');
      }
      expect(await offlineQueue.length, count);

      final batch = await offlineQueue.flushBatch(limit: count);
      expect(batch.length, count);
      for (int i = 0; i < count; i++) {
        expect(batch[i].eventId, 'evt-$i');
      }
    });

    test('Scenario 6: Offline flush then publish — full roundtrip', () async {
      await offlineQueue.enqueue('scanner/scan', '{"evt":"roundtrip"}', 'rt-evt');
      expect(await offlineQueue.length, 1);

      publishQueue.publishFn = (_, __, ___) => true;
      final batch = await offlineQueue.flushBatch();
      expect(batch.length, 1);
      expect(await offlineQueue.length, 0);

      await publishQueue.publish(batch[0].topic, batch[0].payload, batch[0].eventId);
      await Future.delayed(const Duration(milliseconds: 50));

      ackTracker.onAck('rt-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      final row = await dao.getByEventId('rt-evt');
      expect(row?['status'], 'archived');
    });

    test('Scenario 7: Full lifecycle — publish, ack, archive', () async {
      int publishedCount = 0;
      publishQueue.publishFn = (_, __, ___) {
        publishedCount++;
        return true;
      };

      await publishQueue.publish('scanner/scan', '{"ok":true}', 'lifecycle-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      expect(publishedCount, 1);

      ackTracker.onAck('lifecycle-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      final row = await dao.getByEventId('lifecycle-evt');
      expect(row?['status'], 'archived');
      expect(publishedCount, 1);
    });

    test('Scenario 8: Retry count increments on timeout', () async {
      publishQueue.publishFn = (_, __, ___) => true;
      await publishQueue.publish('scanner/scan', '{}', 'retry-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      ackTracker.onTimeout('retry-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      final row = await dao.getByEventId('retry-evt');
      expect(row?['retry_count'], 1);
    });

    test('Scenario 9: Max retries exceeded marks as failed', () async {
      publishQueue.publishFn = (_, __, ___) => true;

      await dao.insertOrReplace({
        'eventId': 'maxretry-evt',
        'topic': 'scanner/scan',
        'payload': '{}',
        'qos': 1,
        'status': 'created',
        'retryCount': 5,
        'maxRetries': 5,
        'createdAt': DateTime.now(),
      });

      await publishQueue.publish('scanner/scan', '{}', 'maxretry-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      ackTracker.onTimeout('maxretry-evt');
      await Future.delayed(const Duration(milliseconds: 50));

      final row = await dao.getByEventId('maxretry-evt');
      expect(row?['status'], 'failed');
    });
  });
}
