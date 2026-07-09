import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/mqtt_connection_state.dart';
import '../../domain/repositories/i_mqtt_repository.dart';
import '../providers/mqtt_provider.dart';

class MqttState {
  final MqttConnectionState connectionState;
  final bool isConnected;
  final int pendingMessages;
  final int retryCount;
  final String? lastError;

  const MqttState({
    this.connectionState = MqttConnectionState.disconnected,
    this.isConnected = false,
    this.pendingMessages = 0,
    this.retryCount = 0,
    this.lastError,
  });

  MqttState copyWith({
    MqttConnectionState? connectionState,
    bool? isConnected,
    int? pendingMessages,
    int? retryCount,
    String? lastError,
  }) {
    return MqttState(
      connectionState: connectionState ?? this.connectionState,
      isConnected: isConnected ?? this.isConnected,
      pendingMessages: pendingMessages ?? this.pendingMessages,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
    );
  }
}

class MqttNotifier extends StateNotifier<MqttState> {
  final IMqttRepository _repository;
  final int _maxRetries = 5;
  int _retryCount = 0;

  MqttNotifier(this._repository) : super(const MqttState());

  Future<void> connect() async {
    state = state.copyWith(connectionState: MqttConnectionState.connecting);
    final success = await _repository.connect();
    if (success) {
      state = state.copyWith(
        connectionState: MqttConnectionState.connected,
        isConnected: true,
        retryCount: 0,
        lastError: null,
      );
    } else {
      _retryCount++;
      if (_retryCount < _maxRetries) {
        state = state.copyWith(
          connectionState: MqttConnectionState.reconnecting,
          retryCount: _retryCount,
        );
      } else {
        state = state.copyWith(
          connectionState: MqttConnectionState.error,
          isConnected: false,
          lastError: 'Max retries exceeded',
        );
      }
    }
  }

  void disconnect() {
    _repository.disconnect();
    _retryCount = 0;
    state = const MqttState();
  }

  void updateConnectionState(MqttConnectionState connectionState) {
    state = state.copyWith(
      connectionState: connectionState,
      isConnected: connectionState == MqttConnectionState.connected ||
        connectionState == MqttConnectionState.subscribed,
    );
  }
}

final mqttNotifierProvider = StateNotifierProvider<MqttNotifier, MqttState>((ref) {
  final repository = ref.read(mqttRepositoryProvider);
  return MqttNotifier(repository);
});
