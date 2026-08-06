class BenefitItem {
  final int step;
  final String title;
  final String subtitle;
  final String description;
  final String spec;
  final String iconName;

  const BenefitItem({
    required this.step,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.spec,
    required this.iconName,
  });
}

/// Public benefit wording is deliberately sourced from the live static site.
/// It avoids absolute operational guarantees that have not been approved.
const List<BenefitItem> kWellFiBenefits = [
  BenefitItem(
    step: 1,
    title: 'Extend Pump Life',
    subtitle: 'Pressure and vibration context',
    description:
        'Know hydrostatic conditions, understand vibration, and act before pump failure escalates.',
    spec: 'Pressure, temperature, and vibration telemetry',
    iconName: 'gauge',
  ),
  BenefitItem(
    step: 2,
    title: 'Increase Production',
    subtitle: 'Operate with context',
    description:
        'Run closer to an informed operating point instead of flying blind.',
    spec: 'Live downhole telemetry at surface',
    iconName: 'trend_up',
  ),
  BenefitItem(
    step: 3,
    title: 'Drawdown Management',
    subtitle: 'Trend awareness',
    description:
        'Use pressure trends to support a consistent drawdown strategy.',
    spec: 'Pressure at the lift point',
    iconName: 'bell',
  ),
  BenefitItem(
    step: 4,
    title: 'Reservoir Monitoring',
    subtitle: 'Lift-point response',
    description:
        'See reservoir response at the lift point as operating conditions change.',
    spec: 'Paired pressure and fluid-condition trends',
    iconName: 'waves',
  ),
  BenefitItem(
    step: 5,
    title: 'Track Fluid Changes',
    subtitle: 'Produced-fluid trends',
    description:
        'Spot produced-fluid changes as they happen at the tool location.',
    spec: 'Fluid-composition channel',
    iconName: 'drop',
  ),
  BenefitItem(
    step: 6,
    title: 'Well Optimization',
    subtitle: 'Data to decisions',
    description:
        'Use reservoir and fluid monitoring to support practical production efficiencies.',
    spec: 'MODBUS RS-485 to the existing RTU or SCADA system',
    iconName: 'target',
  ),
];
