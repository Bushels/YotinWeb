import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:web/web.dart' as web;

enum OfflineFieldReviewCacheState { unavailable, idle, caching, ready, failed }

/// Browser bridge for the explicit Field Review offline download.
///
/// A positive `navigator.onLine` value means a network is present, not that
/// ChatFi or the R3F origin is reachable. The UI therefore only promises the
/// locally cached qualifier while offline.
class OfflineFieldReviewCacheController {
  OfflineFieldReviewCacheController({
    required this.onStateChanged,
    required this.onNetworkChanged,
  }) : _networkAvailable = web.window.navigator.onLine {
    if (!_isSupported) {
      _state = OfflineFieldReviewCacheState.unavailable;
      return;
    }

    _messageSubscription = web.EventStreamProviders.messageEvent
        .forTarget(web.window.navigator.serviceWorker)
        .listen(_handleMessage);
    unawaited(_registerAndReadStatus());
  }

  static const _cacheRequest = 'yotin:cache-field-review';
  static const _cacheStatusRequest = 'yotin:field-review-cache-status';
  static const _cacheReady = 'yotin:field-review-cache-ready';
  static const _cacheFailed = 'yotin:field-review-cache-failed';
  static const _cacheProgress = 'yotin:field-review-cache-progress';
  static const _cacheIdle = 'yotin:field-review-cache-idle';

  final ValueChanged<OfflineFieldReviewCacheState> onStateChanged;
  final ValueChanged<bool> onNetworkChanged;
  StreamSubscription<web.MessageEvent>? _messageSubscription;
  StreamSubscription<web.Event>? _onlineSubscription;
  StreamSubscription<web.Event>? _offlineSubscription;
  Timer? _cacheTimeout;
  OfflineFieldReviewCacheState _state = OfflineFieldReviewCacheState.idle;
  bool _networkAvailable;

  bool get _isSupported =>
      web.window.isSecureContext && web.window.navigator.has('serviceWorker');

  OfflineFieldReviewCacheState get state => _state;
  bool get networkAvailable => _networkAvailable;

  Future<void> _registerAndReadStatus() async {
    try {
      _onlineSubscription = web.EventStreamProviders.onlineEvent
          .forTarget(web.window)
          .listen((_) => _setNetworkAvailable(true));
      _offlineSubscription = web.EventStreamProviders.offlineEvent
          .forTarget(web.window)
          .listen((_) => _setNetworkAvailable(false));

      await web.window.navigator.serviceWorker
          .register(
            'field_review_service_worker.js'.toJS,
            web.RegistrationOptions(scope: './'),
          )
          .toDart;
      final registration =
          await web.window.navigator.serviceWorker.ready.toDart;
      registration.active?.postMessage(
        <String, Object?>{'type': _cacheStatusRequest}.jsify(),
      );
    } catch (_) {
      _setState(OfflineFieldReviewCacheState.unavailable);
    }
  }

  Future<void> cacheFieldReview() async {
    if (!_isSupported) {
      _setState(OfflineFieldReviewCacheState.unavailable);
      return;
    }
    if (!_networkAvailable) {
      _setState(OfflineFieldReviewCacheState.failed);
      return;
    }

    _setState(OfflineFieldReviewCacheState.caching);
    _cacheTimeout?.cancel();
    _restartCacheTimeout();

    try {
      final registration =
          await web.window.navigator.serviceWorker.ready.toDart;
      final activeWorker = registration.active;
      if (activeWorker == null) {
        throw StateError('Field Review offline worker did not activate.');
      }
      activeWorker.postMessage(
        <String, Object?>{'type': _cacheRequest}.jsify(),
      );
    } catch (_) {
      _setState(OfflineFieldReviewCacheState.failed);
    }
  }

  void _handleMessage(web.MessageEvent event) {
    final data = event.data?.dartify();
    if (data is! Map) return;

    switch (data['type']) {
      case _cacheReady:
        _setState(OfflineFieldReviewCacheState.ready);
      case _cacheProgress:
        _restartCacheTimeout();
        _setState(OfflineFieldReviewCacheState.caching);
      case _cacheFailed:
        _setState(OfflineFieldReviewCacheState.failed);
      case _cacheIdle:
        _setState(OfflineFieldReviewCacheState.idle);
    }
  }

  void _setNetworkAvailable(bool available) {
    if (_networkAvailable == available) return;
    _networkAvailable = available;
    onNetworkChanged(available);
  }

  void _setState(OfflineFieldReviewCacheState state) {
    if (state != OfflineFieldReviewCacheState.caching) {
      _cacheTimeout?.cancel();
      _cacheTimeout = null;
    }
    if (_state == state) return;
    _state = state;
    onStateChanged(state);
  }

  void _restartCacheTimeout() {
    _cacheTimeout?.cancel();
    _cacheTimeout = Timer(const Duration(minutes: 5), () {
      _setState(OfflineFieldReviewCacheState.failed);
    });
  }

  void dispose() {
    _cacheTimeout?.cancel();
    _messageSubscription?.cancel();
    _onlineSubscription?.cancel();
    _offlineSubscription?.cancel();
  }
}

typedef ValueChanged<T> = void Function(T value);
