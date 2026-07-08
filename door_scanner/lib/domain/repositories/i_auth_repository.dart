import '../entities/auth_tokens.dart';
import '../entities/login_credentials.dart';

abstract class IAuthRepository {
  Future<AuthTokens> login(LoginCredentials credentials);
  Future<void> logout();
  Future<AuthTokens> refreshToken(String refreshToken);
  Future<AuthTokens?> getStoredTokens();
  Future<void> clearTokens();
  Future<bool> isLoggedIn();
}
