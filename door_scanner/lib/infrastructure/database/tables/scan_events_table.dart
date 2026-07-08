class ScanEventsTable {
  final int id;
  final String eventId;
  final String qrToken;
  final bool synced;
  final DateTime deviceTimestamp;
  const ScanEventsTable({required this.id, required this.eventId, required this.qrToken, required this.synced, required this.deviceTimestamp});
}
