import 'dart:convert';

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  AuthTokens copyWith({
    String? accessToken,
    String? refreshToken,
    DateTime? expiresAt,
  }) {
    return AuthTokens(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'expiresAt': expiresAt.toIso8601String(),
      };

  factory AuthTokens.fromMap(Map<String, dynamic> map) => AuthTokens(
        accessToken: map['accessToken'] as String,
        refreshToken: map['refreshToken'] as String,
        expiresAt: DateTime.parse(map['expiresAt'] as String),
      );

  String toJson() => jsonEncode(toMap());

  factory AuthTokens.fromJson(String source) =>
      AuthTokens.fromMap(jsonDecode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'AuthTokens(accessToken: $accessToken, refreshToken: $refreshToken, expiresAt: $expiresAt)';
}
