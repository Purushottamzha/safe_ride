import 'package:flutter_riverpod/flutter_riverpod.dart';

final diagnosticsRefreshProvider = StateProvider<int>((ref) => 0);

final autoRefreshProvider = StateProvider<bool>((ref) => false);
