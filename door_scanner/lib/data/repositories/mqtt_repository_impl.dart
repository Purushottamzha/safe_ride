import '../../domain/repositories/i_mqtt_repository.dart';

class MqttRepositoryImpl implements IMqttRepository {
  @override
  Future<bool> connect() async => false;

  @override
  Future<void> disconnect() async {}

  @override
  Future<bool> publish(String topic, String payload) async => false;

  @override
  Stream<Object> get connectionState => const Stream.empty();
}
