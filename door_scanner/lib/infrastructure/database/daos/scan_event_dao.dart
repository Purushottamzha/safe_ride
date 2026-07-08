class ScanEventDao {
  Future<void> insertScan(Map<String, dynamic> data) async {}
  Future<List<Map<String, dynamic>>> getUnsyncedScans({int limit = 50}) async => [];
}
