import 'package:battery_plus/battery_plus.dart';

class BatteryWrapper {
  static final BatteryWrapper instance = BatteryWrapper._();
  BatteryWrapper._();
  final _battery = Battery();

  Future<int> getBatteryLevel() async {
    try {
      return await _battery.batteryLevel;
    } catch (_) {
      return 100;
    }
  }

  Future<BatteryState> getBatteryState() async {
    try {
      return await _battery.batteryState;
    } catch (_) {
      return BatteryState.full;
    }
  }

  Stream<BatteryState> get onBatteryStateChanged => _battery.onBatteryStateChanged;
}
