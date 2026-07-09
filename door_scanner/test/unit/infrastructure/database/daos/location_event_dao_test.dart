import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/location_event_dao.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late LocationEventDao dao;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS location_events ('
      'event_id TEXT NOT NULL PRIMARY KEY, '
      'latitude REAL NOT NULL, '
      'longitude REAL NOT NULL, '
      'accuracy REAL, '
      'speed REAL, '
      'heading REAL, '
      'timestamp TEXT NOT NULL DEFAULT (datetime(\'now\')), '
      'sync_status TEXT NOT NULL DEFAULT \'pending\')');
    dao = LocationEventDao(database);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  group('insert', () {
    test('should insert a location event', () async {
      await dao.insert({
        'eventId': 'evt-1',
        'latitude': 27.7172,
        'longitude': 85.3240,
        'accuracy': 10.0,
        'speed': 30.0,
        'heading': 180.0,
        'timestamp': DateTime(2024, 1, 1),
        'syncStatus': 'pending',
      });
      final all = await dao.getAll();
      expect(all.length, 1);
      expect(all[0]['latitude'], closeTo(27.7172, 0.001));
      expect(all[0]['longitude'], closeTo(85.3240, 0.001));
    });

    test('should insert with nullable fields', () async {
      await dao.insert({
        'eventId': 'evt-1',
        'latitude': 27.7172,
        'longitude': 85.3240,
        'timestamp': DateTime(2024, 1, 1),
        'syncStatus': 'pending',
      });
      expect(await dao.getAll(), hasLength(1));
    });
  });

  group('getUnsynced', () {
    test('should return only pending events', () async {
      await dao.insert({
        'eventId': 'evt-1', 'latitude': 1.0, 'longitude': 2.0,
        'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.insert({
        'eventId': 'evt-2', 'latitude': 3.0, 'longitude': 4.0,
        'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'synced',
      });

      final unsynced = await dao.getUnsynced();
      expect(unsynced.length, 1);
      expect(unsynced[0]['event_id'], 'evt-1');
    });
  });

  group('markSyncedByEventId', () {
    test('should mark event as synced', () async {
      await dao.insert({
        'eventId': 'evt-1', 'latitude': 1.0, 'longitude': 2.0,
        'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.markSyncedByEventId('evt-1');

      final all = await dao.getAll();
      expect(all[0]['sync_status'], 'synced');
    });
  });

  group('clear', () {
    test('should remove all events', () async {
      await dao.insert({
        'eventId': 'evt-1', 'latitude': 1.0, 'longitude': 2.0,
        'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.clear();
      expect(await dao.getAll(), isEmpty);
    });
  });
}
