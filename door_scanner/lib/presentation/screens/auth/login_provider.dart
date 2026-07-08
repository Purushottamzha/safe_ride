import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginFormState {
  final String email; final String password; final bool rememberMe;
  final bool isLoading; final String? error; final bool isObscured;
  const LoginFormState({this.email='', this.password='', this.rememberMe=false, this.isLoading=false, this.error, this.isObscured=true});
  LoginFormState copyWith({String? email, String? password, bool? rememberMe, bool? isLoading, String? error, bool? isObscured}) =>
    LoginFormState(email: email??this.email, password: password??this.password, rememberMe: rememberMe??this.rememberMe,
      isLoading: isLoading??this.isLoading, error: error, isObscured: isObscured??this.isObscured);
}
class LoginFormNotifier extends StateNotifier<LoginFormState> {
  LoginFormNotifier() : super(const LoginFormState());
  void setEmail(String v) => state = state.copyWith(email: v, error: null);
  void setPassword(String v) => state = state.copyWith(password: v, error: null);
  void toggleRememberMe() => state = state.copyWith(rememberMe: !state.rememberMe);
  void toggleObscured() => state = state.copyWith(isObscured: !state.isObscured);
  void setLoading(bool v) => state = state.copyWith(isLoading: v);
  void setError(String e) => state = state.copyWith(error: e, isLoading: false);
  String? validate() {
    if (state.email.trim().isEmpty) return 'Email is required';
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(state.email.trim())) return 'Invalid email format';
    if (state.password.isEmpty) return 'Password is required';
    if (state.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  }
}

final loginFormProvider = StateNotifierProvider<LoginFormNotifier, LoginFormState>((ref) => LoginFormNotifier());
