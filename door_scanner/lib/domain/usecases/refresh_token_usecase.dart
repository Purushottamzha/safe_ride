import '../entities/auth_tokens.dart';
import '../repositories/i_auth_repository.dart';

class RefreshTokenUseCase {
  final IAuthRepository repository;

  RefreshTokenUseCase(this.repository);

  Future<AuthTokens> execute(String refreshToken) =>
      repository.refreshToken(refreshToken);
}
