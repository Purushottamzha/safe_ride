class TripModel {
  final String tripId;
  final String status;
  const TripModel({required this.tripId, required this.status});
  factory TripModel.fromJson(Map<String, dynamic> json) => TripModel(tripId: json['tripId'] as String, status: json['status'] as String);
  Map<String, dynamic> toJson() => <String, dynamic>{'tripId': tripId, 'status': status};
}
