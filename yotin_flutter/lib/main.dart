import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:google_fonts/google_fonts.dart';
import 'platform/offline_field_review_cache.dart';
import 'platform/public_shell.dart';
import 'theme/yotin_theme.dart';
import 'widgets/navigation_bar.dart';
import 'widgets/signal_strip.dart';
import 'widgets/chatfi_panel.dart';
import 'widgets/footer.dart';
import 'sections/hero_section.dart';
import 'sections/wellfi_section.dart';
import 'sections/drill_benefits_section.dart';
import 'sections/insight_section.dart';
import 'sections/company_section.dart';
import 'sections/contact_qualifier_section.dart';

void main() {
  // Every Google Fonts variant used by the review is committed under
  // assets/fonts. Refuse a silent third-party HTTP fallback if an asset is
  // accidentally removed in a future change.
  GoogleFonts.config.allowRuntimeFetching = false;
  runApp(const YotinFlutterApp());
  // Flutter web semantics is opt-in. This keeps landmarks and headings
  // available to keyboard and screen-reader users.
  SemanticsBinding.instance.ensureSemantics();
}

class YotinFlutterApp extends StatelessWidget {
  const YotinFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Yotin Energy — Indigenous Energy Services & WellFi Telemetry',
      debugShowCheckedModeBanner: false,
      theme: YotinTheme.darkTheme,
      home: const YotinHomePage(),
    );
  }
}

class YotinHomePage extends StatefulWidget {
  const YotinHomePage({super.key});

  @override
  State<YotinHomePage> createState() => _YotinHomePageState();
}

class _YotinHomePageState extends State<YotinHomePage> {
  final ScrollController _scrollController = ScrollController();
  final ValueNotifier<double> _drillScrollProgress = ValueNotifier(0.0);
  final ValueNotifier<bool> _heroVisible = ValueNotifier(true);
  final GlobalKey _scrollViewportKey = GlobalKey();

  // GlobalKeys to scroll to sections
  final GlobalKey _heroKey = GlobalKey();
  final GlobalKey _wellfiKey = GlobalKey();
  final GlobalKey _benefitsKey = GlobalKey();
  final GlobalKey _insightKey = GlobalKey();
  final GlobalKey _companyKey = GlobalKey();
  final GlobalKey _contactKey = GlobalKey();
  // The primary hero CTA promises an immediate self-check. Target the first
  // decision itself—not the wider contact introduction or qualifier card—so
  // phone visitors can act as soon as the scroll settles.
  final GlobalKey _qualifierQuestionKey = GlobalKey();
  late final OfflineFieldReviewCacheController _offlineFieldReviewCache;
  OfflineFieldReviewCacheState _offlineCacheState =
      OfflineFieldReviewCacheState.unavailable;
  bool _networkAvailable = true;

  @override
  void initState() {
    super.initState();
    _offlineFieldReviewCache = OfflineFieldReviewCacheController(
      onStateChanged: (state) {
        if (!mounted) return;
        setState(() => _offlineCacheState = state);
      },
      onNetworkChanged: (available) {
        if (!mounted) return;
        setState(() => _networkAvailable = available);
      },
    );
    _offlineCacheState = _offlineFieldReviewCache.state;
    _networkAvailable = _offlineFieldReviewCache.networkAvailable;
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      markFlutterPublicShellReady();
      _updateHeroVisibility();
    });
  }

  void _onScroll() {
    _updateHeroVisibility();
    if (_benefitsKey.currentContext != null) {
      final renderBox =
          _benefitsKey.currentContext!.findRenderObject() as RenderBox?;
      if (renderBox != null) {
        final position = renderBox.localToGlobal(Offset.zero);
        final screenH = MediaQuery.of(context).size.height;

        // Calculate progress as the section passes through viewport
        final start = position.dy;
        final progress = (1.0 - (start / (screenH * 0.8))).clamp(0.0, 1.0);
        if ((progress - _drillScrollProgress.value).abs() > 0.01) {
          _drillScrollProgress.value = progress;
        }
      }
    }
  }

  void _updateHeroVisibility() {
    final renderBox = _heroKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final top = renderBox.localToGlobal(Offset.zero).dy;
    final bottom = top + renderBox.size.height;
    final viewport = MediaQuery.sizeOf(context).height;
    final visible = bottom > viewport * 0.02 && top < viewport * 0.98;
    if (_heroVisible.value != visible) _heroVisible.value = visible;
  }

  double? _qualifierTargetOffset() {
    if (!_scrollController.hasClients) return null;

    final targetBox =
        _qualifierQuestionKey.currentContext?.findRenderObject() as RenderBox?;
    final viewportBox =
        _scrollViewportKey.currentContext?.findRenderObject() as RenderBox?;
    if (targetBox == null || viewportBox == null) return null;
    if (!targetBox.attached || !viewportBox.attached) return null;

    final desiredTop = viewportBox.localToGlobal(Offset.zero).dy + 28.0;
    final delta = targetBox.localToGlobal(Offset.zero).dy - desiredTop;
    return (_scrollController.offset + delta)
        .clamp(0.0, _scrollController.position.maxScrollExtent)
        .toDouble();
  }

  Future<void> _scrollToQualifierDecision() async {
    // The canvas/font pipeline may settle the mobile layout after scrolling
    // begins. Re-measure once the first animation has painted so the target
    // cannot finish behind the fixed navigation.
    for (var pass = 0; pass < 2; pass++) {
      final targetOffset = _qualifierTargetOffset();
      if (targetOffset == null) return;

      await _scrollController.animateTo(
        targetOffset,
        duration: Duration(milliseconds: pass == 0 ? 600 : 180),
        curve: Curves.easeInOutCubic,
      );
      if (!mounted) return;
      await WidgetsBinding.instance.endOfFrame;
      if (!mounted) return;
    }
  }

  Future<void> _scrollToSection(String section) async {
    if (section == 'qualifier') {
      await _scrollToQualifierDecision();
      return;
    }

    GlobalKey? key;
    switch (section) {
      case 'hero':
        key = _heroKey;
        break;
      case 'wellfi':
        key = _wellfiKey;
        break;
      case 'benefits':
        key = _benefitsKey;
        break;
      case 'insight':
        key = _insightKey;
        break;
      case 'company':
        key = _companyKey;
        break;
      case 'contact':
        key = _contactKey;
        break;
    }

    if (key?.currentContext != null) {
      await Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  Future<void> _openChatFi() {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withValues(alpha: 0.72),
      builder: (dialogContext) {
        final media = MediaQuery.of(dialogContext);
        final isPhone = media.size.width < 600;
        const desktopInset = 24.0;
        const phoneInset = 8.0;
        final inset = isPhone ? phoneInset : desktopInset;
        final width = isPhone ? media.size.width - (inset * 2) : 420.0;
        final height = math.min(600.0, media.size.height - (inset * 2));

        return Padding(
          padding: EdgeInsets.all(inset),
          child: Align(
            alignment: isPhone ? Alignment.bottomCenter : Alignment.bottomRight,
            child: SizedBox(
              width: width,
              height: height,
              child: Material(
                type: MaterialType.transparency,
                child: ChatFiPanelWidget(
                  onClose: () => Navigator.of(dialogContext).pop(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _drillScrollProgress.dispose();
    _heroVisible.dispose();
    _offlineFieldReviewCache.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          YotinNavigationBar(
            onNavigate: _scrollToSection,
            onOpenChatFi: _openChatFi,
          ),
          Expanded(
            child: Container(
              key: _scrollViewportKey,
              child: Semantics(
                container: true,
                label: 'Field review information',
                role: SemanticsRole.main,
                child: SingleChildScrollView(
                  controller: _scrollController,
                  child: Column(
                    children: [
                      ValueListenableBuilder<bool>(
                        valueListenable: _heroVisible,
                        builder: (context, visible, child) => HeroSection(
                          key: _heroKey,
                          heroVisible: visible,
                          onEvaluate: () {
                            _scrollToSection('qualifier');
                          },
                          onExplore: () {
                            _scrollToSection('wellfi');
                          },
                          offlineCacheState: _offlineCacheState,
                          networkAvailable: _networkAvailable,
                          onPrepareOffline:
                              _offlineFieldReviewCache.cacheFieldReview,
                        ),
                      ),
                      const SignalStripWidget(),
                      WellFiSection(key: _wellfiKey),
                      ValueListenableBuilder<double>(
                        valueListenable: _drillScrollProgress,
                        builder: (context, progress, child) =>
                            DrillBenefitsSection(
                              key: _benefitsKey,
                              scrollProgress: progress,
                            ),
                      ),
                      InsightSection(key: _insightKey),
                      CompanySection(key: _companyKey),
                      ContactQualifierSection(
                        key: _contactKey,
                        qualifierQuestionKey: _qualifierQuestionKey,
                        onOpenChatFi: () {
                          _openChatFi();
                        },
                      ),
                      YotinFooterWidget(onNavigate: _scrollToSection),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
