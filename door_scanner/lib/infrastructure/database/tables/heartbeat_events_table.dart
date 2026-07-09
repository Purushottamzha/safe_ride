import 'package:drift/drift.dart';

class HeartbeatEventsTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get eventId => text()();
  IntColumn get batteryLevel => integer().nullable()();
  IntColumn get isCharging => integer().withDefault(const Constant(0))();
  TextColumn get connectivityType => text()();
  TextColumn get gpsStatus => text()();
  TextColumn get appVersion => text()();
  TextColumn get deviceModel => text()();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get syncStatus => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
