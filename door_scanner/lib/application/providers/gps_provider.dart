export '../notifiers/gps_notifier.dart' show gpsNotifierProvider, GpsState, GpsPermissionState, GpsServiceState;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../notifiers/gps_notifier.dart';

final gpsAvailableProvider = Provider<bool>((ref) {
  return ref.watch(gpsNotifierProvider).canTrack;
});

final gpsStateProvider = Provider<GpsState>((ref) {
  return ref.watch(gpsNotifierProvider);
});
