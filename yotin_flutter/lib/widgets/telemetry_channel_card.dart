import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/yotin_theme.dart';

class TelemetryChannelCard extends StatefulWidget {
  final String channelName;
  final String value;
  final String unit;
  final String description;
  final IconData icon;
  final Color themeColor;

  const TelemetryChannelCard({
    super.key,
    required this.channelName,
    required this.value,
    required this.unit,
    required this.description,
    required this.icon,
    this.themeColor = YotinTheme.ember,
  });

  @override
  State<TelemetryChannelCard> createState() => _TelemetryChannelCardState();
}

class _TelemetryChannelCardState extends State<TelemetryChannelCard>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late AnimationController _animController;
  bool _isHovered = false;
  bool _appIsActive = true;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncAnimation();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _appIsActive = state == AppLifecycleState.resumed;
    if (mounted) _syncAnimation();
  }

  void _syncAnimation() {
    final shouldAnimate =
        _appIsActive &&
        !MediaQuery.of(context).disableAnimations &&
        TickerMode.valuesOf(context).enabled;
    if (shouldAnimate && !_animController.isAnimating) {
      _animController.repeat();
    } else if (!shouldAnimate && _animController.isAnimating) {
      _animController.stop();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 360;
        final padding = isCompact ? 16.0 : 20.0;

        return MouseRegion(
          onEnter: (_) => setState(() => _isHovered = true),
          onExit: (_) => setState(() => _isHovered = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: EdgeInsets.all(padding),
            decoration: YotinTheme.cardDecoration(
              bg: _isHovered ? YotinTheme.deep2 : YotinTheme.deepBg,
              borderColor: _isHovered ? widget.themeColor : YotinTheme.sandLine,
              glow: _isHovered,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(widget.icon, color: widget.themeColor, size: 24),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        widget.channelName.toUpperCase(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: YotinTheme.fontMono.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: YotinTheme.sand,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: widget.themeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'LIVE CHANNEL',
                    style: YotinTheme.fontMono.copyWith(
                      fontSize: 10,
                      color: widget.themeColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.end,
                  spacing: 6,
                  runSpacing: 2,
                  children: [
                    Text(
                      widget.value,
                      style: YotinTheme.fontDisplay.copyWith(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: YotinTheme.textWhite,
                      ),
                    ),
                    Text(
                      widget.unit,
                      style: YotinTheme.fontMono.copyWith(
                        fontSize: 14,
                        color: YotinTheme.emberLit,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 48,
                  width: double.infinity,
                  child: AnimatedBuilder(
                    animation: _animController,
                    builder: (context, child) => CustomPaint(
                      painter: WaveformPainter(
                        progress: _animController.value,
                        color: widget.themeColor,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  widget.description,
                  style: YotinTheme.fontBody.copyWith(
                    fontSize: 13,
                    color: YotinTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class WaveformPainter extends CustomPainter {
  final double progress;
  final Color color;

  WaveformPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    final path = Path();

    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    for (double x = 0; x <= width; x += 3) {
      double relativeX = x / width;
      double y =
          (height / 2) +
          math.sin((relativeX * math.pi * 6) - (progress * math.pi * 2)) * 14 +
          math.cos((relativeX * math.pi * 3) + (progress * math.pi * 2)) * 6;

      if (x == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant WaveformPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
