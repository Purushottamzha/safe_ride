import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../domain/entities/auth_tokens.dart';
import '../../domain/entities/device_config.dart';

class SecureStorage {
  static const _accessTokenKey = 'auth_access_token';
  static const _refreshTokenKey = 'auth_refresh_token';
  static const _expiresAtKey = 'auth_expires_at';
  static const _deviceConfigKey = 'device_config';

  final FlutterSecureStorage _storage;
  SecureStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  Future<void> saveAuthTokens(AuthTokens tokens) async {
    await _storage.write(key: _accessTokenKey, value: tokens.accessToken);
    await _storage.write(key: _refreshTokenKey, value: tokens.refreshToken);
    await _storage.write(key: _expiresAtKey, value: tokens.expiresAt.toIso8601String());
  }

  Future<AuthTokens?> getAuthTokens() async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);
    final expiresAtStr = await _storage.read(key: _expiresAtKey);
    if (accessToken == null || refreshToken == null || expiresAtStr == null) return null;
    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: DateTime.parse(expiresAtStr),
    );
  }

  Future<void> clearAuthTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _expiresAtKey);
  }

  Future<bool> hasTokens() async {
    return _storage.containsKey(key: _accessTokenKey);
  }

  Future<void> saveDeviceConfig(DeviceConfig config) async {
    await _storage.write(key: _deviceConfigKey, value: config.toJson());
  }

  Future<DeviceConfig?> getDeviceConfig() async {
    final json = await _storage.read(key: _deviceConfigKey);
    if (json == null) return null;
    try {
      return DeviceConfig.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearDeviceConfig() async {
    await _storage.delete(key: _deviceConfigKey);
  }
}
