import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

enum ConnectivityStatus { connected, disconnected }

class ConnectivityMonitor {
  static final ConnectivityMonitor instance = ConnectivityMonitor._();
  ConnectivityMonitor._();
  final _connectivity = Connectivity();
  final _statusController = StreamController<ConnectivityStatus>.broadcast();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  ConnectivityStatus _lastStatus = ConnectivityStatus.connected;

  Stream<ConnectivityStatus> get statusStream => _statusController.stream;
  ConnectivityStatus get currentStatus => _lastStatus;
  bool get isConnected => _lastStatus == ConnectivityStatus.connected;

  void startMonitoring() {
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final connected = results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet
      );
      _lastStatus = connected ? ConnectivityStatus.connected : ConnectivityStatus.disconnected;
      _statusController.add(_lastStatus);
    });
    _checkInitialConnectivity();
  }

  Future<void> _checkInitialConnectivity() async {
    try {
      final results = await _connectivity.checkConnectivity();
      final connected = results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet
      );
      _lastStatus = connected ? ConnectivityStatus.connected : ConnectivityStatus.disconnected;
    } catch (_) {
      _lastStatus = ConnectivityStatus.connected;
    }
  }

  void stopMonitoring() {
    _subscription?.cancel();
    _subscription = null;
  }

  void dispose() {
    stopMonitoring();
    _statusController.close();
  }
}
