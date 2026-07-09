import 'dart:async';
import 'dart:convert';
import 'package:battery_plus/battery_plus.dart';
import 'package:uuid/uuid.dart';
import '../../core/constants/app_constants.dart';
import '../platform/battery_wrapper.dart';
import '../platform/location_wrapper.dart';
import '../network/connectivity_monitor.dart';
import '../storage/secure_storage.dart';
import 'mqtt_publish_queue.dart';

class MqttHeartbeatScheduler {
  static final MqttHeartbeatScheduler instance = MqttHeartbeatScheduler._();
  MqttHeartbeatScheduler._();

  Timer? _timer;
  DateTime? _lastGpsFixTime;
  double _lastGpsFixAccuracy = 0;
  int _intervalSeconds = AppConstants.defaultHeartbeatIntervalSeconds;
  bool _isRunning = false;

  bool get isRunning => _isRunning;

  void setInterval(int seconds) {
    _intervalSeconds = seconds;
    if (_isRunning) {
      stop();
      start();
    }
  }

  Future<void> start() async {
    if (_isRunning) return;
    _isRunning = true;
    await _sendHeartbeat();
    _timer = Timer.periodic(Duration(seconds: _intervalSeconds), (_) {
      _sendHeartbeat();
    });
  }

  void stop() {
    _isRunning = false;
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _sendHeartbeat() async {
    try {
      final storage = SecureStorage();
      final deviceConfig = await storage.getDeviceConfig();
      final deviceId = deviceConfig?.deviceId ?? 'unknown';
      final schoolId = deviceConfig?.schoolId ?? '';
      final busId = deviceConfig?.busId ?? '';

      if (schoolId.isEmpty || busId.isEmpty) return;

      final batteryWrapper = BatteryWrapper.instance;
      final batteryLevel = await batteryWrapper.getBatteryLevel();
      final batteryState = await batteryWrapper.getBatteryState();

      final connectivity = ConnectivityMonitor.instance.currentStatus;
      final gpsAvailable = await _checkGpsAvailability();
      final gpsLastFixAge = _lastGpsFixSeconds();
      final gpsAccuracy = _lastGpsAccuracy();

      final eventId = const Uuid().v4();
      final payload = {
        'eventId': eventId,
        'deviceId': deviceId,
        'timestamp': DateTime.now().toIso8601String(),
        'batteryLevel': batteryLevel,
        'isCharging': batteryState == BatteryState.charging,
        'connectivity': connectivity == ConnectivityStatus.connected ? 'online' : 'offline',
        'gpsAvailable': gpsAvailable,
        'gps': {
          'enabled': gpsAvailable,
          'permission': gpsAvailable ? 'granted' : 'unknown',
          'tracking': gpsAvailable,
          'lastFixAge': gpsLastFixAge,
          'accuracy': gpsAccuracy,
        },
        'appVersion': AppConstants.appVersion,
        'deviceModel': deviceConfig?.name ?? 'unknown',
        'scannerStatus': 'idle',
        'storageFree': 0,
      };

      final topic = 'saferide/$schoolId/bus/$busId/heartbeat';
      await MqttPublishQueue.instance.publish(topic, jsonEncode(payload), eventId);
    } catch (_) {}
  }

  Future<bool> _checkGpsAvailability() async {
    try {
      final position = await LocationWrapper.instance.getCurrentPosition();
      _lastGpsFixTime = position.timestamp;
      _lastGpsFixAccuracy = position.accuracy;
      return position.latitude != 0 || position.longitude != 0;
    } catch (_) {
      return false;
    }
  }

  int _lastGpsFixSeconds() {
    if (_lastGpsFixTime == null) return -1;
    return DateTime.now().difference(_lastGpsFixTime!).inSeconds;
  }

  double _lastGpsAccuracy() {
    return _lastGpsFixAccuracy;
  }
}
