import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';

class WellFiSection extends StatelessWidget {
  const WellFiSection({super.key});

  @override
  Widget build(BuildContext context) {
    const channels = [
      _Channel(
        tag: 'CH-01',
        title: 'Pressure',
        description:
            'Pump-intake and reservoir-response pressure at the lift point.',
        icon: Icons.speed,
      ),
      _Channel(
        tag: 'CH-02',
        title: 'Temperature',
        description:
            'Temperature trends at the tool depth and operating interval.',
        icon: Icons.thermostat,
      ),
      _Channel(
        tag: 'CH-03',
        title: 'Vibration',
        description:
            'Pump and string vibration changes before abnormal operation escalates.',
        icon: Icons.graphic_eq,
      ),
      _Channel(
        tag: 'CH-04',
        title: 'Fluid composition',
        description:
            'Produced-fluid composition changes from the tool location or paired layouts.',
        icon: Icons.water_drop_outlined,
      ),
      _Channel(
        tag: 'CH-05',
        title: 'Flow insight',
        description:
            'Interval behaviour interpreted from paired pressure and fluid-condition trends.',
        icon: Icons.trending_up,
      ),
    ];

    const journey = [
      _Journey(
        number: '01',
        title: 'Create the antenna gap',
        description:
            'A fiberglass collar electrically separates the tubing string.',
        icon: Icons.link_off,
      ),
      _Journey(
        number: '02',
        title: 'Transmit through the formation',
        description:
            'The downhole tool sends a low-power electromagnetic signal without a new cable.',
        icon: Icons.wifi,
      ),
      _Journey(
        number: '03',
        title: 'Decode at surface',
        description:
            'A surface receiver and ground reference recover the telemetry.',
        icon: Icons.memory,
      ),
      _Journey(
        number: '04',
        title: 'Connect to operations',
        description:
            'Readings land on MODBUS RS-485 for the existing RTU or SCADA system.',
        icon: Icons.settings_input_component,
      ),
    ];

    const specs = [
      _Spec(
        label: 'Pressure rating',
        value: '10,000',
        unit: 'psia',
        icon: Icons.speed,
      ),
      _Spec(
        label: 'Temperature rating',
        value: '150',
        unit: '°C',
        icon: Icons.thermostat,
      ),
      _Spec(
        label: 'Tool outer diameter',
        value: '46',
        unit: 'mm',
        icon: Icons.straighten,
      ),
      _Spec(
        label: 'Battery life',
        value: '5+',
        unit: 'years',
        icon: Icons.battery_charging_full,
      ),
      _Spec(
        label: 'International installs',
        value: '160',
        unit: '',
        icon: Icons.public,
      ),
      _Spec(
        label: 'Surface output',
        value: 'RS-485',
        unit: '',
        icon: Icons.settings_input_component,
      ),
    ];

    return Container(
      width: double.infinity,
      color: YotinTheme.deepBg,
      padding: const EdgeInsets.symmetric(vertical: 76, horizontal: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'REAL-TIME WIRELESS DOWNHOLE TELEMETRY',
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.ember,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 18),
              Semantics(
                header: true,
                child: Text(
                  'Data Below.\nInsight Above.',
                  style: YotinTheme.fontDisplay.copyWith(
                    fontSize: 42,
                    height: 1.02,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'PRESSURE. TEMPERATURE. VIBRATION. AT SURFACE.',
                style: YotinTheme.fontMono.copyWith(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: YotinTheme.sand,
                  letterSpacing: 1.05,
                ),
              ),
              const SizedBox(height: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: Text(
                  'WellFi can be added during a pump change or included in a new well. '
                  'A fiberglass collar creates the antenna gap, the tool sends data through '
                  'the surrounding formation, and the surface receiver hands the decoded '
                  'readings to MODBUS RS-485.',
                  style: YotinTheme.fontBody.copyWith(
                    color: YotinTheme.textMuted,
                    fontSize: 16,
                    height: 1.6,
                  ),
                ),
              ),
              const SizedBox(height: 52),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Semantics(
                      header: true,
                      child: Text(
                        'Explore your data',
                        style: YotinTheme.fontDisplay.copyWith(fontSize: 25),
                      ),
                    ),
                  ),
                  Text(
                    'FIVE CHANNELS · ONE TOOL',
                    style: YotinTheme.fontMono.copyWith(
                      color: YotinTheme.sandMute,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 1200
                      ? 5
                      : constraints.maxWidth >= 760
                      ? 3
                      : 1;
                  final ratio = columns == 1
                      ? 1.7
                      : columns == 3
                      ? 1.28
                      : 1.02;
                  final cardHeight = switch (columns) {
                    1 => 208.0,
                    3 => 295.0,
                    _ => 270.0,
                  };
                  return GridView.count(
                    crossAxisCount: columns,
                    childAspectRatio: ratio,
                    mainAxisExtent: cardHeight,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: channels,
                  );
                },
              ),
              const SizedBox(height: 64),
              Semantics(
                header: true,
                child: Text(
                  'How WellFi works',
                  style: YotinTheme.fontDisplay.copyWith(fontSize: 28),
                ),
              ),
              const SizedBox(height: 20),
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 1000
                      ? 4
                      : constraints.maxWidth >= 620
                      ? 2
                      : 1;
                  return GridView.count(
                    crossAxisCount: columns,
                    childAspectRatio: columns == 1 ? 2.05 : 1.45,
                    mainAxisExtent: columns == 1 ? 184 : null,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 20,
                    mainAxisSpacing: 20,
                    children: journey,
                  );
                },
              ),
              const SizedBox(height: 56),
              Semantics(
                header: true,
                child: Text(
                  'Public specifications',
                  style: YotinTheme.fontDisplay.copyWith(fontSize: 28),
                ),
              ),
              const SizedBox(height: 20),
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 920
                      ? 3
                      : constraints.maxWidth >= 600
                      ? 2
                      : 1;
                  return GridView.count(
                    crossAxisCount: columns,
                    childAspectRatio: columns == 1 ? 2.9 : 2.1,
                    mainAxisExtent: columns == 1 ? 128 : null,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: specs,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Channel extends StatelessWidget {
  const _Channel({
    required this.tag,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String tag;
  final String title;
  final String description;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: '$title. $description',
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: YotinTheme.cardDecoration(borderRadius: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: YotinTheme.emberLit, size: 23),
                const Spacer(),
                Text(
                  tag,
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 10,
                    color: YotinTheme.sandMute,
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(title, style: YotinTheme.fontDisplay.copyWith(fontSize: 20)),
            const SizedBox(height: 8),
            Text(
              description,
              style: YotinTheme.fontBody.copyWith(
                fontSize: 13,
                color: YotinTheme.textMuted,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Journey extends StatelessWidget {
  const _Journey({
    required this.number,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String number;
  final String title;
  final String description;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(left: BorderSide(color: YotinTheme.sandLineStrong)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Icon(icon, color: YotinTheme.emberLit, size: 22),
              const SizedBox(height: 6),
              Text(
                number,
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.ember,
                  fontSize: 10,
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: YotinTheme.fontDisplay.copyWith(fontSize: 16),
                ),
                const SizedBox(height: 7),
                Text(
                  description,
                  style: YotinTheme.fontBody.copyWith(
                    fontSize: 12,
                    color: YotinTheme.textMuted,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Spec extends StatelessWidget {
  const _Spec({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
  });

  final String label;
  final String value;
  final String unit;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: YotinTheme.deep2,
        border: Border.all(color: YotinTheme.sandLine),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          Icon(icon, color: YotinTheme.emberLit, size: 21),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label.toUpperCase(),
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 10,
                    color: YotinTheme.sandMute,
                  ),
                ),
                const SizedBox(height: 4),
                Text.rich(
                  TextSpan(
                    text: value,
                    style: YotinTheme.fontDisplay.copyWith(fontSize: 22),
                    children: [
                      if (unit.isNotEmpty)
                        TextSpan(
                          text: ' $unit',
                          style: YotinTheme.fontMono.copyWith(
                            fontSize: 12,
                            color: YotinTheme.emberLit,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
