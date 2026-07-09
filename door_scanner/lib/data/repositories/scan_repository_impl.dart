import '../../domain/repositories/i_scan_repository.dart';
import '../datasources/local/scan_local_datasource.dart';

class ScanRepositoryImpl implements IScanRepository {
  final ScanLocalDataSource _local = ScanLocalDataSource();

  @override
  Future<void> insertScan(Object event) async {
    final data = event as Map<String, dynamic>;
    await _local.insertScan({
      'eventId': data['eventId'] as String,
      'studentId': data['qrData'] as String? ?? '',
      'tripId': '',
      'scanType': 'qr',
      'timestamp': DateTime.tryParse(data['scannedAt'] as String? ?? '') ?? DateTime.now(),
      'syncStatus': 'pending',
    });
  }

  @override
  Future<List<Object>> getUnsyncedScans({int limit = 50}) async {
    final results = await _local.getUnsynced(limit: limit);
    return results.map((e) => e as Object).toList();
  }

  @override
  Future<void> markSynced(String eventId) async {
    await _local.markSyncedByEventId(eventId);
  }

  @override
  Future<int> countUnsynced() async {
    return _local.countUnsynced();
  }
}
