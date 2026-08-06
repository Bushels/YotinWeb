import 'dart:ui';

import 'package:flutter/foundation.dart' show ValueKey;
import 'package:flutter/material.dart'
    show
        MaterialApp,
        MediaQuery,
        MediaQueryData,
        Scaffold,
        SingleChildScrollView;
import 'package:flutter/semantics.dart' show Assertiveness;
import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/main.dart';
import 'package:yotin_flutter/widgets/chatfi_panel.dart';
import 'package:yotin_flutter/widgets/candidate_well_qualifier.dart';
import 'package:yotin_flutter/widgets/navigation_bar.dart';
import 'package:yotin_flutter/sections/hero_section.dart';

void main() {
  testWidgets('Smoke test Yotin Energy Flutter App landmark', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const YotinFlutterApp());
    expect(find.byType(YotinHomePage), findsOneWidget);
    expect(find.textContaining('Candidate-Well Qualifier'), findsOneWidget);
  });

  testWidgets('field review exposes a main landmark and a level-one heading', (
    WidgetTester tester,
  ) async {
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(const YotinFlutterApp());

      final main = tester.getSemantics(
        find.bySemanticsLabel('Field review information'),
      );
      expect(main.role, SemanticsRole.main);

      final heading = tester.getSemantics(find.text('Know the\nUnknown.'));
      expect(heading.flagsCollection.isHeader, isTrue);
      expect(heading.headingLevel, 1);
    } finally {
      semantics.dispose();
    }
  });

  testWidgets('mobile navigation and ChatFi dialog do not overflow', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const YotinFlutterApp());
    expect(tester.takeException(), isNull);

    await tester.tap(find.byTooltip('Open ChatFi AI'));
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.byType(ChatFiPanelWidget), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.byTooltip('Close ChatFi'));
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'desktop navigation exposes the public four-destination contract',
    (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(1280, 720));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(const YotinFlutterApp());

      final desktopNavigation = find.byKey(
        const ValueKey('desktop-primary-navigation'),
      );
      expect(desktopNavigation, findsOneWidget);
      expect(
        find.descendant(of: desktopNavigation, matching: find.text('WellFi')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: desktopNavigation, matching: find.text('Benefits')),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: desktopNavigation,
          matching: find.text('Our Company'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(of: desktopNavigation, matching: find.text('Contact')),
        findsOneWidget,
      );
      expect(find.byTooltip('Open site navigation'), findsNothing);
    },
  );

  testWidgets('desktop navigation routes each public destination', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1280, 720));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final destinations = <String>[];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: YotinNavigationBar(
            onNavigate: destinations.add,
            onOpenChatFi: () {},
          ),
        ),
      ),
    );

    for (final route in const [
      ('WellFi', 'wellfi'),
      ('Benefits', 'benefits'),
      ('Our Company', 'company'),
      ('Contact', 'contact'),
    ]) {
      await tester.tap(find.text(route.$1));
      await tester.pump();
    }

    expect(destinations, ['wellfi', 'benefits', 'company', 'contact']);
  });

  testWidgets('hero conversion calls remain directly actionable', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1280, 600));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    var evaluateCalls = 0;
    var exploreCalls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: HeroSection(
              heroVisible: true,
              onEvaluate: () => evaluateCalls += 1,
              onExplore: () => exploreCalls += 1,
            ),
          ),
        ),
      ),
    );

    await tester.scrollUntilVisible(find.text('CHECK YOUR WELL FIT'), 200);
    await tester.tap(find.text('CHECK YOUR WELL FIT'));
    await tester.pump();
    await tester.scrollUntilVisible(find.text('EXPLORE WELLFI'), 200);
    await tester.tap(find.text('EXPLORE WELLFI'));
    await tester.pump();

    expect(evaluateCalls, 1);
    expect(exploreCalls, 1);
    expect(tester.takeException(), isNull);
  });

  testWidgets('qualifier labels casing input and announces validation error', (
    WidgetTester tester,
  ) async {
    final semantics = tester.ensureSemantics();
    try {
      await tester.binding.setSurfaceSize(const Size(1280, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        const MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(supportsAnnounce: true),
            child: Scaffold(
              body: SingleChildScrollView(
                child: CandidateWellQualifierWidget(),
              ),
            ),
          ),
        ),
      );

      for (final option in const [
        'Progressing cavity pump (PCP)',
        'Heavy oil',
        'Under 100 °C',
      ]) {
        await tester.tap(find.text(option));
        await tester.pump();
      }

      final input = find.byKey(const ValueKey('intermediate-casing-length'));
      expect(input, findsOneWidget);
      expect(
        find.bySemanticsLabel('Intermediate casing length (m), e.g. 1000'),
        findsOneWidget,
      );

      await tester.tap(find.text('Continue'));
      await tester.pump();

      const error = 'Enter the approximate length in metres.';
      final errorText = find.text(error);
      expect(errorText, findsOneWidget);
      expect(
        tester
            .getSemantics(find.bySemanticsLabel(error))
            .flagsCollection
            .isLiveRegion,
        isTrue,
      );
      expect(tester.takeAnnouncements(), [
        isAccessibilityAnnouncement(
          error,
          textDirection: TextDirection.ltr,
          assertiveness: Assertiveness.assertive,
        ),
      ]);
    } finally {
      semantics.dispose();
    }
  });

  testWidgets('app shell renders at all audited widths', (
    WidgetTester tester,
  ) async {
    addTearDown(() => tester.binding.setSurfaceSize(null));

    for (final size in const [
      Size(390, 844),
      Size(820, 900),
      Size(1280, 600),
      Size(1280, 720),
      Size(1600, 1000),
    ]) {
      await tester.binding.setSurfaceSize(size);
      await tester.pumpWidget(const YotinFlutterApp());
      await tester.pump(const Duration(milliseconds: 200));

      expect(tester.takeException(), isNull, reason: 'viewport: $size');
    }
  });
}
