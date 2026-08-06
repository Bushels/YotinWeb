/// The small, platform-neutral part of the WellFi live-scene bridge.
///
/// Keeping the protocol separate from the browser element makes its safety
/// gates testable on every Flutter target, including the normal VM test suite.
enum WellFiLiveHeroState { poster, mounting, live, failed }

class WellFiLiveHeroProtocol {
  const WellFiLiveHeroProtocol({this.state = WellFiLiveHeroState.poster});

  final WellFiLiveHeroState state;

  bool get hasLiveFrame =>
      state == WellFiLiveHeroState.mounting ||
      state == WellFiLiveHeroState.live;

  bool get isLive => state == WellFiLiveHeroState.live;

  WellFiLiveHeroProtocol mount({
    required bool reducedMotion,
    required bool saveData,
  }) {
    if (reducedMotion || saveData || state != WellFiLiveHeroState.poster) {
      return this;
    }
    return const WellFiLiveHeroProtocol(state: WellFiLiveHeroState.mounting);
  }

  WellFiLiveHeroProtocol reveal({
    required bool sourceMatches,
    required bool originMatches,
    required String? messageType,
    required int? version,
  }) {
    if (state != WellFiLiveHeroState.mounting ||
        !sourceMatches ||
        !originMatches ||
        messageType != 'wellfi:r3f-ready' ||
        version != 1) {
      return this;
    }
    return const WellFiLiveHeroProtocol(state: WellFiLiveHeroState.live);
  }

  WellFiLiveHeroProtocol fail() {
    if (state == WellFiLiveHeroState.live) return this;
    return const WellFiLiveHeroProtocol(state: WellFiLiveHeroState.failed);
  }

  WellFiLiveHeroProtocol returnToPoster() {
    if (state == WellFiLiveHeroState.poster) return this;
    return const WellFiLiveHeroProtocol(state: WellFiLiveHeroState.poster);
  }

  bool activityValue({
    required bool heroVisible,
    required bool frameInView,
    required bool documentHidden,
  }) {
    return isLive && heroVisible && frameInView && !documentHidden;
  }
}
