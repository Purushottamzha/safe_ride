import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:door_scanner/infrastructure/database/app_database.dart';
import 'package:door_scanner/infrastructure/database/daos/sync_metadata_dao.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  late AppDatabase database;
  late SyncMetadataDao dao;

  setUp(() async {
    final dir = Directory.systemTemp.createTempSync('drift_test_');
    final file = File('${dir.path}\\test.sqlite');
    database = AppDatabase(NativeDatabase(file));
    await database.customStatement(
      'CREATE TABLE IF NOT EXISTS sync_metadata ('
      'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '
      'entity_type TEXT NOT NULL, '
      'entity_id TEXT NOT NULL, '
      'last_synced TEXT NOT NULL DEFAULT (datetime(\'now\')), '
      'status TEXT NOT NULL DEFAULT \'pending\', '
      'created_at TEXT NOT NULL DEFAULT (datetime(\'now\')), '
      'updated_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
    dao = SyncMetadataDao(database);
  });

  tearDown(() async {
    await dao.clear();
    await database.close();
  });

  tearDown(() async {
    await dao.clear();
  });

  group('upsert and get', () {
    test('should insert a new sync metadata entry', () async {
      await dao.upsert('scan_event', 'evt-1', DateTime(2024, 1, 1), 'synced');
      final result = await dao.get('scan_event', 'evt-1');
      expect(result, isNotNull);
      expect(result!['entity_type'], 'scan_event');
      expect(result['entity_id'], 'evt-1');
      expect(result['status'], 'synced');
    });

    test('should update an existing entry', () async {
      await dao.upsert('scan_event', 'evt-1', DateTime(2024, 1, 1), 'synced');
      await dao.upsert('scan_event', 'evt-1', DateTime(2024, 1, 2), 'failed');
      final result = await dao.get('scan_event', 'evt-1');
      expect(result!['status'], 'failed');
    });

    test('should return null for non-existent entry', () async {
      final result = await dao.get('scan_event', 'nonexistent');
      expect(result, isNull);
    });
  });

  group('remove', () {
    test('should remove a sync metadata entry', () async {
      await dao.upsert('scan_event', 'evt-1', DateTime(2024, 1, 1), 'synced');
      await dao.remove('scan_event', 'evt-1');
      final result = await dao.get('scan_event', 'evt-1');
      expect(result, isNull);
    });
  });

  group('clear', () {
    test('should remove all entries', () async {
      await dao.upsert('scan_event', 'evt-1', DateTime(2024, 1, 1), 'synced');
      await dao.upsert('location', 'loc-1', DateTime(2024, 1, 1), 'pending');
      await dao.clear();
      final result = await dao.get('scan_event', 'evt-1');
      expect(result, isNull);
    });
  });
}
