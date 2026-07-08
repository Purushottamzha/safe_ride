class ScanEventModel {
  final String eventId;
  final String qrToken;
  const ScanEventModel({required this.eventId, required this.qrToken});
  factory ScanEventModel.fromJson(Map<String, dynamic> json) => ScanEventModel(eventId: json['eventId'] as String, qrToken: json['qrToken'] as String);
  Map<String, dynamic> toJson() => <String, dynamic>{'eventId': eventId, 'qrToken': qrToken};
}
