import 'package:drift/drift.dart';

class ScanEventsTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get eventId => text()();
  TextColumn get studentId => text()();
  TextColumn get tripId => text()();
  TextColumn get scanType => text()();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get syncStatus => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
