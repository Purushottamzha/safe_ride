import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../infrastructure/network/connectivity_monitor.dart';

final connectivityMonitorProvider = Provider<ConnectivityMonitor>((ref) {
  return ConnectivityMonitor.instance;
});

final connectivityStreamProvider = StreamProvider<bool>((ref) {
  final monitor = ref.read(connectivityMonitorProvider);
  return monitor.statusStream.map((status) => status == ConnectivityStatus.connected);
});

final isOnlineProvider = Provider<bool>((ref) {
  return ConnectivityMonitor.instance.isConnected;
});
