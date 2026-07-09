import 'package:drift/drift.dart';

class LocationEventsTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get eventId => text()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  RealColumn get accuracy => real().nullable()();
  RealColumn get speed => real().nullable()();
  RealColumn get heading => real().nullable()();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get syncStatus => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
