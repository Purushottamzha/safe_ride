class LocationPingsTable {
  final int id;
  final String eventId;
  final double latitude;
  final double longitude;
  final bool synced;
  final DateTime deviceTimestamp;
  const LocationPingsTable({required this.id, required this.eventId, required this.latitude, required this.longitude, required this.synced, required this.deviceTimestamp});
}
