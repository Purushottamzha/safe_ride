import 'dart:convert';
import '../repositories/i_mqtt_repository.dart';

class PublishHeartbeatUseCase {
  final IMqttRepository _mqttRepository;

  PublishHeartbeatUseCase(this._mqttRepository);

  Future<bool> execute({
    required String topic,
    required Map<String, dynamic> payload,
  }) async {
    try {
      payload['timestamp'] = DateTime.now().toIso8601String();
      return await _mqttRepository.publish(topic, jsonEncode(payload));
    } catch (_) {
      return false;
    }
  }
}
