import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/scan_event_dao.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late ScanEventDao dao;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS scan_events ('
      'id INTEGER PRIMARY KEY AUTOINCREMENT, '
      'event_id TEXT NOT NULL, '
      'student_id TEXT, '
      'trip_id TEXT, '
      'scan_type TEXT, '
      'timestamp TEXT NOT NULL, '
      'sync_status TEXT NOT NULL DEFAULT \'pending\', '
      'created_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    dao = ScanEventDao(database);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  tearDown(() async {
    await dao.clear();
  });

  group('insert', () {
    test('should insert a scan event', () async {
      await dao.insert({
        'eventId': 'evt-1',
        'studentId': 'stu-1',
        'tripId': 'trip-1',
        'scanType': 'entry',
        'timestamp': DateTime(2024, 1, 1),
        'syncStatus': 'pending',
      });
      expect(await dao.length, 1);
    });

    test('should insert multiple events', () async {
      for (int i = 0; i < 3; i++) {
        await dao.insert({
          'eventId': 'evt-$i',
          'studentId': 'stu-$i',
          'tripId': 'trip-1',
          'scanType': 'entry',
          'timestamp': DateTime(2024, 1, 1),
          'syncStatus': 'pending',
        });
      }
      expect(await dao.length, 3);
    });
  });

  group('getUnsynced', () {
    test('should return only pending events', () async {
      await dao.insert({
        'eventId': 'evt-1', 'studentId': 'stu-1', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.insert({
        'eventId': 'evt-2', 'studentId': 'stu-2', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'synced',
      });
      await dao.insert({
        'eventId': 'evt-3', 'studentId': 'stu-3', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });

      final unsynced = await dao.getUnsynced();
      expect(unsynced.length, 2);
      expect(unsynced[0]['event_id'], 'evt-1');
      expect(unsynced[1]['event_id'], 'evt-3');
    });

    test('should respect limit', () async {
      for (int i = 0; i < 10; i++) {
        await dao.insert({
          'eventId': 'evt-$i', 'studentId': 'stu-$i', 'tripId': 'trip-1',
          'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
        });
      }
      final unsynced = await dao.getUnsynced(limit: 3);
      expect(unsynced.length, 3);
    });
  });

  group('markSynced', () {
    test('should mark event as synced by id', () async {
      await dao.insert({
        'eventId': 'evt-1', 'studentId': 'stu-1', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      final all = await dao.getAll();
      final id = all[0]['id'] as int;
      await dao.markSynced(id);

      final updated = await dao.getAll();
      expect(updated[0]['sync_status'], 'synced');
    });
  });

  group('markSyncedByEventId', () {
    test('should mark event as synced by eventId', () async {
      await dao.insert({
        'eventId': 'evt-1', 'studentId': 'stu-1', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.markSyncedByEventId('evt-1');

      final updated = await dao.getAll();
      expect(updated[0]['sync_status'], 'synced');
    });
  });

  group('clear', () {
    test('should remove all events', () async {
      await dao.insert({
        'eventId': 'evt-1', 'studentId': 'stu-1', 'tripId': 'trip-1',
        'scanType': 'entry', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.clear();
      expect(await dao.length, 0);
    });
  });
}
