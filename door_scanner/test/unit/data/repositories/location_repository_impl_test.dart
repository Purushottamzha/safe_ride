import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:door_scanner/data/datasources/local/location_local_datasource.dart';
import 'package:door_scanner/data/repositories/location_repository_impl.dart';

class MockLocationLocalDataSource extends Mock implements LocationLocalDataSource {}

void main() {
  late MockLocationLocalDataSource mockLocal;
  late LocationRepositoryImpl repository;

  setUp(() {
    mockLocal = MockLocationLocalDataSource();
    repository = LocationRepositoryImpl(localDataSource: mockLocal);
    when(() => mockLocal.insertLocation(any())).thenAnswer((_) async {});
    when(() => mockLocal.getUnsynced(limit: any(named: 'limit')))
        .thenAnswer((_) async => []);
    when(() => mockLocal.markSyncedByEventId(any())).thenAnswer((_) async {});
  });

  group('insertLocation', () {
    test('should insert location event', () async {
      final ping = {
        'eventId': 'evt-1',
        'latitude': 27.7172,
        'longitude': 85.3240,
        'accuracy': 10.0,
        'speed': 5.0,
        'heading': 90.0,
        'timestamp': DateTime.now(),
      };
      await repository.insertLocation(ping);
      verify(() => mockLocal.insertLocation(any())).called(1);
    });

    test('should insert with null optional fields', () async {
      final ping = {
        'eventId': 'evt-2',
        'latitude': 27.7172,
        'longitude': 85.3240,
        'accuracy': null,
        'speed': null,
        'heading': null,
        'timestamp': DateTime.now(),
      };
      await repository.insertLocation(ping);
      verify(() => mockLocal.insertLocation(any())).called(1);
    });
  });

  group('countUnsynced', () {
    test('should return 0 when no unsynced locations', () async {
      final count = await repository.countUnsynced();
      expect(count, 0);
    });
  });

  group('getUnsyncedLocations', () {
    test('should return empty list when no unsynced locations', () async {
      final result = await repository.getUnsyncedLocations();
      expect(result, isEmpty);
    });
  });

  group('markSynced', () {
    test('should mark event as synced', () async {
      await repository.markSynced('evt-1');
      verify(() => mockLocal.markSyncedByEventId('evt-1')).called(1);
    });
  });
}
