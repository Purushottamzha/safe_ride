class LocationPingModel {
  final String eventId;
  final double latitude;
  final double longitude;
  const LocationPingModel({required this.eventId, required this.latitude, required this.longitude});
  factory LocationPingModel.fromJson(Map<String, dynamic> json) => LocationPingModel(eventId: json['eventId'] as String, latitude: json['latitude'] as double, longitude: json['longitude'] as double);
  Map<String, dynamic> toJson() => <String, dynamic>{'eventId': eventId, 'latitude': latitude, 'longitude': longitude};
}
