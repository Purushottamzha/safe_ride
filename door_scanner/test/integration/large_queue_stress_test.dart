import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/mqtt_queue_dao.dart';
import 'package:door_scanner/infrastructure/mqtt/mqtt_offline_queue.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  group('Large Queue Stress Test', () {
    late AppDatabase database;
    late MqttQueueDao dao;
    late MqttOfflineQueue offlineQueue;

    setUp(() async {
      final dir = Directory.systemTemp.createTempSync('drift_stress_');
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
      offlineQueue = MqttOfflineQueue.withDao(dao);
    });

    tearDown(() async {
      await dao.clear();
    });

    test('Stress: Enqueue 1000 events — verify FIFO and count', () async {
      const count = 1000;

      final sw = Stopwatch()..start();
      for (int i = 0; i < count; i++) {
        await offlineQueue.enqueue(
          'scanner/scan',
          '{"eventId":"evt-$i","idx":$i,"ts":"${DateTime.now().toIso8601String()}"}',
          'evt-$i',
        );
      }
      sw.stop();
      final enqueueMs = sw.elapsedMilliseconds;

      expect(await offlineQueue.length, count);

      final flushSw = Stopwatch()..start();
      final batch = await offlineQueue.flushBatch(limit: count);
      flushSw.stop();
      final flushMs = flushSw.elapsedMilliseconds;

      expect(batch.length, count);

      for (int i = 0; i < count; i++) {
        expect(batch[i].eventId, 'evt-$i');
      }

      expect(await offlineQueue.length, 0);

      final ids = batch.map((m) => m.eventId).toSet();
      expect(ids.length, count);

      print('  Enqueue $count events: ${enqueueMs}ms (${(count * 1000 / enqueueMs).toStringAsFixed(0)} evts/sec)');
      print('  Flush   $count events: ${flushMs}ms (${(count * 1000 / flushMs).toStringAsFixed(0)} evts/sec)');
    });

    test('Stress: Enqueue 5000 events — measure drain time and integrity', () async {
      const count = 5000;

      final sw = Stopwatch()..start();
      for (int i = 0; i < count; i++) {
        await offlineQueue.enqueue(
          'scanner/scan',
          '{"i":$i}',
          's-evt-$i',
        );
      }
      sw.stop();
      final enqueueTime = sw.elapsedMilliseconds;

      final flushSw = Stopwatch()..start();
      final batch = await offlineQueue.flushBatch(limit: count);
      flushSw.stop();
      final flushTime = flushSw.elapsedMilliseconds;

      expect(batch.length, count);

      final ids = batch.map((m) => m.eventId).toSet();
      expect(ids.length, count);

      for (int i = 0; i < count; i++) {
        expect(batch[i].eventId, 's-evt-$i');
      }

      print('  Enqueue $count events: ${enqueueTime}ms (${(count * 1000 / enqueueTime).toStringAsFixed(0)} evts/sec)');
      print('  Flush   $count events: ${flushTime}ms (${(count * 1000 / flushTime).toStringAsFixed(0)} evts/sec)');
    });
  });
}
