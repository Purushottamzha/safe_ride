class BatteryWrapper {
  static final BatteryWrapper instance = BatteryWrapper._();
  BatteryWrapper._();
  Future<int> getBatteryLevel() async => 100;
}
