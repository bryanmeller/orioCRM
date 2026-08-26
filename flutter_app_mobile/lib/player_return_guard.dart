class PlayerReturnGuard {
  static DateTime? _ignoreBackUntil;

  static void arm() {
    _ignoreBackUntil = DateTime.now().add(const Duration(milliseconds: 700));
  }

  static bool consumeIfActive() {
    final until = _ignoreBackUntil;
    if (until == null) {
      return false;
    }
    if (DateTime.now().isBefore(until)) {
      return true;
    }
    _ignoreBackUntil = null;
    return false;
  }
}
