import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../infrastructure/database/app_database.dart';
import '../../infrastructure/database/daos/log_entry_dao.dart';

enum LogLevel { debug, info, warning, error }

enum LogCategory {
  scanner,
  gps,
  mqtt,
  queue,
  sync,
  auth,
  camera,
  device,
  network,
  database,
  performance,
  bench,
}

class LoggerService {
  LoggerService._();

  static final LoggerService instance = LoggerService._();

  int _insertCount = 0;
  Timer? _cleanupTimer;

  LogEntryDao get _dao => AppDatabase.instance.logEntryDao;

  String? tripId;

  void log(
    LogLevel level,
    LogCategory category,
    String message, {
    String? eventId,
    Map<String, dynamic>? metadata,
  }) {
    final entry = <String, dynamic>{
      'timestamp': DateTime.now(),
      'level': level.name,
      'category': category.name,
      'eventId': eventId,
      'tripId': tripId,
      'message': message,
      'metadataJson': metadata != null ? jsonEncode(metadata) : null,
    };
    try {
      _dao.insert(entry);
      _insertCount++;
      if (_insertCount >= 100) {
        _insertCount = 0;
        _scheduleCleanup();
      }
    } catch (_) {}
  }

  void debug(LogCategory category, String message, {String? eventId, Map<String, dynamic>? metadata}) =>
      log(LogLevel.debug, category, message, eventId: eventId, metadata: metadata);

  void info(LogCategory category, String message, {String? eventId, Map<String, dynamic>? metadata}) =>
      log(LogLevel.info, category, message, eventId: eventId, metadata: metadata);

  void warning(LogCategory category, String message, {String? eventId, Map<String, dynamic>? metadata}) =>
      log(LogLevel.warning, category, message, eventId: eventId, metadata: metadata);

  void error(LogCategory category, String message, {String? eventId, Map<String, dynamic>? metadata}) =>
      log(LogLevel.error, category, message, eventId: eventId, metadata: metadata);

  void _scheduleCleanup() {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer(const Duration(seconds: 5), () {
      _dao.cleanOldEntries(keepCount: 10000);
    });
  }

  Future<List<Map<String, dynamic>>> getRecent({int limit = 100, String? category, String? level}) =>
      _dao.getRecent(limit: limit, category: category, level: level);

  Future<List<Map<String, dynamic>>> getByTripId(String tripId, {int limit = 1000}) =>
      _dao.getByTripId(tripId, limit: limit);

  Future<String> exportToJson({String? tripId}) async {
    final entries = tripId != null ? await _dao.getByTripId(tripId) : await _dao.getAll();
    final json = jsonEncode(entries);
    final dir = await getApplicationDocumentsDirectory();
    final filename = tripId != null
        ? 'logs_${tripId}_${DateTime.now().millisecondsSinceEpoch}.json'
        : 'logs_all_${DateTime.now().millisecondsSinceEpoch}.json';
    final file = File('${dir.path}/$filename');
    await file.writeAsString(json);
    return file.path;
  }

  Future<int> get totalCount => _dao.length;
}
