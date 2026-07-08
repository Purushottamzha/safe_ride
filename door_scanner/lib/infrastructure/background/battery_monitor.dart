class BatteryMonitor {
  static final BatteryMonitor instance = BatteryMonitor._();
  BatteryMonitor._();
  void start() {}
  void stop() {}
  int get level => 100;
}
