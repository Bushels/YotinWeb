// Golden-string contract against the static marketing site.
//
// GEMINI.md names `..\main.js` and `..\index.html` as the source of truth for
// approved public copy. The existing suite asserts *structure* — a main
// landmark exists, four nav labels exist, nothing overflows — but never
// *content*, which is why three approved strings were silently rewritten into
// new marketing copy while every gate stayed green.
//
// Each literal below is quoted from the static site with its source location.
// A failure here is not necessarily a bug in this app: it means the two
// surfaces disagree, and a human decides which one moves.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/models/qualifier_model.dart';
import 'package:yotin_flutter/theme/yotin_theme.dart';
import 'package:yotin_flutter/widgets/candidate_well_qualifier.dart';
import 'package:yotin_flutter/widgets/chatfi_panel.dart';
import 'package:yotin_flutter/widgets/navigation_bar.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: YotinTheme.darkTheme,
    home: Scaffold(body: SingleChildScrollView(child: child)),
  );
}

void main() {
  group('approved qualifier copy', () {
    testWidgets('intro keeps the no-contact-details and "no" clauses', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(SizedBox(width: 900, child: CandidateWellQualifierWidget())),
      );

      // index.html:570 and :573.
      expect(find.text('Will WellFi fit your well?'), findsOneWidget);
      expect(
        find.text(
          'Six questions, no contact details required to see the answer — '
          'including when the answer is no.',
        ),
        findsOneWidget,
        reason:
            'The qualifier is allowed to say no. That promise is the section, '
            'not decoration on it.',
      );
      // index.html:569 eyebrow, and main.js step header wording.
      expect(find.text('60-SECOND CHECK'), findsOneWidget);
      expect(find.text('Question 1 of 6'), findsOneWidget);
    });

    test('verdict labels and subjects match main.js:955-1025', () {
      const strong = QualifierState(
        lift: 'Progressing cavity pump (PCP)',
        wellType: 'Heavy oil',
        bottomholeTemp: 'Under 100 °C',
        intermediateCasingLength: 1000,
        pumpLanding: 'Shallower than 900 m',
        interventionTiming: 'Within 3 months',
      );
      expect(strong.outcome, QualifierOutcome.strong);
      expect(strong.selfCheckResultLabel, 'Strong fit');
      expect(strong.emailSubject, 'Candidate well review — WellFi');

      const review = QualifierState(
        lift: 'Natural flow or other',
        wellType: 'Heavy oil',
        bottomholeTemp: 'Under 100 °C',
        intermediateCasingLength: 1000,
        pumpLanding: 'Shallower than 900 m',
        interventionTiming: 'Within 3 months',
      );
      expect(review.outcome, QualifierOutcome.review);
      expect(review.selfCheckResultLabel, 'Likely fit — worth a review');

      const future = QualifierState(bottomholeTemp: 'Above 150 °C');
      expect(future.outcome, QualifierOutcome.future);
      expect(
        future.selfCheckResultLabel,
        'Above 150 °C — waiting on the high-temperature version',
      );
      expect(
        future.emailSubject,
        'Candidate well — awaiting 150 °C+ WellFi',
        reason: 'High temperature is a waitlist path, not a rejection.',
      );
    });

    test('engineering notes are byte-identical to main.js:738-745', () {
      expect(
        QualifierState.qualifierNotes['temp'],
        'Bottomhole temperature is the one hard limit — WellFi is rated to '
        '150 °C today, so that number is worth confirming before anything '
        'else.',
      );
      expect(
        QualifierState.qualifierNotes['lift'],
        'Most deployments so far are on pumped wells. Other lift types are '
        'workable but worth walking through.',
      );
      expect(
        QualifierState.qualifierNotes['thermal'],
        'Thermal and SAGD wells sit closest to the temperature ceiling, so '
        'the operating profile matters more than usual.',
      );
      expect(
        QualifierState.qualifierNotes['landing'],
        'Where the pump sits relative to the intermediate shoe decides '
        'whether WellFi runs inside the tubing or outside the intermediate. '
        'Worth pinning down before the changeout gets scoped.',
      );
      expect(
        QualifierState.qualifierNotes['timing'],
        'WellFi can go in on a new completion, a planned changeout, or its '
        'own run. The economics are simply strongest when it rides along with '
        'work that is already scheduled.',
      );
      expect(
        QualifierState.qualifierNotes['external'],
        contains('roughly 10% of the'),
      );
    });
  });

  group('metre formatting matches main.js fmtNum', () {
    test('groups thousands and rounds half-up', () {
      // String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      expect(QualifierState.formatMetres(900), '900');
      expect(QualifierState.formatMetres(1350), '1,350');
      expect(QualifierState.formatMetres(5400), '5,400');
      expect(QualifierState.formatMetres(1000), '1,000');
      expect(QualifierState.formatMetres(999), '999');
      expect(QualifierState.formatMetres(1234.4), '1,234');
      expect(QualifierState.formatMetres(1234.6), '1,235');
    });

    test('a four-digit threshold reaches the operator grouped', () {
      const state = QualifierState(intermediateCasingLength: 1500);
      expect(state.landingThreshold, 1350);
      expect(
        QualifierState.formatMetres(state.landingThreshold!),
        '1,350',
        reason:
            'The live site reads "1,350 m"; an uninterpolated int reads '
            '"1350 m".',
      );
    });
  });

  group('ChatFi disclosure', () {
    testWidgets('keeps the conversation-review clause', (tester) async {
      await tester.pumpWidget(
        _wrap(
          SizedBox(
            height: 700,
            width: 420,
            child: ChatFiPanelWidget(onClose: () {}),
          ),
        ),
      );

      // index.html:618 — verbatim, including the middle sentence.
      expect(
        find.text(
          'ChatFi is an AI assistant. Conversations may be reviewed to improve '
          'the service. Confirm anything that matters directly with Yotin.',
        ),
        findsOneWidget,
        reason:
            'The "may be reviewed" sentence is the disclosure doing the work; '
            'shortening it for layout changes what the user was told.',
      );
    });

    test('endpoint is build-time configurable and defaults to production', () {
      expect(
        kChatFiEndpoint,
        'https://chatfi-server-851855129205.us-central1.run.app/chat',
        reason:
            'Default must stay production; a preview retargets it with '
            '--dart-define=CHATFI_ENDPOINT.',
      );
    });
  });

  group('header contract', () {
    // The static site switches nav treatment once, at 820 px. These widths sit
    // either side of the matching threshold in YotinNavigationBar, including
    // the 860-1119 band that the original audited widths stepped over.
    for (final width in <double>[390, 820, 860, 1024, 1280, 1600]) {
      testWidgets('renders without overflow at ${width.toInt()} px', (
        tester,
      ) async {
        tester.view.physicalSize = Size(width, 900);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(
          _wrap(YotinNavigationBar(onNavigate: (_) {}, onOpenChatFi: () {})),
        );
        await tester.pump();

        expect(tester.takeException(), isNull);

        // Above the breakpoint the four public destinations must be present,
        // and the hamburger must not be — no third hybrid state.
        if (width >= 860) {
          // Uppercased by `.desktop-nav a { text-transform: uppercase }`.
          for (final label in [
            'WELLFI',
            'BENEFITS',
            'OUR COMPANY',
            'CONTACT',
          ]) {
            expect(find.text(label), findsOneWidget, reason: 'at $width px');
          }
          expect(find.byTooltip('Open site navigation'), findsNothing);
          expect(find.text('EVALUATE WELL'), findsNothing);
        } else {
          expect(find.byTooltip('Open site navigation'), findsOneWidget);
        }
      });
    }

    testWidgets('header CTA uses the static label', (tester) async {
      tester.view.physicalSize = const Size(1280, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _wrap(YotinNavigationBar(onNavigate: (_) {}, onOpenChatFi: () {})),
      );

      // index.html:218 `Ask ChatFi`, uppercased by `.nav-cta`.
      expect(find.text('ASK CHATFI'), findsOneWidget);
    });
  });

  group('typeface roles match styles.css', () {
    // styles.css declares --font-display on 23 rules and --font-hero on
    // exactly one: `.hero-message h1` (styles.css:264). Space Grotesk is the
    // page H1 and nothing else.
    test('display role is Archivo, hero-title role is Space Grotesk', () {
      expect(YotinTheme.fontDisplay.fontFamily, contains('Archivo'));
      expect(YotinTheme.fontHeroTitle.fontFamily, contains('SpaceGrotesk'));
    });

    test('every theme font weight has a bundled asset behind it', () {
      // allowRuntimeFetching is false, and pubspec bundles exactly one variant
      // per family: Archivo-Bold, SpaceGrotesk-Bold, IBMPlexSans-Regular,
      // IBMPlexMono-Medium. Requesting a weight with no asset risks falling
      // back to a default face. This is the guard for that, not a claim of
      // exact weight parity with the static site (whose H1 is 500).
      expect(YotinTheme.fontHeroTitle.fontWeight, FontWeight.w700);
      expect(YotinTheme.fontDisplay.fontWeight, FontWeight.w700);
      expect(YotinTheme.fontBody.fontWeight, FontWeight.w400);
      expect(YotinTheme.fontMono.fontWeight, FontWeight.w500);
    });

    test('Archivo is actually reachable through the theme', () {
      final theme = YotinTheme.darkTheme.textTheme;
      expect(theme.displayLarge?.fontFamily, contains('SpaceGrotesk'));
      expect(theme.displayMedium?.fontFamily, contains('Archivo'));
    });
  });
}
