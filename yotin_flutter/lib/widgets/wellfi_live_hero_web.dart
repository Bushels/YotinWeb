import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import 'wellfi_live_hero_protocol.dart';

/// Web-only bridge to the canonical R3F WellFi scene.
///
/// The poster stays painted until the child explicitly announces that its R3F
/// renderer is ready. An iframe `load` event is deliberately not treated as a
/// success because it only proves navigation, not a usable WebGL frame.
class WellFiLiveHero extends StatefulWidget {
  const WellFiLiveHero({super.key, required this.heroVisible});

  final bool heroVisible;

  @override
  State<WellFiLiveHero> createState() => _WellFiLiveHeroState();
}

class _WellFiLiveHeroState extends State<WellFiLiveHero> {
  static const _publicSource = 'https://mpsgroup.energy/wellfi/animation';
  static const _localSource = 'http://127.0.0.1:3001/wellfi/animation';
  static const _readyTimeout = Duration(seconds: 15);

  WellFiLiveHeroProtocol _protocol = const WellFiLiveHeroProtocol();
  web.HTMLIFrameElement? _frame;
  String _liveOrigin = '';
  bool _frameInView = true;
  bool _mountScheduled = false;
  Timer? _readyTimer;
  StreamSubscription<web.MessageEvent>? _messageSubscription;
  StreamSubscription<web.Event>? _visibilitySubscription;
  StreamSubscription<web.Event>? _errorSubscription;
  web.IntersectionObserver? _intersectionObserver;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reconcileMount();
  }

  @override
  void didUpdateWidget(covariant WellFiLiveHero oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.heroVisible != widget.heroVisible) {
      _sendActivity();
    }
  }

  bool get _saveData {
    // Safari does not expose Navigator.connection. Feature-detect it before
    // accessing the generated binding, which assumes the property exists.
    final navigator = web.window.navigator;
    return navigator.has('connection') && navigator.connection.saveData;
  }

  bool get _reducedMotion => MediaQuery.disableAnimationsOf(context);

  bool get _canMount => !_reducedMotion && !_saveData;

  void _reconcileMount() {
    if (!_canMount) {
      if (_protocol.hasLiveFrame) _returnToPoster();
      return;
    }
    if (_protocol.state != WellFiLiveHeroState.poster || _mountScheduled) {
      return;
    }

    // Two post-frame turns guarantee the real poster has one paint before the
    // cross-origin R3F request begins.
    _mountScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mountScheduled = false;
        if (!mounted ||
            !_canMount ||
            _protocol.state != WellFiLiveHeroState.poster) {
          return;
        }
        setState(() {
          _protocol = _protocol.mount(
            reducedMotion: _reducedMotion,
            saveData: _saveData,
          );
        });
      });
    });
  }

  String _sceneUrl() {
    final host = web.window.location.hostname;
    final isLocal = host == 'localhost' || host == '127.0.0.1';
    final source = isLocal ? _localSource : _publicSource;
    final uri = Uri.parse(source).replace(
      queryParameters: {
        'motion': 'force',
        'embed': 'yotin',
        'parentOrigin': web.window.location.origin,
      },
    );
    _liveOrigin = uri.origin;
    return uri.toString();
  }

  void _createFrame(Object element) {
    final frame = element as web.HTMLIFrameElement;
    _frame = frame;
    _frameInView = true;
    frame
      ..title = 'Live WellFi telemetry cutaway'
      ..src = _sceneUrl()
      ..loading = 'eager'
      ..referrerPolicy = 'strict-origin-when-cross-origin'
      ..tabIndex = -1
      ..setAttribute('aria-hidden', 'true');
    frame.style
      ..border = '0'
      ..display = 'block'
      ..height = '100%'
      ..opacity = '0'
      ..pointerEvents = 'none'
      ..transition = 'opacity 420ms ease'
      ..width = '100%';

    _messageSubscription = web.window.onMessage.listen(_receiveMessage);
    _visibilitySubscription = web.document.onVisibilityChange.listen((_) {
      _sendActivity();
    });
    _errorSubscription = frame.onError.listen((_) => _fail());
    _intersectionObserver = web.IntersectionObserver(
      (
            JSArray<web.IntersectionObserverEntry> entries,
            web.IntersectionObserver observer,
          ) {
            if (entries.length == 0) return;
            _frameInView = entries[0].isIntersecting;
            _sendActivity();
          }
          .toJS,
      web.IntersectionObserverInit(threshold: 0.02.toJS),
    )..observe(frame);

    _readyTimer = Timer(_readyTimeout, _fail);
  }

  void _receiveMessage(web.MessageEvent event) {
    final frame = _frame;
    if (frame == null ||
        // `==` compares Dart wrappers. The Wasm/JS bridge may create distinct
        // wrappers for the same cross-origin WindowProxy, so use JavaScript's
        // `===` semantics for the source check.
        !jsIdentical(event.source, frame.contentWindow) ||
        event.origin != _liveOrigin) {
      return;
    }

    final data = event.data?.dartify();
    // `dartify` produces JSON-like Dart values, but a JavaScript Number can
    // arrive as either `int` or `double` across the JS and Wasm backends.
    // Accept only an exactly integral value; never coerce a fractional or
    // malformed protocol version into a valid one.
    final payload = data is Map ? data : null;
    final messageType = payload?['type'];
    final version = _strictInteger(payload?['version']);
    final next = _protocol.reveal(
      sourceMatches: true,
      originMatches: true,
      messageType: messageType is String ? messageType : null,
      version: version,
    );
    if (next == _protocol) return;

    _readyTimer?.cancel();
    frame.style.opacity = '1';
    setState(() => _protocol = next);
    _sendActivity();
  }

  int? _strictInteger(Object? value) {
    if (value is int) return value;
    if (value is double &&
        value.isFinite &&
        value == value.truncateToDouble()) {
      return value.toInt();
    }
    return null;
  }

  void _sendActivity() {
    final frame = _frame;
    if (frame == null || _liveOrigin.isEmpty || !_protocol.isLive) return;
    final active = _protocol.activityValue(
      heroVisible: widget.heroVisible,
      frameInView: _frameInView,
      documentHidden: web.document.hidden,
    );
    frame.contentWindow?.postMessage(
      <String, Object?>{'type': 'wellfi:set-active', 'active': active}.jsify(),
      _liveOrigin.toJS,
    );
  }

  void _fail() {
    if (!mounted || _protocol.isLive) return;
    _disposeBrowserResources(removeFrame: true);
    setState(() => _protocol = _protocol.fail());
  }

  void _returnToPoster() {
    _disposeBrowserResources(removeFrame: true);
    if (mounted) {
      setState(() => _protocol = _protocol.returnToPoster());
    }
  }

  void _disposeBrowserResources({required bool removeFrame}) {
    _readyTimer?.cancel();
    _readyTimer = null;
    _messageSubscription?.cancel();
    _messageSubscription = null;
    _visibilitySubscription?.cancel();
    _visibilitySubscription = null;
    _errorSubscription?.cancel();
    _errorSubscription = null;
    _intersectionObserver?.disconnect();
    _intersectionObserver = null;

    final frame = _frame;
    _frame = null;
    _liveOrigin = '';
    if (removeFrame && frame != null) {
      // HtmlElementView owns DOM removal. Removing the iframe ourselves leaves
      // Flutter's platform-view overlay in place and can hide the poster.
      frame.src = 'about:blank';
      frame.style.opacity = '0';
    }
  }

  @override
  void dispose() {
    _disposeBrowserResources(removeFrame: true);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showFrame = _protocol.hasLiveFrame;
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/wellfi-island-r3f-poster.webp',
          fit: BoxFit.cover,
          filterQuality: FilterQuality.high,
          errorBuilder: (context, error, stackTrace) => const ColoredBox(
            color: Color(0xFF06111A),
            child: Center(
              child: Text('WellFi telemetry visualization unavailable.'),
            ),
          ),
        ),
        if (showFrame)
          Positioned.fill(
            child: HtmlElementView.fromTagName(
              key: const ValueKey('wellfi-live-r3f-frame'),
              tagName: 'iframe',
              onElementCreated: _createFrame,
            ),
          ),
      ],
    );
  }
}
