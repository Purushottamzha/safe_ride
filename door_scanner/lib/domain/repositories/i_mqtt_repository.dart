import '../entities/mqtt_connection_state.dart';

abstract class IMqttRepository {
  Future<bool> connect();
  void disconnect();
  Future<bool> publish(String topic, String payload);
  Stream<MqttConnectionState> get connectionState;
}
