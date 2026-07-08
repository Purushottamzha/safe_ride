class LocationWrapper {
  static final LocationWrapper instance = LocationWrapper._();
  LocationWrapper._();
  Future<Map<String, dynamic>> getCurrentLocation() async => {};
  void startListening() {}
  void stopListening() {}
}
