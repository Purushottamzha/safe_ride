
import '../../domain/entities/auth_tokens.dart';
import '../../domain/entities/login_credentials.dart';
import '../../domain/repositories/i_auth_repository.dart';
import '../../infrastructure/storage/secure_storage.dart';
import '../datasources/remote/auth_remote_datasource.dart';
class AuthRepositoryImpl implements IAuthRepository {
  final AuthRemoteDataSource remoteDataSource; final SecureStorage secureStorage;
  AuthRepositoryImpl({required this.remoteDataSource, required this.secureStorage});
  @override Future<AuthTokens> login(LoginCredentials c) async {
    final m = await remoteDataSource.login(c.email, c.password); final e = m.toEntity();
    await secureStorage.saveAuthTokens(e); return e;
  }
  @override Future<void> logout() async {
    try { await remoteDataSource.logout(); } catch (_) {}
    await secureStorage.clearAuthTokens();
  }
  @override Future<AuthTokens> refreshToken(String rt) async {
    final m = await remoteDataSource.refreshToken(rt); final e = m.toEntity();
    await secureStorage.saveAuthTokens(e); return e;
  }
  @override Future<AuthTokens?> getStoredTokens() async => secureStorage.getAuthTokens();
  @override Future<void> clearTokens() async => secureStorage.clearAuthTokens();
  @override Future<bool> isLoggedIn() async {
    final t = await secureStorage.getAuthTokens();
    if (t == null) return false;
    if (t.isExpired) {
      try { await refreshToken(t.refreshToken); return true; } catch (_) { await secureStorage.clearAuthTokens(); return false; }
    }
    return true;
  }
}
