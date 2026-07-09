import 'dart:async';
import 'dart:convert';
import 'package:uuid/uuid.dart';
import '../../domain/repositories/i_mqtt_repository.dart';
import '../../domain/entities/mqtt_connection_state.dart';
import '../datasources/mqtt/mqtt_topic_provider.dart';
import '../../infrastructure/mqtt/mqtt_connection_manager.dart';
import '../../infrastructure/mqtt/mqtt_publish_queue.dart';

class MqttRepositoryImpl implements IMqttRepository {
  final MqttConnectionManager _connectionManager;
  final MqttPublishQueue _publishQueue;
  final MqttTopicProvider? _topicProvider;
  final _uuid = const Uuid();

  MqttRepositoryImpl({
    MqttConnectionManager? connectionManager,
    MqttPublishQueue? publishQueue,
    MqttTopicProvider? topicProvider,
  })  : _connectionManager = connectionManager ?? MqttConnectionManager.instance,
        _publishQueue = publishQueue ?? MqttPublishQueue.instance,
        _topicProvider = topicProvider;

  @override
  Future<bool> connect() async {
    return _connectionManager.connect();
  }

  @override
  void disconnect() {
    _connectionManager.disconnect();
  }

  @override
  Future<bool> publish(String topic, String payload) async {
    final eventId = _uuid.v4();
    return _publishQueue.publish(topic, payload, eventId);
  }

  Future<bool> publishEvent(String eventType, Map<String, dynamic> data) async {
    final provider = _topicProvider;
    if (provider == null) return false;
    final topic = provider.eventTopic(eventType);
    final eventId = _uuid.v4();
    data['eventId'] = eventId;
    data['deviceTimestamp'] = DateTime.now().toIso8601String();
    final payload = jsonEncode(data);
    return _publishQueue.publish(topic, payload, eventId);
  }

  @override
  Stream<MqttConnectionState> get connectionState {
    return _connectionManager.stateStream;
  }

  MqttConnectionState get currentState => _connectionManager.currentState;

  bool get isConnected => _connectionManager.isConnected;
}
