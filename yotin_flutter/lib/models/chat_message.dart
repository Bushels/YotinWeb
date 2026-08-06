class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({required this.text, required this.isUser, DateTime? timestamp})
    : timestamp = timestamp ?? DateTime.now();
}

class PredefinedPrompt {
  final String label;
  final String prompt;

  const PredefinedPrompt(this.label, this.prompt);
}

const List<PredefinedPrompt> kChatFiPrompts = [
  PredefinedPrompt(
    'No Cable Telemetry',
    'How does WellFi send downhole data to surface without a cable?',
  ),
  PredefinedPrompt(
    'Max Temp & Pressure',
    'What are the pressure and temperature ratings for WellFi?',
  ),
  PredefinedPrompt(
    'MODBUS SCADA',
    'How does WellFi integrate with our existing SCADA / RTU hardware?',
  ),
  PredefinedPrompt(
    'Pump Changeouts',
    'Can WellFi be installed during a routine PCP pump changeout?',
  ),
  PredefinedPrompt(
    'About Yotin Energy',
    'Tell me about Yotin Energy and its Indigenous ownership.',
  ),
];
