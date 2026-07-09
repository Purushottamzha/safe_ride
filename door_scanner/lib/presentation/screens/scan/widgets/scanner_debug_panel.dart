import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../../../infrastructure/platform/camera_wrapper.dart';
import '../../../../application/services/scanner_service.dart';
import '../../../../application/notifiers/gps_notifier.dart';

class ScannerDebugPanel extends StatefulWidget {
  final Widget child;
  final GpsState? gpsState;

  const ScannerDebugPanel({super.key, required this.child, this.gpsState});

  @override
  State<ScannerDebugPanel> createState() => _ScannerDebugPanelState();
}

class _ScannerDebugPanelState extends State<ScannerDebugPanel> {
  bool _visible = false;
  Timer? _fpsTimer;
  String _lastPayload = '';
  String _lastEventId = '';
  int _queueLength = 0;
  String _mqttState = 'unknown';
  int _batteryLevel = 0;
  String _gpsState = 'unknown';
  String _gpsCoords = '';
  String _gpsAccuracy = '';
  String _gpsSpeed = '';
  int _pendingRetries = 0;
  int _tapCount = 0;
  Timer? _tapTimer;

  @override
  void dispose() {
    _fpsTimer?.cancel();
    _tapTimer?.cancel();
    super.dispose();
  }

  void _onDiagnosticTap() {
    _tapTimer?.cancel();
    _tapCount++;
    if (_tapCount >= 5) {
      setState(() => _visible = !_visible);
      _tapCount = 0;
      if (_visible) _startPolling();
    } else {
      _tapTimer = Timer(const Duration(seconds: 2), () => _tapCount = 0);
    }
  }

  void _startPolling() {
    _fpsTimer?.cancel();
    _fpsTimer = Timer.periodic(const Duration(seconds: 1), (_) => _poll());
  }

  void _poll() {
    if (!mounted || !_visible) return;
    final service = ScannerService.instance;
    final camState = CameraWrapper.instance.controller.value;
    final gps = widget.gpsState;
    setState(() {
      _lastPayload = service.lastScanTime != null
          ? (service.lastResult?.toString() ?? 'none')
          : 'none';
      _lastEventId = '';
      _queueLength = 0;
      _mqttState = camState.isRunning ? 'camera: running' : 'camera: stopped';
      _batteryLevel = 0;
      _pendingRetries = 0;
      if (gps != null) {
        _gpsState = gps.canTrack
            ? 'tracking'
            : 'perm:${gps.permission.name} svc:${gps.service.name}';
        if (gps.position != null) {
          final p = gps.position!;
          _gpsCoords = '${p.latitude.toStringAsFixed(5)}, ${p.longitude.toStringAsFixed(5)}';
          _gpsAccuracy = '±${p.accuracy.toStringAsFixed(0)}m';
          _gpsSpeed = '${p.speed.toStringAsFixed(1)} m/s';
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _onDiagnosticTap,
      child: Stack(
        children: [
          widget.child,
          if (_visible && !kReleaseMode)
            Positioned(
              top: 100,
              right: 8,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 300),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.yellow, width: 1),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('DEBUG', style: TextStyle(color: Colors.yellow, fontSize: 11, fontWeight: FontWeight.bold)),
                    const Divider(color: Colors.yellow, height: 8),
                    _row('Camera', CameraWrapper.instance.isRunning ? 'running' : 'stopped'),
                    _row('Init', '${CameraWrapper.instance.isInitialized}'),
                    _row('Error', CameraWrapper.instance.error?.errorCode.name ?? 'none'),
                    _row('Last scan', _lastPayload),
                    _row('eventId', _lastEventId.isEmpty ? '—' : _lastEventId),
                    _row('Queue', '$_queueLength'),
                    _row('MQTT', _mqttState),
                    _row('Battery', '$_batteryLevel%'),
                    _row('Retries', '$_pendingRetries'),
                    _row('GPS', _gpsState),
                    if (_gpsCoords.isNotEmpty) _row('Coords', _gpsCoords),
                    if (_gpsAccuracy.isNotEmpty) _row('Accuracy', _gpsAccuracy),
                    if (_gpsSpeed.isNotEmpty) _row('Speed', _gpsSpeed),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        children: [
          SizedBox(
            width: 65,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 10), overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
