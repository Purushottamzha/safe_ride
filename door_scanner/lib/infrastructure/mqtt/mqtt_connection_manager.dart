import 'dart:async';
import 'package:uuid/uuid.dart';
import '../../domain/entities/mqtt_connection_state.dart' as domain;
import '../../core/errors/mqtt_exception.dart';
import '../storage/secure_storage.dart';
import '../../data/datasources/mqtt/mqtt_datasource.dart';
import '../database/app_database.dart';
import 'mqtt_reconnect_strategy.dart';
import 'mqtt_publish_queue.dart';
import 'mqtt_offline_queue.dart';
import 'mqtt_ack_tracker.dart';
import 'mqtt_heartbeat_scheduler.dart';

class MqttConnectionManager {
  static final MqttConnectionManager instance = MqttConnectionManager._();
  MqttConnectionManager._();

  final _reconnectStrategy = MqttReconnectStrategy.instance;
  final _publishQueue = MqttPublishQueue.instance;
  final _offlineQueue = MqttOfflineQueue.instance;
  final _ackTracker = MqttAckTracker.instance;
  final _heartbeatScheduler = MqttHeartbeatScheduler.instance;
  final _uuid = const Uuid();
  final _stateController = StreamController<domain.MqttConnectionState>.broadcast();
  Timer? _reconnectTimer;
  Timer? _offlineFlushTimer;
  bool _intentionalDisconnect = false;
  bool _subscribed = false;
  String? _clientId;

  Stream<domain.MqttConnectionState> get stateStream => _stateController.stream;
  domain.MqttConnectionState get currentState => _currentState;
  domain.MqttConnectionState _currentState = domain.MqttConnectionState.disconnected;
  bool get isConnected => _currentState == domain.MqttConnectionState.connected ||
    _currentState == domain.MqttConnectionState.subscribed;

  void _setState(domain.MqttConnectionState state) {
    _currentState = state;
    _stateController.add(state);
  }

  Future<bool> connect() async {
    if (isConnected) return true;
    _intentionalDisconnect = false;
    _setState(domain.MqttConnectionState.connecting);

    try {
      final storage = SecureStorage();
      final deviceConfig = await storage.getDeviceConfig();
      if (deviceConfig == null) {
        throw const MqttException('Device not registered', code: 'NOT_REGISTERED');
      }

      _clientId = 'scanner_${deviceConfig.deviceId}_${_uuid.v4().substring(0, 8)}';

      final dataSource = MqttDataSource.instance;
      final connected = await dataSource.connect(
        deviceConfig: deviceConfig,
        clientId: _clientId!,
      );

      if (!connected) {
        _setState(domain.MqttConnectionState.disconnected);
        _scheduleReconnect();
        return false;
      }

      _subscribed = await dataSource.subscribeToDeviceTopics();
      _setState(_subscribed
        ? domain.MqttConnectionState.subscribed
        : domain.MqttConnectionState.connected);

      _ackTracker.clear();
      _setupPublishQueue();
      _heartbeatScheduler.start();
      await _recoverFromCrash();
      await _flushOfflineQueue();
      _startOfflineFlush();
      _reconnectStrategy.onConnect();

      return true;
    } catch (e) {
      _setState(domain.MqttConnectionState.error);
      _scheduleReconnect();
      return false;
    }
  }

  void _setupPublishQueue() {
    _publishQueue.publishFn = (topic, payload, eventId) {
      try {
        MqttDataSource.instance.publish(topic, payload);
        return true;
      } catch (_) {
        return false;
      }
    };
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

  Future<void> _flushOfflineQueue() async {
    final batch = await _offlineQueue.flushBatch();
    for (final msg in batch) {
      _publishQueue.publish(msg.topic, msg.payload, msg.eventId);
    }
  }

  void _startOfflineFlush() {
    _offlineFlushTimer?.cancel();
    _offlineFlushTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      if (!isConnected) return;
      await _flushOfflineQueue();
    });
  }

  void _scheduleReconnect() {
    if (_intentionalDisconnect) return;
    _reconnectTimer?.cancel();
    final delay = _reconnectStrategy.nextDelay();
    _reconnectTimer = Timer(delay, () {
      _setState(domain.MqttConnectionState.reconnecting);
      connect();
    });
  }

  void disconnect() {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _offlineFlushTimer?.cancel();
    _heartbeatScheduler.stop();
    _ackTracker.clear();
    _subscribed = false;
    MqttDataSource.instance.disconnect();
    _setState(domain.MqttConnectionState.disconnected);
  }

  void dispose() {
    disconnect();
    _stateController.close();
  }
}
