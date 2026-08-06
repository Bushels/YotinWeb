import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/widgets/wellfi_live_hero_protocol.dart';

void main() {
  group('WellFi live hero protocol', () {
    test(
      'keeps the verified poster when motion or data saving is requested',
      () {
        const initial = WellFiLiveHeroProtocol();

        expect(
          initial.mount(reducedMotion: true, saveData: false).state,
          WellFiLiveHeroState.poster,
        );
        expect(
          initial.mount(reducedMotion: false, saveData: true).state,
          WellFiLiveHeroState.poster,
        );
        expect(
          initial.mount(reducedMotion: false, saveData: false).state,
          WellFiLiveHeroState.mounting,
        );
      },
    );

    test('requires the complete trusted R3F-ready protocol before reveal', () {
      const mounting = WellFiLiveHeroProtocol(
        state: WellFiLiveHeroState.mounting,
      );

      expect(
        mounting
            .reveal(
              sourceMatches: false,
              originMatches: true,
              messageType: 'wellfi:r3f-ready',
              version: 1,
            )
            .state,
        WellFiLiveHeroState.mounting,
      );
      expect(
        mounting
            .reveal(
              sourceMatches: true,
              originMatches: false,
              messageType: 'wellfi:r3f-ready',
              version: 1,
            )
            .state,
        WellFiLiveHeroState.mounting,
      );
      expect(
        mounting
            .reveal(
              sourceMatches: true,
              originMatches: true,
              messageType: 'wellfi:r3f-ready',
              version: 0,
            )
            .state,
        WellFiLiveHeroState.mounting,
      );

      expect(
        mounting
            .reveal(
              sourceMatches: true,
              originMatches: true,
              messageType: 'wellfi:r3f-ready',
              version: 1,
            )
            .state,
        WellFiLiveHeroState.live,
      );
    });

    test('sends active only while a trusted live hero is actually visible', () {
      const live = WellFiLiveHeroProtocol(state: WellFiLiveHeroState.live);

      expect(
        live.activityValue(
          heroVisible: true,
          frameInView: true,
          documentHidden: false,
        ),
        isTrue,
      );
      expect(
        live.activityValue(
          heroVisible: false,
          frameInView: true,
          documentHidden: false,
        ),
        isFalse,
      );
      expect(
        live.activityValue(
          heroVisible: true,
          frameInView: false,
          documentHidden: false,
        ),
        isFalse,
      );
      expect(
        live.activityValue(
          heroVisible: true,
          frameInView: true,
          documentHidden: true,
        ),
        isFalse,
      );
    });

    test(
      'a pre-ready failure removes the live path and returns a terminal state',
      () {
        const mounting = WellFiLiveHeroProtocol(
          state: WellFiLiveHeroState.mounting,
        );
        final failed = mounting.fail();

        expect(failed.state, WellFiLiveHeroState.failed);
        expect(failed.hasLiveFrame, isFalse);
        expect(failed.returnToPoster().state, WellFiLiveHeroState.poster);
      },
    );
  });
}
