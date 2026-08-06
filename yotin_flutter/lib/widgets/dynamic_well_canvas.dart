import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/yotin_theme.dart';

class DynamicWellCanvas extends StatefulWidget {
  final double height;
  final bool isInteractive;

  const DynamicWellCanvas({
    super.key,
    this.height = 480,
    this.isInteractive = true,
  });

  @override
  State<DynamicWellCanvas> createState() => _DynamicWellCanvasState();
}

class _DynamicWellCanvasState extends State<DynamicWellCanvas>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  double _pulseSpeed = 1.0;
  bool _showGrid = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: YotinTheme.deepBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: YotinTheme.sandLineStrong),
        boxShadow: [
          BoxShadow(
            color: YotinTheme.ember.withValues(alpha: 0.1),
            blurRadius: 30,
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Custom Painter Canvas
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return CustomPaint(
                  size: Size.infinite,
                  painter: WellSchematicPainter(
                    animationProgress: _controller.value * _pulseSpeed,
                    showGrid: _showGrid,
                  ),
                );
              },
            ),

            // Top Status Bar Overlay
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: YotinTheme.voidBg.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: YotinTheme.ember.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: YotinTheme.cyanSignal,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'LIVE EM TELEMETRY SIMULATION',
                          style: YotinTheme.fontMono.copyWith(
                            fontSize: 11,
                            color: YotinTheme.cyanSignal,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (widget.isInteractive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: YotinTheme.deep2.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: YotinTheme.sandLine),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.speed,
                              size: 16,
                              color: YotinTheme.sand,
                            ),
                            tooltip: 'Toggle Signal Pulse Speed',
                            onPressed: () {
                              setState(() {
                                _pulseSpeed = _pulseSpeed == 1.0
                                    ? 2.5
                                    : (_pulseSpeed == 2.5 ? 0.5 : 1.0);
                              });
                            },
                          ),
                          Text(
                            '${_pulseSpeed}x',
                            style: YotinTheme.fontMono.copyWith(fontSize: 12),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: Icon(
                              _showGrid ? Icons.grid_on : Icons.grid_off,
                              size: 16,
                              color: YotinTheme.sand,
                            ),
                            tooltip: 'Toggle Grid',
                            onPressed: () {
                              setState(() {
                                _showGrid = !_showGrid;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Real-time Telemetry Stats Overlay
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: YotinTheme.voidBg.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: YotinTheme.sandLine),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isCompact = constraints.maxWidth < 500;
                    return Wrap(
                      alignment: WrapAlignment.spaceAround,
                      spacing: 12,
                      runSpacing: 8,
                      children: [
                        _buildStatPill(
                          'SURFACE MODBUS',
                          'REGISTER 40001',
                          YotinTheme.sand,
                        ),
                        _buildStatPill(
                          'PRESSURE',
                          '3,485 PSIA',
                          YotinTheme.emberLit,
                        ),
                        if (!isCompact)
                          _buildStatPill('TEMP', '94.2 °C', YotinTheme.sand),
                        _buildStatPill(
                          'EM FREQ',
                          '8.5 HZ',
                          YotinTheme.cyanSignal,
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatPill(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: YotinTheme.fontMono.copyWith(
            fontSize: 10,
            color: YotinTheme.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: YotinTheme.fontMono.copyWith(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}

class WellSchematicPainter extends CustomPainter {
  final double animationProgress; // 0.0 to 1.0
  final bool showGrid;

  WellSchematicPainter({
    required this.animationProgress,
    required this.showGrid,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;

    // Background stratum gradient
    final bgGradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [
        const Color(0xFF07141E),
        const Color(0xFF0C202E),
        const Color(0xFF131A20),
        const Color(0xFF1B140E),
      ],
      stops: const [0.0, 0.35, 0.70, 1.0],
    );
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height),
      Paint()
        ..shader = bgGradient.createShader(Rect.fromLTWH(0, 0, width, height)),
    );

    // Optional grid overlay
    if (showGrid) {
      final gridPaint = Paint()
        ..color = YotinTheme.sandLine.withValues(alpha: 0.05)
        ..strokeWidth = 1;
      const step = 40.0;
      for (double x = 0; x < width; x += step) {
        canvas.drawLine(Offset(x, 0), Offset(x, height), gridPaint);
      }
      for (double y = 0; y < height; y += step) {
        canvas.drawLine(Offset(0, y), Offset(width, y), gridPaint);
      }
    }

    final centerX = width * 0.5;

    // 1. Draw Surface Receiver Unit at the Top
    final surfaceY = height * 0.12;
    final surfaceBoxPaint = Paint()
      ..color = YotinTheme.deep2
      ..style = PaintingStyle.fill;
    final surfaceBorderPaint = Paint()
      ..color = YotinTheme.ember
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(centerX, surfaceY),
          width: 140,
          height: 36,
        ),
        const Radius.circular(8),
      ),
      surfaceBoxPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(centerX, surfaceY),
          width: 140,
          height: 36,
        ),
        const Radius.circular(8),
      ),
      surfaceBorderPaint,
    );

    // Surface Antenna / Grounding Stake
    final stakePaint = Paint()
      ..color = YotinTheme.sand
      ..strokeWidth = 2;
    canvas.drawLine(
      Offset(centerX - 90, surfaceY),
      Offset(centerX - 70, surfaceY),
      stakePaint,
    );
    canvas.drawLine(
      Offset(centerX + 70, surfaceY),
      Offset(centerX + 90, surfaceY),
      stakePaint,
    );

    // 2. Draw Downhole Casing & Tubing
    final casingTop = surfaceY + 18;
    final casingBottom = height * 0.88;
    final casingWidth = 90.0;
    final tubingWidth = 36.0;

    // Outer Intermediate Casing Lines
    final casingPaint = Paint()
      ..color = YotinTheme.sand.withValues(alpha: 0.4)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    canvas.drawLine(
      Offset(centerX - casingWidth / 2, casingTop),
      Offset(centerX - casingWidth / 2, casingBottom),
      casingPaint,
    );
    canvas.drawLine(
      Offset(centerX + casingWidth / 2, casingTop),
      Offset(centerX + casingWidth / 2, casingBottom),
      casingPaint,
    );

    // Inner Tubing
    final tubingPaint = Paint()
      ..color = YotinTheme.ember.withValues(alpha: 0.6)
      ..strokeWidth = 2;
    canvas.drawLine(
      Offset(centerX - tubingWidth / 2, casingTop),
      Offset(centerX - tubingWidth / 2, casingBottom - 40),
      tubingPaint,
    );
    canvas.drawLine(
      Offset(centerX + tubingWidth / 2, casingTop),
      Offset(centerX + tubingWidth / 2, casingBottom - 40),
      tubingPaint,
    );

    // 3. Draw Downhole WellFi Telemetry Transmitter Unit
    final toolY = casingBottom - 70;
    final toolRect = Rect.fromCenter(
      center: Offset(centerX, toolY),
      width: 48,
      height: 60,
    );

    // Tool Body Glow
    canvas.drawCircle(
      Offset(centerX, toolY),
      35,
      Paint()
        ..color = YotinTheme.cyanSignal.withValues(alpha: 0.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 15),
    );

    final toolPaint = Paint()
      ..shader = LinearGradient(
        colors: [YotinTheme.deep3, YotinTheme.ember, YotinTheme.deep2],
      ).createShader(toolRect);

    canvas.drawRRect(
      RRect.fromRectAndRadius(toolRect, const Radius.circular(6)),
      toolPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(toolRect, const Radius.circular(6)),
      Paint()
        ..color = YotinTheme.sand
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );

    // Tool Node Pulsing Indicator
    canvas.drawCircle(
      Offset(centerX, toolY),
      6,
      Paint()..color = YotinTheme.cyanSignal,
    );

    // 4. Draw EM (Electromagnetic) Signal Propagation Waves
    final waveCount = 5;
    final totalDistance = toolY - surfaceY;

    for (int i = 0; i < waveCount; i++) {
      // Progress of each wave traveling upwards (0.0 to 1.0)
      double waveProgress = (animationProgress + (i / waveCount)) % 1.0;
      double currentY = toolY - (waveProgress * totalDistance);

      if (currentY > surfaceY && currentY < toolY) {
        double waveOpacity = math.sin(
          waveProgress * math.pi,
        ); // Fades in at bottom, fades at surface
        double amplitude =
            25.0 * (1 - (waveProgress * 0.3)); // Slight damping as it ascends

        final wavePath = Path();
        for (
          double x = centerX - amplitude * 2;
          x <= centerX + amplitude * 2;
          x += 4
        ) {
          double relativeX = (x - (centerX - amplitude * 2)) / (amplitude * 4);
          double sineY =
              currentY +
              math.sin(
                    (relativeX * math.pi * 4) +
                        (animationProgress * math.pi * 4),
                  ) *
                  6;
          if (x == centerX - amplitude * 2) {
            wavePath.moveTo(x, sineY);
          } else {
            wavePath.lineTo(x, sineY);
          }
        }

        final emPaint = Paint()
          ..color = YotinTheme.cyanSignal.withValues(alpha: waveOpacity * 0.85)
          ..strokeWidth = 2.5
          ..style = PaintingStyle.stroke;

        canvas.drawPath(wavePath, emPaint);

        // Signal particle dots on the casing
        canvas.drawCircle(
          Offset(centerX - casingWidth / 2, currentY),
          3,
          Paint()..color = YotinTheme.cyanSignal.withValues(alpha: waveOpacity),
        );
        canvas.drawCircle(
          Offset(centerX + casingWidth / 2, currentY),
          3,
          Paint()..color = YotinTheme.cyanSignal.withValues(alpha: waveOpacity),
        );
      }
    }

    // 5. Depth Markers & Annotations
    final textStyle = YotinTheme.fontMono.copyWith(
      fontSize: 10,
      color: YotinTheme.textMuted,
    );

    TextPainter(
        text: TextSpan(text: '0 m (Surface)', style: textStyle),
        textDirection: TextDirection.ltr,
      )
      ..layout()
      ..paint(canvas, Offset(centerX + casingWidth / 2 + 16, surfaceY - 6));

    TextPainter(
        text: TextSpan(text: '1,000 m (Intermediate Shoe)', style: textStyle),
        textDirection: TextDirection.ltr,
      )
      ..layout()
      ..paint(
        canvas,
        Offset(centerX + casingWidth / 2 + 16, casingBottom - 40),
      );

    TextPainter(
        text: TextSpan(
          text: '1,500 m (WellFi Tool)',
          style: YotinTheme.fontMono.copyWith(
            fontSize: 10,
            color: YotinTheme.emberLit,
          ),
        ),
        textDirection: TextDirection.ltr,
      )
      ..layout()
      ..paint(canvas, Offset(centerX + casingWidth / 2 + 16, toolY - 6));
  }

  @override
  bool shouldRepaint(covariant WellSchematicPainter oldDelegate) {
    return oldDelegate.animationProgress != animationProgress ||
        oldDelegate.showGrid != showGrid;
  }
}
