import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../services/interpolation_engine.dart';

enum MapFollowMode { none, follow }

enum MapCameraMode { follow, free }

class MapState {
  final MapFollowMode followMode;
  final MapCameraMode cameraMode;
  final bool showCompass;
  final LatLng? targetPosition;
  final double heading;
  final double speed;
  final double accuracy;
  final DateTime? lastFixTime;
  final bool isPredicting;
  final List<LatLng> trailPoints;

  const MapState({
    this.followMode = MapFollowMode.follow,
    this.cameraMode = MapCameraMode.follow,
    this.showCompass = true,
    this.targetPosition,
    this.heading = 0,
    this.speed = 0,
    this.accuracy = 0,
    this.lastFixTime,
    this.isPredicting = false,
    this.trailPoints = const [],
  });

  MapState copyWith({
    MapFollowMode? followMode,
    MapCameraMode? cameraMode,
    bool? showCompass,
    LatLng? targetPosition,
    double? heading,
    double? speed,
    double? accuracy,
    DateTime? lastFixTime,
    bool? isPredicting,
    List<LatLng>? trailPoints,
  }) {
    return MapState(
      followMode: followMode ?? this.followMode,
      cameraMode: cameraMode ?? this.cameraMode,
      showCompass: showCompass ?? this.showCompass,
      targetPosition: targetPosition ?? this.targetPosition,
      heading: heading ?? this.heading,
      speed: speed ?? this.speed,
      accuracy: accuracy ?? this.accuracy,
      lastFixTime: lastFixTime ?? this.lastFixTime,
      isPredicting: isPredicting ?? this.isPredicting,
      trailPoints: trailPoints ?? this.trailPoints,
    );
  }
}

class MapNotifier extends StateNotifier<MapState> {
  MapNotifier() : super(const MapState());

  void toggleFollow() {
    final newMode =
        state.followMode == MapFollowMode.none ? MapFollowMode.follow : MapFollowMode.none;
    state = state.copyWith(
      followMode: newMode,
      cameraMode: newMode == MapFollowMode.follow ? MapCameraMode.follow : state.cameraMode,
    );
  }

  void setCameraMode(MapCameraMode mode) {
    state = state.copyWith(cameraMode: mode);
  }

  void setFollowMode(MapFollowMode mode) {
    state = state.copyWith(followMode: mode);
  }

  void toggleCompass() {
    state = state.copyWith(showCompass: !state.showCompass);
  }

  void updatePosition(Position pos) {
    final latLng = LatLng(pos.latitude, pos.longitude);
    final heading = pos.heading.isFinite
        ? pos.heading
        : state.trailPoints.length >= 2
            ? InterpolationEngine.bearing(state.trailPoints.last, latLng)
            : state.heading;
    final trail = [...state.trailPoints, latLng];
    if (trail.length > 100) {
      trail.removeRange(0, trail.length - 100);
    }
    state = state.copyWith(
      targetPosition: latLng,
      heading: heading,
      speed: pos.speed.isFinite ? pos.speed : state.speed,
      accuracy: pos.accuracy.isFinite ? pos.accuracy : state.accuracy,
      lastFixTime: DateTime.now(),
      isPredicting: false,
      trailPoints: trail,
    );
  }

  void updatePredictedPosition(LatLng predicted) {
    state = state.copyWith(targetPosition: predicted, isPredicting: true);
  }
}

final mapNotifierProvider = StateNotifierProvider<MapNotifier, MapState>((ref) {
  return MapNotifier();
});
