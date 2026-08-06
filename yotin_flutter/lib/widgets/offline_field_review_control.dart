import 'package:flutter/material.dart';

import '../platform/offline_field_review_cache.dart';
import '../theme/yotin_theme.dart';

/// A deliberately user-triggered offline download. It avoids silently using a
/// field technician's connection to pre-cache every renderer and image.
class OfflineFieldReviewControl extends StatelessWidget {
  const OfflineFieldReviewControl({
    super.key,
    required this.cacheState,
    required this.networkAvailable,
    required this.onPrepareOffline,
  });

  final OfflineFieldReviewCacheState cacheState;
  final bool networkAvailable;
  final VoidCallback onPrepareOffline;

  @override
  Widget build(BuildContext context) {
    if (cacheState == OfflineFieldReviewCacheState.unavailable) {
      return const SizedBox.shrink();
    }

    if (!networkAvailable) {
      final ready = cacheState == OfflineFieldReviewCacheState.ready;
      return _StatusLine(
        icon: ready
            ? Icons.offline_pin
            : Icons.signal_wifi_statusbar_connected_no_internet_4,
        label: ready
            ? 'OFFLINE FIELD MODE: THE CACHED WELL REVIEW IS AVAILABLE. LIVE WELLFI AND CHATFI NEED A CONNECTION.'
            : 'NO NETWORK DETECTED: RECONNECT ONCE TO PREPARE THIS REVIEW FOR OFFLINE USE.',
        color: ready ? YotinTheme.cyanSignal : YotinTheme.emberLit,
      );
    }

    switch (cacheState) {
      case OfflineFieldReviewCacheState.idle:
        return Semantics(
          button: true,
          label: 'Prepare this Field Review for offline use',
          child: TextButton.icon(
            key: const ValueKey('prepare-offline-field-review'),
            onPressed: onPrepareOffline,
            icon: const Icon(Icons.download_for_offline_outlined, size: 17),
            label: Text(
              'PREPARE FOR OFFLINE FIELD USE',
              style: YotinTheme.fontMono.copyWith(
                color: YotinTheme.sand,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
            style: TextButton.styleFrom(
              foregroundColor: YotinTheme.sand,
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            ),
          ),
        );
      case OfflineFieldReviewCacheState.caching:
        return const _StatusLine(
          icon: Icons.downloading_outlined,
          label: 'DOWNLOADING THIS FIELD REVIEW FOR OFFLINE USE...',
          color: YotinTheme.cyanSignal,
          showProgress: true,
        );
      case OfflineFieldReviewCacheState.ready:
        return const _StatusLine(
          icon: Icons.offline_pin,
          label: 'READY FOR OFFLINE FIELD USE',
          color: YotinTheme.cyanSignal,
        );
      case OfflineFieldReviewCacheState.failed:
        return Semantics(
          liveRegion: true,
          child: TextButton.icon(
            key: const ValueKey('retry-offline-field-review'),
            onPressed: onPrepareOffline,
            icon: const Icon(Icons.refresh, size: 17),
            label: Text(
              'OFFLINE DOWNLOAD FAILED: TRY AGAIN',
              style: YotinTheme.fontMono.copyWith(
                color: YotinTheme.emberLit,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
            style: TextButton.styleFrom(
              foregroundColor: YotinTheme.emberLit,
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            ),
          ),
        );
      case OfflineFieldReviewCacheState.unavailable:
        return const SizedBox.shrink();
    }
  }
}

class _StatusLine extends StatelessWidget {
  const _StatusLine({
    required this.icon,
    required this.label,
    required this.color,
    this.showProgress = false,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool showProgress;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      liveRegion: true,
      label: label,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showProgress)
            SizedBox(
              width: 15,
              height: 15,
              child: CircularProgressIndicator(strokeWidth: 2, color: color),
            )
          else
            Icon(icon, size: 17, color: color),
          const SizedBox(width: 7),
          Flexible(
            child: Text(
              label,
              style: YotinTheme.fontMono.copyWith(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
