import 'dart:math';
import '../../core/constants/mqtt_constants.dart';

class MqttReconnectStrategy {
  static final MqttReconnectStrategy instance = MqttReconnectStrategy._();
  MqttReconnectStrategy._();
  int _attempt = 0;

  int get attempt => _attempt;

  void reset() {
    _attempt = 0;
  }

  void onDisconnect() {
    _attempt++;
  }

  void onConnect() {
    reset();
  }

  Duration nextDelay() {
    _attempt++;
    final expDelay = (pow(2, _attempt) * MqttConstants.minReconnectDelaySeconds).toInt();
    final clamped = expDelay.clamp(MqttConstants.minReconnectDelaySeconds, MqttConstants.maxReconnectDelaySeconds);
    final jitter = Random().nextInt((clamped * 0.5).ceil()) + 1;
    return Duration(seconds: clamped + jitter);
  }
}
