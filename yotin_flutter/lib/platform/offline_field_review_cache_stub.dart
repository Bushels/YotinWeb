/// The states deliberately distinguish a browser that cannot store an offline
/// review from a review that simply has not been downloaded yet.
enum OfflineFieldReviewCacheState { unavailable, idle, caching, ready, failed }

/// Non-web builds keep the control absent instead of pretending that an
/// installed desktop or mobile app has a browser service-worker cache.
class OfflineFieldReviewCacheController {
  OfflineFieldReviewCacheController({
    required this.onStateChanged,
    required this.onNetworkChanged,
  });

  final ValueChanged<OfflineFieldReviewCacheState> onStateChanged;
  final ValueChanged<bool> onNetworkChanged;

  OfflineFieldReviewCacheState get state =>
      OfflineFieldReviewCacheState.unavailable;
  bool get networkAvailable => true;

  Future<void> cacheFieldReview() async {
    onStateChanged(OfflineFieldReviewCacheState.unavailable);
  }

  void dispose() {}
}

typedef ValueChanged<T> = void Function(T value);
