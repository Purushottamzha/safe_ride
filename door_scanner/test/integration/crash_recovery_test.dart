import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/mqtt_queue_dao.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_offline_queue.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  group('Crash Recovery', () {
    late Directory tempDir;
    late String dbPath;

    setUp(() {
      tempDir = Directory.systemTemp.createTempSync('drift_crash_');
      dbPath = '${tempDir.path}\\saferide.sqlite';
    });

    tearDown(() {
      tempDir.deleteSync(recursive: true);
    });

    Future<AppDatabase> openDb() async {
      final file = File(dbPath);
      final db = AppDatabase(NativeDatabase(file));
      await db.customStatement(
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
      return db;
    }

    test('Scenario 1: Events persist after database close and reopen', () async {
      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);
      final queue1 = MqttOfflineQueue.withDao(dao1);

      await queue1.enqueue('scanner/scan', '{"eventId":"e1"}', 'e1');
      await queue1.enqueue('scanner/scan', '{"eventId":"e2"}', 'e2');
      await queue1.enqueue('scanner/scan', '{"eventId":"e3"}', 'e3');
      expect(await queue1.length, 3);

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);
      final queue2 = MqttOfflineQueue.withDao(dao2);

      expect(await queue2.length, 3);

      final batch = await queue2.flushBatch();
      expect(batch.length, 3);
      expect(batch[0].eventId, 'e1');
      expect(batch[1].eventId, 'e2');
      expect(batch[2].eventId, 'e3');

      await db2.close();
    });

    test('Scenario 2: 100 events survive crash recovery with FIFO', () async {
      const count = 100;
      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);
      final queue1 = MqttOfflineQueue.withDao(dao1);

      for (int i = 0; i < count; i++) {
        await queue1.enqueue('scanner/scan', '{"i":$i}', 'evt-$i');
      }
      expect(await queue1.length, count);

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);
      final queue2 = MqttOfflineQueue.withDao(dao2);

      expect(await queue2.length, count);

      final batch = await queue2.flushBatch(limit: count);
      expect(batch.length, count);
      for (int i = 0; i < count; i++) {
        expect(batch[i].eventId, 'evt-$i');
      }

      await db2.close();
    });

    test('Scenario 3: Stuck publishing status reset on recovery', () async {
      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);

      await dao1.insertOrReplace({
        'eventId': 'stuck-1',
        'topic': 'scanner/scan',
        'payload': '{}',
        'qos': 1,
        'status': 'publishing',
        'retryCount': 0,
        'maxRetries': 5,
        'createdAt': DateTime.now(),
      });
      await dao1.insertOrReplace({
        'eventId': 'stuck-2',
        'topic': 'scanner/scan',
        'payload': '{}',
        'qos': 1,
        'status': 'waiting_puback',
        'retryCount': 0,
        'maxRetries': 5,
        'createdAt': DateTime.now(),
      });
      await dao1.insertOrReplace({
        'eventId': 'normal-1',
        'topic': 'scanner/scan',
        'payload': '{}',
        'qos': 1,
        'status': 'queued',
        'retryCount': 0,
        'maxRetries': 5,
        'createdAt': DateTime.now(),
      });

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);

      final publishingCount = await dao2.countByStatus('publishing');
      final waitingCount = await dao2.countByStatus('waiting_puback');

      expect(publishingCount, 1);
      expect(waitingCount, 1);

      final stuck1 = await dao2.getByEventId('stuck-1');
      final stuck2 = await dao2.getByEventId('stuck-2');
      expect(stuck1?['status'], 'publishing');
      expect(stuck2?['status'], 'waiting_puback');

      final stuckStatuses = await dao2.getByStatuses(['publishing', 'waiting_puback']);
      for (final msg in stuckStatuses) {
        await dao2.updateStatus(msg['event_id'] as String, 'queued');
      }

      final publishingAfter = await dao2.countByStatus('publishing');
      final waitingAfter = await dao2.countByStatus('waiting_puback');
      expect(publishingAfter, 0);
      expect(waitingAfter, 0);

      final queued = await dao2.countByStatus('queued');
      expect(queued, 3);

      await db2.close();
    });

    test('Scenario 4: Empty queue recovery is a no-op', () async {
      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);
      final queue1 = MqttOfflineQueue.withDao(dao1);

      expect(await queue1.length, 0);

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);
      final queue2 = MqttOfflineQueue.withDao(dao2);

      expect(await queue2.length, 0);

      await db2.close();
    });

    test('Scenario 5: Recovery with mixed statuses', () async {
      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);

      final statuses = ['created', 'queued', 'publishing', 'waiting_puback', 'completed', 'failed', 'archived'];
      for (int i = 0; i < statuses.length; i++) {
        await dao1.insertOrReplace({
          'eventId': 'evt-$i',
          'topic': 'scanner/scan',
          'payload': '{}',
          'qos': 1,
          'status': statuses[i],
          'retryCount': i,
          'maxRetries': 5,
          'createdAt': DateTime.now(),
        });
      }

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);

      expect(await dao2.countByStatus('created'), 1);
      expect(await dao2.countByStatus('queued'), 1);
      expect(await dao2.countByStatus('publishing'), 1);
      expect(await dao2.countByStatus('waiting_puback'), 1);
      expect(await dao2.countByStatus('completed'), 1);
      expect(await dao2.countByStatus('failed'), 1);
      expect(await dao2.countByStatus('archived'), 1);

      await db2.close();
    });

    test('Scenario 6: 2000 events survive crash recovery with FIFO', () async {
      const count = 2000;

      final db1 = await openDb();
      final dao1 = MqttQueueDao(db1);
      final queue1 = MqttOfflineQueue.withDao(dao1);

      for (int i = 0; i < count; i++) {
        await queue1.enqueue('scanner/scan', '{"i":$i}', 'crash-evt-$i');
      }
      expect(await queue1.length, count);

      await db1.close();

      final db2 = await openDb();
      final dao2 = MqttQueueDao(db2);
      final queue2 = MqttOfflineQueue.withDao(dao2);

      expect(await queue2.length, count);

      final flushSw = Stopwatch()..start();
      final batch = await queue2.flushBatch(limit: count);
      flushSw.stop();
      final flushTime = flushSw.elapsedMilliseconds;

      expect(batch.length, count);

      final ids = batch.map((m) => m.eventId).toSet();
      expect(ids.length, count);

      for (int i = 0; i < count; i++) {
        expect(batch[i].eventId, 'crash-evt-$i');
      }

      print('  Flush $count events after reopen: ${flushTime}ms');
      print('  Duplicates: ${count - ids.length}');

      await db2.close();
    });
  });
}
