class LifecycleRecovery {
  static final LifecycleRecovery instance = LifecycleRecovery._();
  LifecycleRecovery._();
  void onCrash() {}
  void onStableRun() {}
}
