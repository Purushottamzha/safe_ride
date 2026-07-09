import '../../infrastructure/database/app_database.dart';
import '../../infrastructure/mqtt/mqtt_connection_manager.dart';
import '../../infrastructure/mqtt/mqtt_heartbeat_scheduler.dart';
import '../../infrastructure/mqtt/mqtt_offline_queue.dart';
import '../../infrastructure/mqtt/mqtt_publish_queue.dart';
import '../../infrastructure/mqtt/mqtt_ack_tracker.dart';
import '../../infrastructure/network/connectivity_monitor.dart';

class LifecycleService {
  LifecycleService._();

  static final LifecycleService instance = LifecycleService._();

  Future<void> initialize() async {
    await AppDatabase.initialize();
    await _recoverFromCrash();
    ConnectivityMonitor.instance.startMonitoring();
  }

  Future<void> _recoverFromCrash() async {
    final dao = AppDatabase.instance.mqttQueueDao;
    final stuckCount = await dao.countByStatus('publishing') +
        await dao.countByStatus('waiting_puback');
    if (stuckCount > 0) {
      final stuckMessages = await dao.getByStatuses(['publishing', 'waiting_puback']);
      for (final msg in stuckMessages) {
        await dao.updateStatus(msg['event_id'] as String, 'queued');
      }
    }
  }

  Future<void> startMqtt() async {
    await MqttConnectionManager.instance.connect();
  }

  void stopMqtt() {
    MqttHeartbeatScheduler.instance.stop();
    MqttConnectionManager.instance.disconnect();
  }

  void dispose() {
    stopMqtt();
    ConnectivityMonitor.instance.dispose();
    MqttAckTracker.instance.dispose();
    MqttPublishQueue.instance.clear();
    MqttOfflineQueue.instance.clear();
  }
}
