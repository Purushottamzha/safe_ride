import '../entities/auth_tokens.dart';
import '../entities/login_credentials.dart';
import '../repositories/i_auth_repository.dart';

class LoginUseCase {
  final IAuthRepository repository;

  LoginUseCase(this.repository);

  Future<AuthTokens> execute(String email, String password) async {
    if (email.trim().isEmpty) {
      throw ArgumentError('Email cannot be empty');
    }
    if (!_isValidEmail(email.trim())) {
      throw ArgumentError('Invalid email format');
    }
    if (password.isEmpty) {
      throw ArgumentError('Password cannot be empty');
    }
    if (password.length < 6) {
      throw ArgumentError('Password must be at least 6 characters');
    }
    final credentials = LoginCredentials(email: email.trim(), password: password);
    return repository.login(credentials);
  }

  bool _isValidEmail(String email) {
    final regex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    return regex.hasMatch(email);
  }
}
