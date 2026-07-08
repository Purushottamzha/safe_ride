import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:door_scanner/domain/entities/auth_tokens.dart';
import 'package:door_scanner/domain/entities/login_credentials.dart';
import 'package:door_scanner/domain/repositories/i_auth_repository.dart';
import 'package:door_scanner/application/notifiers/auth_notifier.dart';
import 'package:door_scanner/application/providers/auth_provider.dart';

class MockAuthRepository extends Mock implements IAuthRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(const LoginCredentials(email: '', password: ''));
    registerFallbackValue(AuthTokens(accessToken: '', refreshToken: '', expiresAt: DateTime.now()));
  });
  late MockAuthRepository mockRepo;
  late AuthTokens testTokens;

  setUp(() {
    mockRepo = MockAuthRepository();
    testTokens = AuthTokens(accessToken: 'test_access', refreshToken: 'test_refresh', expiresAt: DateTime.now().add(const Duration(hours: 1)));
  });

  group('login', () {
    test('should set authenticated state on success', () async {
      when(() => mockRepo.login(any())).thenAnswer((_) async => testTokens);
      final container = ProviderContainer(overrides: [
        authRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(authNotifierProvider.notifier);
      await notifier.login('test@test.com', 'password123');
      final state = container.read(authNotifierProvider);
      state.whenOrNull(data: (s) {
        expect(s.status, AuthStatus.authenticated);
      });
      container.dispose();
    });

    test('should set error state on failure', () async {
      when(() => mockRepo.login(any())).thenAnswer((_) => Future.error(Exception('Login failed')));
      final container = ProviderContainer(overrides: [
        authRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      final notifier = container.read(authNotifierProvider.notifier);
      await notifier.login('test@test.com', 'wrong');
      final state = container.read(authNotifierProvider);
      state.whenOrNull(data: (s) {
        expect(s.status, AuthStatus.error);
      });
      container.dispose();
    });
  });
}
