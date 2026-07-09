import 'package:drift/drift.dart';

@DataClassName('MqttQueueEntry')
class MqttQueueTable extends Table {
  TextColumn get eventId => text()();
  TextColumn get topic => text()();
  TextColumn get payload => text()();
  IntColumn get qos => integer().withDefault(const Constant(1))();
  IntColumn get retain => integer().withDefault(const Constant(0))();
  TextColumn get status => text()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  IntColumn get maxRetries => integer().withDefault(const Constant(5))();
  DateTimeColumn get lastAttempt => dateTime().nullable()();
  DateTimeColumn get nextRetry => dateTime().nullable()();
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {eventId};
}
