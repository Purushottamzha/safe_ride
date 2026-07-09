import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/device_state_dao.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late DeviceStateDao dao;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS device_state ('
      'key TEXT NOT NULL PRIMARY KEY, '
      'value TEXT NOT NULL, '
      'updated_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    dao = DeviceStateDao(database);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  group('upsert and get', () {
    test('should insert a new key-value pair', () async {
      await dao.upsert('sensor_mode', 'active');
      final value = await dao.get('sensor_mode');
      expect(value, 'active');
    });

    test('should update an existing key', () async {
      await dao.upsert('sensor_mode', 'active');
      await dao.upsert('sensor_mode', 'standby');
      final value = await dao.get('sensor_mode');
      expect(value, 'standby');
    });

    test('should return null for non-existent key', () async {
      final value = await dao.get('nonexistent');
      expect(value, isNull);
    });
  });

  group('getAll', () {
    test('should return all key-value pairs', () async {
      await dao.upsert('key1', 'val1');
      await dao.upsert('key2', 'val2');
      final all = await dao.getAll();
      expect(all, {'key1': 'val1', 'key2': 'val2'});
    });
  });

  group('remove', () {
    test('should remove a key-value pair', () async {
      await dao.upsert('key1', 'val1');
      await dao.remove('key1');
      final value = await dao.get('key1');
      expect(value, isNull);
    });
  });

  group('clear', () {
    test('should remove all state', () async {
      await dao.upsert('key1', 'val1');
      await dao.upsert('key2', 'val2');
      await dao.clear();
      final all = await dao.getAll();
      expect(all, isEmpty);
    });
  });
}
