import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/models/chat_message.dart';
import 'package:yotin_flutter/widgets/chatfi_panel.dart';

void main() {
  test('ChatFi history keeps the newest 24 non-empty messages', () {
    final messages = List<ChatMessage>.generate(
      27,
      (index) => ChatMessage(text: 'message $index', isUser: index.isEven),
    )..insert(10, ChatMessage(text: '', isUser: false));

    final history = buildChatFiHistory(messages);

    expect(history, hasLength(kChatFiHistoryLimit));
    expect(history.first['content'], 'message 3');
    expect(history.last['content'], 'message 26');
    expect(history.first['role'], 'assistant');
    expect(history.last['role'], 'user');
  });

  test('ChatFi preserves a partial response when streaming fails', () {
    final response = buildChatFiUnavailableMessage(
      partialResponse: 'The current casing information suggests',
      reason: 'ChatFi is unavailable right now.',
    );

    expect(response, startsWith('The current casing information suggests'));
    expect(response, contains('ChatFi is unavailable right now.'));
    expect(response, contains('info@yotinenergy.com'));
  });
}
