import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../infrastructure/platform/location_wrapper.dart';
import '../services/adaptive_tracking_policy.dart';
import '../services/location_pipeline_service.dart';

enum GpsPermissionState { unknown, granted, denied, permanentlyDenied }

enum GpsServiceState { unknown, enabled, disabled }

class GpsState {
  final GpsPermissionState permission;
  final GpsServiceState service;
  final Position? position;
  final bool isListening;
  final String? error;
  final PipelineEvent lastPipelineEvent;
  final String? lastFilterReason;
  final String trackingPolicy;

  const GpsState({
    this.permission = GpsPermissionState.unknown,
    this.service = GpsServiceState.unknown,
    this.position,
    this.isListening = false,
    this.error,
    this.lastPipelineEvent = PipelineEvent.accepted,
    this.lastFilterReason,
    this.trackingPolicy = 'parked',
  });

  GpsState copyWith({
    GpsPermissionState? permission,
    GpsServiceState? service,
    Position? position,
    bool? isListening,
    String? error,
    PipelineEvent? lastPipelineEvent,
    String? lastFilterReason,
    String? trackingPolicy,
  }) {
    return GpsState(
      permission: permission ?? this.permission,
      service: service ?? this.service,
      position: position ?? this.position,
      isListening: isListening ?? this.isListening,
      error: error ?? this.error,
      lastPipelineEvent: lastPipelineEvent ?? this.lastPipelineEvent,
      lastFilterReason: lastFilterReason ?? this.lastFilterReason,
      trackingPolicy: trackingPolicy ?? this.trackingPolicy,
    );
  }

  bool get canTrack =>
      permission == GpsPermissionState.granted &&
      service == GpsServiceState.enabled;
}

class GpsNotifier extends StateNotifier<GpsState> {
  GpsNotifier() : super(const GpsState());

  StreamSubscription<Position>? _positionSubscription;
  StreamSubscription<ServiceStatus>? _serviceSubscription;
  StreamSubscription<LocationPipelineEvent>? _pipelineSubscription;
  TrackingPolicy _currentPolicy = TrackingPolicy.parked;

  Future<void> initialize() async {
    _pipelineSubscription =
        LocationPipelineService.instance.events.listen(_onPipelineEvent);
    await _checkPermission();
    await _checkService();
    if (state.canTrack) {
      await startListening();
    }
  }

  void _onPipelineEvent(LocationPipelineEvent event) {
    state = state.copyWith(
      lastPipelineEvent: event.type,
      lastFilterReason: event.type == PipelineEvent.filtered ? event.reason : null,
    );
    if (event.type == PipelineEvent.accepted && event.position != null) {
      final policy = TrackingPolicy.forSpeed(event.position!.speed);
      _currentPolicy = policy;
      _resubscribeWithPolicy(policy);
      final label = _policyLabel(policy);
      state = state.copyWith(
        position: event.position,
        trackingPolicy: label,
      );
    }
  }

  Future<void> _checkPermission() async {
    final permission = await LocationWrapper.instance.checkPermission();
    state = state.copyWith(permission: _mapPermission(permission));
  }

  Future<void> requestPermission() async {
    final permission = await LocationWrapper.instance.requestPermission();
    state = state.copyWith(permission: _mapPermission(permission));
    if (state.canTrack) {
      await startListening();
    }
  }

  Future<void> _checkService() async {
    final enabled = await LocationWrapper.instance.isLocationServiceEnabled();
    state = state.copyWith(
      service: enabled ? GpsServiceState.enabled : GpsServiceState.disabled,
    );
    _serviceSubscription?.cancel();
    _serviceSubscription = Geolocator.getServiceStatusStream().listen((status) {
      state = state.copyWith(
        service: status == ServiceStatus.enabled
            ? GpsServiceState.enabled
            : GpsServiceState.disabled,
      );
      if (status == ServiceStatus.enabled && state.canTrack) {
        startListening();
      }
    });
  }

  Future<void> startListening() async {
    if (!state.canTrack) return;
    if (state.isListening) return;
    state = state.copyWith(isListening: true, error: null);
    _subscribeWithPolicy(_currentPolicy);
  }

  void _subscribeWithPolicy(TrackingPolicy policy) {
    _positionSubscription?.cancel();
    final pipeline = LocationPipelineService.instance;
    _positionSubscription = LocationWrapper.instance
        .getPositionStream(
          accuracy: LocationAccuracy.high,
          distanceFilter: policy.distanceFilter,
        )
        .listen(
          (pos) => pipeline.processPosition(pos),
          onError: (err) =>
              state = state.copyWith(error: err.toString()),
        );
  }

  void _resubscribeWithPolicy(TrackingPolicy policy) {
    if (!state.isListening) return;
    _subscribeWithPolicy(policy);
  }

  void stopListening() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
    LocationPipelineService.instance.reset();
    state = state.copyWith(isListening: false);
  }

  Future<Position?> getSingleFix() async {
    try {
      if (!state.canTrack) return null;
      final pos = await LocationWrapper.instance.getCurrentPosition();
      await LocationPipelineService.instance.processPosition(pos);
      return pos;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _serviceSubscription?.cancel();
    _pipelineSubscription?.cancel();
    super.dispose();
  }

  static String _policyLabel(TrackingPolicy policy) {
    if (identical(policy, TrackingPolicy.parked)) return 'parked';
    if (identical(policy, TrackingPolicy.slow)) return 'slow';
    if (identical(policy, TrackingPolicy.moving)) return 'moving';
    return 'active';
  }

  static GpsPermissionState _mapPermission(LocationPermission p) {
    switch (p) {
      case LocationPermission.always:
      case LocationPermission.whileInUse:
        return GpsPermissionState.granted;
      case LocationPermission.denied:
        return GpsPermissionState.denied;
      case LocationPermission.deniedForever:
        return GpsPermissionState.permanentlyDenied;
      case LocationPermission.unableToDetermine:
        return GpsPermissionState.unknown;
    }
  }
}

final gpsNotifierProvider =
    StateNotifierProvider<GpsNotifier, GpsState>((ref) {
  final notifier = GpsNotifier();
  Future.microtask(() => notifier.initialize());
  return notifier;
});
