import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/heartbeat_dao.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late HeartbeatDao dao;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS heartbeat_events ('
      'id INTEGER PRIMARY KEY AUTOINCREMENT, '
      'event_id TEXT NOT NULL, '
      'battery_level INTEGER, '
      'is_charging INTEGER NOT NULL DEFAULT 0, '
      'connectivity_type TEXT NOT NULL, '
      'gps_status TEXT NOT NULL, '
      'app_version TEXT NOT NULL, '
      'device_model TEXT NOT NULL, '
      'timestamp TEXT NOT NULL, '
      'sync_status TEXT NOT NULL, '
      'created_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    dao = HeartbeatDao(database);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  group('insert', () {
    test('should insert a heartbeat event', () async {
      await dao.insert({
        'eventId': 'hb-1',
        'batteryLevel': 85,
        'isCharging': true,
        'connectivityType': 'wifi',
        'gpsStatus': 'active',
        'appVersion': '1.0.0',
        'deviceModel': 'scanner-v1',
        'timestamp': DateTime(2024, 1, 1),
        'syncStatus': 'pending',
      });
      final all = await dao.getUnsynced();
      expect(all.length, 1);
      expect(all[0]['battery_level'], 85);
      expect(all[0]['is_charging'], 1);
    });

    test('should insert with defaults for nullable fields', () async {
      await dao.insert({
        'eventId': 'hb-1',
        'batteryLevel': null,
        'isCharging': false,
        'connectivityType': 'mobile',
        'gpsStatus': 'inactive',
        'appVersion': '1.0.0',
        'deviceModel': 'scanner-v1',
        'timestamp': DateTime(2024, 1, 1),
        'syncStatus': 'pending',
      });
      expect(await dao.getUnsynced(), hasLength(1));
    });
  });

  group('getUnsynced', () {
    test('should return only pending heartbeats', () async {
      await dao.insert({
        'eventId': 'hb-1', 'batteryLevel': 80, 'isCharging': false,
        'connectivityType': 'wifi', 'gpsStatus': 'active', 'appVersion': '1.0.0',
        'deviceModel': 'v1', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.insert({
        'eventId': 'hb-2', 'batteryLevel': 90, 'isCharging': true,
        'connectivityType': '4g', 'gpsStatus': 'active', 'appVersion': '1.0.0',
        'deviceModel': 'v1', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'synced',
      });

      final unsynced = await dao.getUnsynced();
      expect(unsynced.length, 1);
      expect(unsynced[0]['event_id'], 'hb-1');
    });
  });

  group('markSyncedByEventId', () {
    test('should mark heartbeat as synced', () async {
      await dao.insert({
        'eventId': 'hb-1', 'batteryLevel': 80, 'isCharging': false,
        'connectivityType': 'wifi', 'gpsStatus': 'active', 'appVersion': '1.0.0',
        'deviceModel': 'v1', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.markSyncedByEventId('hb-1');

      final all = await dao.getUnsynced();
      expect(all.isEmpty, isTrue);
    });
  });

  group('clear', () {
    test('should remove all heartbeats', () async {
      await dao.insert({
        'eventId': 'hb-1', 'batteryLevel': 80, 'isCharging': false,
        'connectivityType': 'wifi', 'gpsStatus': 'active', 'appVersion': '1.0.0',
        'deviceModel': 'v1', 'timestamp': DateTime(2024, 1, 1), 'syncStatus': 'pending',
      });
      await dao.clear();
      expect(await dao.getUnsynced(), isEmpty);
    });
  });
}
