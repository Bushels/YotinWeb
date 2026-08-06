import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/platform/offline_field_review_cache.dart';
import 'package:yotin_flutter/widgets/offline_field_review_control.dart';

Widget _buildControl({
  required OfflineFieldReviewCacheState state,
  bool networkAvailable = true,
  VoidCallback? onPrepareOffline,
}) {
  return MaterialApp(
    home: Scaffold(
      body: OfflineFieldReviewControl(
        cacheState: state,
        networkAvailable: networkAvailable,
        onPrepareOffline: onPrepareOffline ?? () {},
      ),
    ),
  );
}

void main() {
  testWidgets('offline control stays absent outside a service-worker browser', (
    tester,
  ) async {
    await tester.pumpWidget(
      _buildControl(state: OfflineFieldReviewCacheState.unavailable),
    );

    expect(find.byType(TextButton), findsNothing);
    expect(find.byIcon(Icons.offline_pin), findsNothing);
  });

  testWidgets('operator explicitly starts the offline package download', (
    tester,
  ) async {
    var prepares = 0;
    await tester.pumpWidget(
      _buildControl(
        state: OfflineFieldReviewCacheState.idle,
        onPrepareOffline: () => prepares += 1,
      ),
    );

    expect(find.text('PREPARE FOR OFFLINE FIELD USE'), findsOneWidget);
    await tester.tap(
      find.byKey(const ValueKey('prepare-offline-field-review')),
    );
    expect(prepares, 1);
  });

  testWidgets('cache progress and success are announced as field states', (
    tester,
  ) async {
    await tester.pumpWidget(
      _buildControl(state: OfflineFieldReviewCacheState.caching),
    );
    expect(
      find.text('DOWNLOADING THIS FIELD REVIEW FOR OFFLINE USE...'),
      findsOneWidget,
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpWidget(
      _buildControl(state: OfflineFieldReviewCacheState.ready),
    );
    expect(find.text('READY FOR OFFLINE FIELD USE'), findsOneWidget);
  });

  testWidgets('offline mode never promises live 3D or ChatFi availability', (
    tester,
  ) async {
    await tester.pumpWidget(
      _buildControl(
        state: OfflineFieldReviewCacheState.ready,
        networkAvailable: false,
      ),
    );

    expect(
      find.text(
        'OFFLINE FIELD MODE: THE CACHED WELL REVIEW IS AVAILABLE. LIVE WELLFI AND CHATFI NEED A CONNECTION.',
      ),
      findsOneWidget,
    );
  });
}
