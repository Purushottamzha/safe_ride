import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/notifiers/gps_notifier.dart';
import '../../../application/notifiers/mqtt_notifier.dart';
import '../../../application/notifiers/scanner_notifier.dart';
import '../../../application/services/bench_service.dart';
import '../../../application/services/debug_export_service.dart';
import '../../../application/services/logger_service.dart';
import '../../../application/services/trip_service.dart';
import '../../../infrastructure/database/app_database.dart';
import '../../../infrastructure/mqtt/mqtt_heartbeat_scheduler.dart';
import '../../../infrastructure/mqtt/mqtt_publish_queue.dart';
import 'diagnostics_provider.dart';

class DiagnosticsScreen extends ConsumerStatefulWidget {
  const DiagnosticsScreen({super.key});

  @override
  ConsumerState<DiagnosticsScreen> createState() => _DiagnosticsScreenState();
}

class _DiagnosticsScreenState extends ConsumerState<DiagnosticsScreen> {
  Timer? _autoRefreshTimer;
  bool _exporting = false;

  @override
  void initState() {
    super.initState();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (ref.read(autoRefreshProvider)) {
        ref.read(diagnosticsRefreshProvider.notifier).state++;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(diagnosticsRefreshProvider);
    final autoRefresh = ref.watch(autoRefreshProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Diagnostics'),
        actions: [
          IconButton(
            icon: Icon(autoRefresh ? Icons.sync : Icons.sync_disabled),
            onPressed: () => ref.read(autoRefreshProvider.notifier).state = !autoRefresh,
            tooltip: autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(diagnosticsRefreshProvider.notifier).state++,
          ),
          IconButton(
            icon: _exporting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.download),
            onPressed: _exporting ? null : _exportBundle,
            tooltip: 'Export debug bundle',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _section('System Status', [
            _statusTile('MQTT', _mqttStatus(), Icons.cloud, _mqttColor()),
            _statusTile('GPS', _gpsStatus(), Icons.location_on, _gpsColor()),
            _statusTile('Scanner', _scannerStatus(), Icons.qr_code_scanner, _scannerColor()),
            _statusTile('Database', _dbStatus(), Icons.storage, _dbColor()),
            _statusTile('Heartbeat',
                MqttHeartbeatScheduler.instance.isRunning ? 'Running' : 'Stopped',
                Icons.favorite,
                MqttHeartbeatScheduler.instance.isRunning ? Colors.green : Colors.grey),
          ]),
          const SizedBox(height: 12),
          _section('Queue', [
            _infoRow('Pending', MqttPublishQueue.instance.pending.length.toString()),
            _infoRow('Total', MqttPublishQueue.instance.length.toString()),
          ]),
          const SizedBox(height: 12),
          _section('GPS', _gpsCards()),
          const SizedBox(height: 12),
          _section('Scanner', _scannerCards()),
          const SizedBox(height: 12),
          _section('App', [
            _infoRow('Trip ID', TripService.instance.currentTripId ?? 'none'),
            _infoRow('Log Count', LoggerService.instance.totalCount.toString()),
          ]),
          const SizedBox(height: 12),
          _section('Bench Mode', _benchControls()),
          const SizedBox(height: 12),
          _section('Recent Logs', [_buildLogList()]),
        ],
      ),
    );
  }

  List<Widget> _gpsCards() {
    final gpsState = ref.watch(gpsNotifierProvider);
    final pos = gpsState.position;
    return [
      _infoRow('Permission', gpsState.permission.name),
      _infoRow('Service', gpsState.service.name),
      _infoRow('Listening', gpsState.isListening.toString()),
      _infoRow('Tracking', gpsState.trackingPolicy),
      if (pos != null) ...[
        _infoRow('Latitude', pos.latitude.toStringAsFixed(6)),
        _infoRow('Longitude', pos.longitude.toStringAsFixed(6)),
        _infoRow('Accuracy', '${pos.accuracy.toStringAsFixed(1)} m'),
        _infoRow('Speed', '${(pos.speed * 3.6).toStringAsFixed(1)} km/h'),
        _infoRow('Heading', '${pos.heading.toStringAsFixed(1)}°'),
      ],
    ];
  }

  List<Widget> _scannerCards() {
    final scannerState = ref.watch(scannerNotifierProvider);
    return [
      _infoRow('Scanning', scannerState.isScanning.toString()),
      _infoRow('Flash', scannerState.isFlashOn.toString()),
      _infoRow('Queue', scannerState.queuedCount.toString()),
      _infoRow('Last Result', scannerState.lastResult?.name ?? 'none'),
    ];
  }

  List<Widget> _benchControls() {
    final bench = BenchService.instance;
    return [
      _infoRow('Bench Mode', bench.isRunning ? 'Running' : 'Stopped'),
      _infoRow('Scans Generated', bench.scanCount.toString()),
      _infoRow('GPS Fixes', bench.gpsCount.toString()),
      const SizedBox(height: 8),
      Row(
        children: [
          ElevatedButton(
            onPressed: bench.isRunning
                ? null
                : () {
                    bench.startScanBench(interval: const Duration(seconds: 2));
                    setState(() {});
                  },
            child: const Text('Start Scan'),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: bench.isRunning
                ? null
                : () {
                    bench.startGpsBench(interval: const Duration(seconds: 5));
                    setState(() {});
                  },
            child: const Text('Start GPS'),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: bench.isRunning ? () => bench.stop() : null,
            child: const Text('Stop'),
          ),
        ],
      ),
    ];
  }

  Widget _buildLogList() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: LoggerService.instance.getRecent(limit: 50),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final logs = snapshot.data!;
        if (logs.isEmpty) return const Text('No logs');
        return SizedBox(
          height: 300,
          child: ListView.separated(
            itemCount: logs.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final log = logs[i];
              final ts = (log['timestamp'] as DateTime?)?.toIso8601String().substring(11, 19) ?? '';
              final cat = log['category'] as String? ?? '';
              final msg = log['message'] as String? ?? '';
              final level = log['level'] as String? ?? '';
              final color = level == 'error'
                  ? Colors.red
                  : level == 'warning'
                      ? Colors.orange
                      : null;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 60, child: Text(ts, style: TextStyle(fontSize: 10, color: Colors.grey[600]))),
                    SizedBox(width: 50, child: Text('[$cat]', style: TextStyle(fontSize: 10, color: Colors.grey[500]))),
                    Expanded(
                      child: Text(msg, style: TextStyle(fontSize: 11, color: color), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const Divider(),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _statusTile(String label, String value, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Text('$label: ', style: Theme.of(context).textTheme.bodyMedium),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodySmall)),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodySmall)),
        ],
      ),
    );
  }

  String _mqttStatus() {
    final state = ref.watch(mqttNotifierProvider);
    return state.connectionState.name;
  }

  Color _mqttColor() {
    final state = ref.watch(mqttNotifierProvider);
    final name = state.connectionState.name;
    if (name == 'connected' || name == 'subscribed') return Colors.green;
    if (name == 'connecting' || name == 'reconnecting') return Colors.orange;
    return Colors.red;
  }

  String _gpsStatus() {
    final gps = ref.watch(gpsNotifierProvider);
    if (gps.permission != GpsPermissionState.granted) return 'No permission';
    if (gps.service != GpsServiceState.enabled) return 'Disabled';
    if (gps.isListening) return 'Active';
    return 'Idle';
  }

  Color _gpsColor() {
    final gps = ref.watch(gpsNotifierProvider);
    if (gps.isListening && gps.position != null) return Colors.green;
    if (gps.permission == GpsPermissionState.granted) return Colors.orange;
    return Colors.red;
  }

  String _scannerStatus() {
    final state = ref.watch(scannerNotifierProvider);
    if (state.error != null) return 'Error';
    if (state.isScanning) return 'Active';
    return 'Idle';
  }

  Color _scannerColor() {
    final state = ref.watch(scannerNotifierProvider);
    if (state.error != null) return Colors.red;
    if (state.isScanning) return Colors.green;
    return Colors.grey;
  }

  String _dbStatus() {
    try {
      AppDatabase.instance;
      return 'OK';
    } catch (_) {
      return 'Error';
    }
  }

  Color _dbColor() {
    try {
      AppDatabase.instance;
      return Colors.green;
    } catch (_) {
      return Colors.red;
    }
  }

  Future<void> _exportBundle() async {
    setState(() => _exporting = true);
    try {
      final path = await DebugExportService.instance.exportBundle();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Exported to $path'), duration: const Duration(seconds: 4)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }
}
