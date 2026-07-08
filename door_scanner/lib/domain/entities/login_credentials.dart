class LoginCredentials {
  final String email;
  final String password;

  const LoginCredentials({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };

  @override
  String toString() => 'LoginCredentials(email: $email)';
}
