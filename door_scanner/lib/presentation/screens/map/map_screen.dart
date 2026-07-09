import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../application/notifiers/gps_notifier.dart';
import '../../../application/notifiers/map_notifier.dart';
import '../../../application/services/interpolation_engine.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  late final AnimationController _markerAnim;
  LatLng _animatedPosition = const LatLng(27.7172, 85.3240);
  LatLng _animStart = const LatLng(27.7172, 85.3240);
  LatLng _animEnd = const LatLng(27.7172, 85.3240);
  Timer? _predictiveTimer;
  Size? _lastScreenSize;

  @override
  void initState() {
    super.initState();
    _markerAnim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(_onMarkerTick);
  }

  @override
  void dispose() {
    _markerAnim.removeListener(_onMarkerTick);
    _markerAnim.dispose();
    _predictiveTimer?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  void _onMarkerTick() {
    final t = _markerAnim.value;
    _animatedPosition = InterpolationEngine.lerp(_animStart, _animEnd, t);
    if (t >= 1.0 && ref.read(mapNotifierProvider).isPredicting) {
      final target = ref.read(mapNotifierProvider).targetPosition;
      if (target != null) {
        _animStart = _animatedPosition;
        _animEnd = target;
        _markerAnim.reset();
        _markerAnim.duration = const Duration(milliseconds: 500);
        _markerAnim.forward();
      }
    }
    if (mounted) setState(() {});
  }

  void _startMarkerAnim(LatLng from, LatLng to, double speedMps) {
    final dist = InterpolationEngine.distance(from, to);
    if (dist < 1.0) {
      _animatedPosition = to;
      if (mounted) setState(() {});
      return;
    }
    _animStart = from;
    _animEnd = to;
    final dur = InterpolationEngine.animationDuration(speedMps);
    if (dur <= 0) {
      _animatedPosition = to;
      if (mounted) setState(() {});
      return;
    }
    _markerAnim.reset();
    _markerAnim.duration = Duration(milliseconds: (dur * 1000).toInt());
    _markerAnim.forward();
  }

  void _startPredictive() {
    _predictiveTimer?.cancel();
    _predictiveTimer = Timer.periodic(const Duration(milliseconds: 200), (_) {
      if (!mounted) {
        _predictiveTimer?.cancel();
        return;
      }
      final state = ref.read(mapNotifierProvider);
      if (state.lastFixTime == null || state.speed <= 0 || state.targetPosition == null) {
        _predictiveTimer?.cancel();
        return;
      }
      final elapsed = DateTime.now().difference(state.lastFixTime!);
      if (elapsed.inMilliseconds > 5000) {
        _predictiveTimer?.cancel();
        return;
      }
      if (elapsed.inMilliseconds < 2000) return;
      final predicted = InterpolationEngine.predict(
        state.targetPosition!,
        state.speed,
        state.heading,
        0.2,
      );
      ref.read(mapNotifierProvider.notifier).updatePredictedPosition(predicted);
    });
  }

  void _easeCameraTo(LatLng center, {double? zoom}) {
    _mapController.move(center, zoom ?? _mapController.camera.zoom);
  }

  @override
  Widget build(BuildContext context) {
    final mapState = ref.watch(mapNotifierProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenSize = MediaQuery.of(context).size;
    _lastScreenSize ??= screenSize;

    ref.listen<GpsState>(gpsNotifierProvider, (_, next) {
      if (next.position == null) return;
      final pos = next.position!;
      final latLng = LatLng(pos.latitude, pos.longitude);
      final notifier = ref.read(mapNotifierProvider.notifier);
      notifier.updatePosition(pos);
      _startMarkerAnim(_animatedPosition, latLng, pos.speed.isFinite ? pos.speed : 0);
      if (mapState.followMode != MapFollowMode.none &&
          mapState.cameraMode == MapCameraMode.follow) {
        final sp = _mapController.camera.latLngToScreenPoint(latLng);
        if (!InterpolationEngine.isInDeadZone(
            sp.x, sp.y, screenSize.width, screenSize.height, 0.3)) {
          _easeCameraTo(latLng);
        }
      }
      _startPredictive();
    });

    final busIcon = Icon(
      Icons.directions_bus,
      size: 44,
      color: Theme.of(context).colorScheme.primary,
    );

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _animatedPosition,
              initialZoom: 15.0,
              onMapEvent: (event) {
                if (event is MapEventMoveEnd &&
                    mapState.cameraMode == MapCameraMode.follow) {
                  ref.read(mapNotifierProvider.notifier).setCameraMode(MapCameraMode.free);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: isDark
                    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png'
                    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.saferide.door_scanner',
              ),
              if (mapState.accuracy > 0 && mapState.accuracy <= 50 && mapState.targetPosition != null)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: mapState.targetPosition!,
                      radius: mapState.accuracy,
                      useRadiusInMeter: true,
                      color: Colors.blue.withValues(alpha: 0.08),
                      borderColor: Colors.blue.withValues(alpha: 0.2),
                      borderStrokeWidth: 2.0,
                    ),
                  ],
                ),
              if (mapState.trailPoints.length >= 2)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: mapState.trailPoints,
                      strokeWidth: 4.0,
                      color: Colors.blue.withValues(alpha: 0.6),
                      gradientColors: [
                        Colors.blue.withValues(alpha: 0.0),
                        Colors.blue.withValues(alpha: 0.2),
                        Colors.blue.withValues(alpha: 0.6),
                      ],
                      colorsStop: [0.0, 0.6, 1.0],
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _animatedPosition,
                    width: 52,
                    height: 52,
                    rotate: false,
                    child: Transform.rotate(
                      angle: mapState.heading * 0.017453292519943295,
                      child: busIcon,
                    ),
                  ),
                ],
              ),
            ],
          ),
          _buildTopBar(context),
          _buildZoomControls(),
          _buildSideButtons(context, mapState),
          if (mapState.cameraMode == MapCameraMode.free) _buildRecenterButton(context),
        ],
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back, color: Theme.of(context).colorScheme.onSurface),
                onPressed: () => Navigator.of(context).pop(),
              ),
              const Spacer(),
              Text('Live Map', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildZoomControls() {
    return Positioned(
      right: 16,
      bottom: MediaQuery.of(context).padding.bottom + 24,
      child: Column(
        children: [
          FloatingActionButton.small(
            heroTag: 'map_zoom_in',
            onPressed: () => _mapController.move(
              _mapController.camera.center,
              (_mapController.camera.zoom + 1).clamp(3.0, 20.0),
            ),
            child: const Icon(Icons.add),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.small(
            heroTag: 'map_zoom_out',
            onPressed: () => _mapController.move(
              _mapController.camera.center,
              (_mapController.camera.zoom - 1).clamp(3.0, 20.0),
            ),
            child: const Icon(Icons.remove),
          ),
        ],
      ),
    );
  }

  Widget _buildSideButtons(BuildContext context, MapState mapState) {
    return Positioned(
      right: 16,
      top: MediaQuery.of(context).padding.top + 72,
      child: Column(
        children: [
          FloatingActionButton.small(
            heroTag: 'map_compass',
            onPressed: () =>
                _mapController.move(_mapController.camera.center, _mapController.camera.zoom),
            child: const Icon(Icons.north),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.small(
            heroTag: 'map_follow_toggle',
            backgroundColor: mapState.followMode != MapFollowMode.none
                ? Theme.of(context).colorScheme.primaryContainer
                : null,
            onPressed: () => ref.read(mapNotifierProvider.notifier).toggleFollow(),
            child: Icon(
              mapState.followMode != MapFollowMode.none
                  ? Icons.my_location
                  : Icons.my_location_outlined,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecenterButton(BuildContext context) {
    return Positioned(
      bottom: MediaQuery.of(context).padding.bottom + 100,
      left: 0,
      right: 0,
      child: Center(
        child: FloatingActionButton.extended(
          heroTag: 'map_recenter',
          onPressed: () {
            final target = ref.read(mapNotifierProvider).targetPosition;
            if (target != null) _easeCameraTo(target);
            ref.read(mapNotifierProvider.notifier).setCameraMode(MapCameraMode.follow);
            ref.read(mapNotifierProvider.notifier).setFollowMode(MapFollowMode.follow);
          },
          icon: const Icon(Icons.my_location),
          label: const Text('Center'),
        ),
      ),
    );
  }
}
