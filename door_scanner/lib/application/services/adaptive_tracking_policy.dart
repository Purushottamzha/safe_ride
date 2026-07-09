class TrackingPolicy {
  final Duration interval;
  final int distanceFilter;

  const TrackingPolicy({
    required this.interval,
    required this.distanceFilter,
  });

  static const parked = TrackingPolicy(
    interval: Duration(seconds: 30),
    distanceFilter: 20,
  );

  static const slow = TrackingPolicy(
    interval: Duration(seconds: 10),
    distanceFilter: 10,
  );

  static const moving = TrackingPolicy(
    interval: Duration(seconds: 5),
    distanceFilter: 5,
  );

  static const active = TrackingPolicy(
    interval: Duration(seconds: 3),
    distanceFilter: 3,
  );

  static TrackingPolicy forSpeed(double speedMps) {
    if (speedMps < 0.5) return parked;
    if (speedMps < 5.0) return slow;
    if (speedMps < 15.0) return moving;
    return active;
  }
}
