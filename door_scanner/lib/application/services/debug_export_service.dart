import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../core/constants/app_constants.dart';
import '../../infrastructure/database/app_database.dart';
import '../../infrastructure/mqtt/mqtt_publish_queue.dart';
import '../../infrastructure/network/connectivity_monitor.dart';
import 'logger_service.dart';

class DebugExportService {
  DebugExportService._();

  static final DebugExportService instance = DebugExportService._();

  Future<String> exportBundle() async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final bundleDir = Directory('${dir.path}/debug_bundle_$timestamp');
    await bundleDir.create(recursive: true);

    await _writeJsonFile(bundleDir, 'logs', await AppDatabase.instance.logEntryDao.getAll());
    await _writeJsonFile(bundleDir, 'mqtt_queue', await AppDatabase.instance.mqttQueueDao.getAll());
    await _writeJsonFile(bundleDir, 'scan_events', await AppDatabase.instance.scanEventDao.getAll());
    await _writeJsonFile(bundleDir, 'location_events',
        await AppDatabase.instance.locationEventDao.getAll());
    await _writeJsonFile(bundleDir, 'device_state',
        await AppDatabase.instance.deviceStateDao.getAll());

    final deviceInfo = <String, dynamic>{
      'timestamp': DateTime.now().toIso8601String(),
      'appVersion': AppConstants.appVersion,
      'mqttConnected': true,
      'connectivity':
          ConnectivityMonitor.instance.currentStatus.name,
      'gpsAvailable': true,
      'logCount': await AppDatabase.instance.logEntryDao.length,
      'queueLength': MqttPublishQueue.instance.length,
    };
    await _writeJsonFile(bundleDir, 'device', deviceInfo);

    LoggerService.instance.info(LogCategory.device, 'Debug bundle exported',
        metadata: {'path': bundleDir.path});
    return bundleDir.path;
  }

  Future<void> _writeJsonFile(Directory dir, String name, dynamic data) async {
    final file = File('${dir.path}/$name.json');
    await file.writeAsString(jsonEncode(data));
  }
}
