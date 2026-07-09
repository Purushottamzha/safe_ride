import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'tables/device_state_table.dart';
import 'tables/mqtt_queue_table.dart';
import 'tables/scan_events_table.dart';
import 'tables/location_events_table.dart';
import 'tables/heartbeat_events_table.dart';
import 'tables/sync_metadata_table.dart';
import 'tables/log_entries_table.dart';

import 'daos/mqtt_queue_dao.dart';
import 'daos/scan_event_dao.dart';
import 'daos/location_event_dao.dart';
import 'daos/heartbeat_dao.dart';
import 'daos/device_state_dao.dart';
import 'daos/sync_metadata_dao.dart';
import 'daos/log_entry_dao.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    DeviceStateTable,
    MqttQueueTable,
    ScanEventsTable,
    LocationEventsTable,
    HeartbeatEventsTable,
    SyncMetadataTable,
    LogEntriesTable,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  MqttQueueDao? _mqttQueueDao;
  MqttQueueDao get mqttQueueDao => _mqttQueueDao ??= MqttQueueDao(this);

  ScanEventDao? _scanEventDao;
  ScanEventDao get scanEventDao => _scanEventDao ??= ScanEventDao(this);

  LocationEventDao? _locationEventDao;
  LocationEventDao get locationEventDao => _locationEventDao ??= LocationEventDao(this);

  HeartbeatDao? _heartbeatDao;
  HeartbeatDao get heartbeatDao => _heartbeatDao ??= HeartbeatDao(this);

  DeviceStateDao? _deviceStateDao;
  DeviceStateDao get deviceStateDao => _deviceStateDao ??= DeviceStateDao(this);

  SyncMetadataDao? _syncMetadataDao;
  SyncMetadataDao get syncMetadataDao => _syncMetadataDao ??= SyncMetadataDao(this);

  LogEntryDao? _logEntryDao;
  LogEntryDao get logEntryDao => _logEntryDao ??= LogEntryDao(this);

  static AppDatabase? _instance;
  static AppDatabase get instance {
    if (_instance == null) throw StateError('AppDatabase not initialized');
    return _instance!;
  }

  static Future<AppDatabase> initialize({String? path}) async {
    if (_instance != null) return _instance!;
    final executor = _createExecutor(path: path);
    final db = AppDatabase(executor);
    _instance = db;
    return db;
  }

  static LazyDatabase _createExecutor({String? path}) {
    return LazyDatabase(() async {
      final dir = path != null ? Directory(path) : await getApplicationDocumentsDirectory();
      final file = File(p.join(dir.path, 'saferide.sqlite'));
      return NativeDatabase(file);
    });
  }

  static void reset() {
    _instance = null;
  }

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (m) async {
        await m.createAll();
      },
      onUpgrade: (m, from, to) async {
        for (int i = from; i < to; i++) {
          if (i == 0) await m.createAll();
          if (i == 1) await m.createTable(logEntriesTable);
        }
      },
    );
  }
}
