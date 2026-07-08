import '../../domain/repositories/i_scan_repository.dart';

class ScanRepositoryImpl implements IScanRepository {
  @override
  Future<void> insertScan(Object event) async {}

  @override
  Future<List<Object>> getUnsyncedScans({int limit = 50}) async => [];

  @override
  Future<void> markSynced(String eventId) async {}

  @override
  Future<int> countUnsynced() async => 0;
}
