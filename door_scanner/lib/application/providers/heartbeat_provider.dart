import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../infrastructure/mqtt/mqtt_heartbeat_scheduler.dart';

final heartbeatSchedulerProvider = Provider<MqttHeartbeatScheduler>((ref) {
  return MqttHeartbeatScheduler.instance;
});

final isHeartbeatRunningProvider = Provider<bool>((ref) {
  return MqttHeartbeatScheduler.instance.isRunning;
});
