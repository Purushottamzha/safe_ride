import '../repositories/i_auth_repository.dart';

class LogoutUseCase {
  final IAuthRepository repository;

  LogoutUseCase(this.repository);

  Future<void> execute() => repository.logout();
}
