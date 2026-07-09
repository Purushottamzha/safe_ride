import 'dart:async';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import '../../../core/constants/mqtt_constants.dart';
import '../../../core/errors/mqtt_exception.dart';
import '../../../domain/entities/device_config.dart';

class MqttDataSource {
  static final MqttDataSource instance = MqttDataSource._();
  MqttDataSource._();

  MqttServerClient? _client;
  final _messageController = StreamController<MqttReceivedMessage>.broadcast();
  final _connectionStateController = StreamController<MqttConnectionState>.broadcast();
  bool _isConnected = false;
  StreamSubscription<List<MqttReceivedMessage>>? _updatesSub;

  Stream<MqttReceivedMessage> get messageStream => _messageController.stream;
  Stream<MqttConnectionState> get connectionStateStream => _connectionStateController.stream;
  bool get isConnected => _isConnected;

  Future<bool> connect({
    required DeviceConfig deviceConfig,
    required String clientId,
    String? host,
    int? port,
  }) async {
    try {
      disconnect();

      host ??= 'localhost';
      port ??= 1883;

      _client = MqttServerClient(host, clientId);
      _client!.port = port;
      _client!.keepAlivePeriod = MqttConstants.keepAliveSeconds;
      _client!.connectTimeoutPeriod = 10000;
      _client!.autoReconnect = false;
      _client!.logging(on: false);

      _client!.onConnected = () {
        _isConnected = true;
        _connectionStateController.add(MqttConnectionState.connected);
      };

      _client!.onDisconnected = () {
        _isConnected = false;
        _connectionStateController.add(MqttConnectionState.disconnected);
      };

      final connMessage = MqttConnectMessage()
        .withClientIdentifier(clientId)
        .withWillTopic('saferide/device/$clientId/status')
        .withWillMessage('offline')
        .withWillQos(MqttQos.atLeastOnce);

      if (deviceConfig.apiKey.isNotEmpty) {
        connMessage.authenticateAs(deviceConfig.apiKey, deviceConfig.apiKey);
      }

      _client!.connectionMessage = connMessage;

      final status = await _client!.connect();
      if (status == null || status.state != MqttConnectionState.connected) {
        _isConnected = false;
        throw MqttException(
          'Connection failed: ${status?.returnCode ?? "no response"}',
          code: 'CONNECTION_FAILED',
        );
      }

      _updatesSub = _client!.updates?.listen((messages) {
        for (final msg in messages) {
          _messageController.add(msg);
        }
      });

      return true;
    } catch (e) {
      _isConnected = false;
      if (e is MqttException) rethrow;
      throw MqttException('Connection error: $e', code: 'CONNECTION_ERROR');
    }
  }

  Future<bool> subscribeToDeviceTopics() async {
    if (_client == null || !_isConnected) return false;
    try {
      _client!.subscribe('saferide/+/bus/+/command', MqttQos.atLeastOnce);
      return true;
    } catch (_) {
      return false;
    }
  }

  void subscribe(String topic, {MqttQos qos = MqttQos.atLeastOnce}) {
    if (_client == null || !_isConnected) return;
    _client!.subscribe(topic, qos);
  }

  void publish(String topic, String payload, {MqttQos qos = MqttQos.atLeastOnce, bool retain = false}) {
    if (_client == null || !_isConnected) return;
    final builder = MqttClientPayloadBuilder();
    builder.addString(payload);
    _client!.publishMessage(topic, qos, builder.payload!, retain: retain);
  }

  void disconnect() {
    _isConnected = false;
    _updatesSub?.cancel();
    _updatesSub = null;
    try {
      _client?.disconnect();
    } catch (_) {}
    _client = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionStateController.close();
  }
}
