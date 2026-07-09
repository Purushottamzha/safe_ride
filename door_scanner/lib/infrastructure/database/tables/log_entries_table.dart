import 'package:drift/drift.dart';

class LogEntriesTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get level => text()();
  TextColumn get category => text()();
  TextColumn get eventId => text().nullable()();
  TextColumn get tripId => text().nullable()();
  TextColumn get message => text()();
  TextColumn get metadataJson => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
