import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/i_mqtt_repository.dart';
import '../../domain/entities/mqtt_connection_state.dart';
import '../../data/repositories/mqtt_repository_impl.dart';

final mqttRepositoryProvider = Provider<IMqttRepository>((ref) {
  return MqttRepositoryImpl();
});

final mqttConnectionStateProvider = StreamProvider<MqttConnectionState>((ref) {
  final repo = ref.read(mqttRepositoryProvider);
  return repo.connectionState;
});

final mqttIsConnectedProvider = Provider<bool>((ref) {
  final repo = ref.read(mqttRepositoryProvider) as MqttRepositoryImpl;
  return repo.isConnected;
});
