import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import '../models/chat_message.dart';
import '../theme/yotin_theme.dart';

const int kChatFiHistoryLimit = 24;
const int kChatFiMaxUserCharacters = 4000;

/// Converts the current conversation into the Cloud Run contract while keeping
/// the newest context, rather than accidentally retaining the oldest turns.
List<Map<String, String>> buildChatFiHistory(Iterable<ChatMessage> messages) {
  final nonEmptyMessages = messages
      .where((message) => message.text.isNotEmpty)
      .toList();
  final start = math.max(0, nonEmptyMessages.length - kChatFiHistoryLimit);

  return nonEmptyMessages
      .skip(start)
      .map(
        (message) => <String, String>{
          'role': message.isUser ? 'user' : 'assistant',
          'content': message.text,
        },
      )
      .toList(growable: false);
}

/// Keeps a useful partial answer visible when a streaming connection ends
/// unexpectedly instead of replacing the answer with a generic failure state.
String buildChatFiUnavailableMessage({
  required String partialResponse,
  required String reason,
}) {
  const followUp =
      'Please email info@yotinenergy.com with your question or candidate-well details.';
  final fallback = '$reason $followUp';
  final preserved = partialResponse.trim();
  return preserved.isEmpty ? fallback : '$preserved\n\n$fallback';
}

enum ChatFiAvailability { ready, connected, unavailable }

class ChatFiPanelWidget extends StatefulWidget {
  final VoidCallback onClose;
  final String endpoint;
  final http.Client Function()? createClient;

  const ChatFiPanelWidget({
    super.key,
    required this.onClose,
    this.endpoint =
        'https://chatfi-server-851855129205.us-central1.run.app/chat',
    this.createClient,
  });

  @override
  State<ChatFiPanelWidget> createState() => _ChatFiPanelWidgetState();
}

class _ChatFiPanelWidgetState extends State<ChatFiPanelWidget> {
  final List<ChatMessage> _messages = [
    ChatMessage(
      text:
          'Ask ChatFi about WellFi wireless telemetry, pressure and temperature monitoring, downhole casing specifications, or candidate-well qualification.',
      isUser: false,
    ),
  ];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  bool _isTyping = false;
  int _activeRequestId = 0;
  http.Client? _activeClient;
  ChatFiAvailability _availability = ChatFiAvailability.ready;

  @override
  void dispose() {
    _cancelActiveRequest(announce: false);
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage(String text) async {
    final query = text.trim();
    if (query.isEmpty || _isTyping) return;

    final requestId = ++_activeRequestId;
    setState(() {
      _messages.add(ChatMessage(text: query, isUser: true));
      _messages.add(ChatMessage(text: '', isUser: false));
      _isTyping = true;
      _availability = ChatFiAvailability.ready;
    });
    _inputController.clear();
    _scrollToBottom();

    final client = widget.createClient?.call() ?? http.Client();
    _activeClient = client;

    try {
      final request = http.Request('POST', Uri.parse(widget.endpoint));
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(<String, Object>{
        'messages': buildChatFiHistory(_messages),
      });

      final response = await client.send(request);
      if (!mounted || requestId != _activeRequestId) return;

      if (response.statusCode != 200) {
        _showUnavailable(
          'ChatFi could not reach its response service right now.',
        );
        return;
      }

      setState(() => _availability = ChatFiAvailability.connected);
      var accumulated = '';
      await for (final chunk in response.stream.transform(utf8.decoder)) {
        if (!mounted || requestId != _activeRequestId) return;
        accumulated += chunk;
        _replaceLatestAssistantMessage(accumulated);
      }

      if (mounted && requestId == _activeRequestId && accumulated.isEmpty) {
        _showUnavailable('ChatFi returned an empty response.');
      }
    } catch (_) {
      if (mounted && requestId == _activeRequestId) {
        _showUnavailable('ChatFi is unavailable right now.');
      }
    } finally {
      if (requestId == _activeRequestId) {
        _activeClient = null;
        client.close();
        if (mounted) setState(() => _isTyping = false);
      }
    }
  }

  void _replaceLatestAssistantMessage(String text) {
    final assistantIndex = _messages.lastIndexWhere(
      (message) => !message.isUser,
    );
    if (assistantIndex == -1) return;

    setState(() {
      _messages[assistantIndex] = ChatMessage(text: text, isUser: false);
    });
    _scrollToBottom();
  }

  void _showUnavailable(String reason) {
    _availability = ChatFiAvailability.unavailable;
    final assistantIndex = _messages.lastIndexWhere(
      (message) => !message.isUser,
    );
    final partialResponse = assistantIndex == -1
        ? ''
        : _messages[assistantIndex].text;
    _replaceLatestAssistantMessage(
      buildChatFiUnavailableMessage(
        partialResponse: partialResponse,
        reason: reason,
      ),
    );
  }

  void _cancelActiveRequest({bool announce = true}) {
    if (!_isTyping && _activeClient == null) return;

    ++_activeRequestId;
    _activeClient?.close();
    _activeClient = null;

    if (!announce || !mounted) return;

    setState(() {
      _isTyping = false;
      final assistantIndex = _messages.lastIndexWhere(
        (message) => !message.isUser,
      );
      if (assistantIndex != -1 && _messages[assistantIndex].text.isEmpty) {
        _messages[assistantIndex] = ChatMessage(
          text: 'Response stopped.',
          isUser: false,
        );
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'ChatFi assistant',
      child: Container(
        decoration: BoxDecoration(
          color: YotinTheme.voidBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: YotinTheme.ember.withValues(alpha: 0.6),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 30,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          children: [
            _buildHeader(),
            _buildQuickPrompts(),
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) => _buildBubble(_messages[index]),
              ),
            ),
            if (_isTyping) _buildStreamingStatus(),
            _buildInput(),
            _buildDisclosure(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final (statusText, statusColor) = switch (_availability) {
      ChatFiAvailability.ready => ('Ready to send', YotinTheme.sandMute),
      ChatFiAvailability.connected => (
        'Connected for this conversation',
        YotinTheme.cyanSignal,
      ),
      ChatFiAvailability.unavailable => (
        'Temporarily unavailable',
        Colors.orangeAccent,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: YotinTheme.deepBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
        border: Border(bottom: BorderSide(color: YotinTheme.sandLine)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: YotinTheme.ember.withValues(alpha: 0.2),
              shape: BoxShape.circle,
              border: Border.all(color: YotinTheme.ember),
            ),
            child: const Icon(Icons.bolt, color: YotinTheme.ember, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ChatFi AI',
                  style: YotinTheme.fontHero.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  statusText,
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 10,
                    color: statusColor,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Close ChatFi',
            icon: const Icon(Icons.close, color: YotinTheme.sand),
            onPressed: widget.onClose,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickPrompts() {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
      color: YotinTheme.deep2,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: kChatFiPrompts.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = kChatFiPrompts[index];
          return ActionChip(
            label: Text(
              item.label,
              style: YotinTheme.fontMono.copyWith(
                fontSize: 11,
                color: YotinTheme.sand,
              ),
            ),
            backgroundColor: YotinTheme.deep3,
            side: BorderSide(color: YotinTheme.sandLine),
            onPressed: _isTyping ? null : () => _sendMessage(item.prompt),
          );
        },
      ),
    );
  }

  Widget _buildStreamingStatus() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 8, bottom: 8),
      child: Row(
        children: [
          const SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: YotinTheme.ember,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Waiting for ChatFi…',
              style: YotinTheme.fontMono.copyWith(
                fontSize: 11,
                color: YotinTheme.textMuted,
              ),
            ),
          ),
          TextButton.icon(
            onPressed: _cancelActiveRequest,
            icon: const Icon(Icons.stop_circle_outlined, size: 16),
            label: const Text('Stop'),
          ),
        ],
      ),
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: YotinTheme.deepBg,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15)),
        border: Border(top: BorderSide(color: YotinTheme.sandLine)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              enabled: !_isTyping,
              maxLength: kChatFiMaxUserCharacters,
              maxLengthEnforcement: MaxLengthEnforcement.enforced,
              textInputAction: TextInputAction.send,
              style: YotinTheme.fontBody.copyWith(
                fontSize: 14,
                color: YotinTheme.textWhite,
              ),
              decoration: InputDecoration(
                hintText: 'Ask ChatFi about WellFi…',
                hintStyle: YotinTheme.fontBody.copyWith(
                  color: YotinTheme.textMuted,
                  fontSize: 14,
                ),
                filled: true,
                fillColor: YotinTheme.deep2,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide(color: YotinTheme.sandLine),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: YotinTheme.ember),
                ),
              ),
              onSubmitted: _sendMessage,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'Send message',
            icon: const Icon(Icons.send_rounded, color: YotinTheme.ember),
            onPressed: _isTyping
                ? null
                : () => _sendMessage(_inputController.text),
          ),
        ],
      ),
    );
  }

  Widget _buildDisclosure() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
      color: YotinTheme.deepBg,
      child: Text(
        'ChatFi is an AI assistant. Confirm decisions that matter directly with Yotin.',
        style: YotinTheme.fontBody.copyWith(
          color: YotinTheme.textMuted,
          fontSize: 10,
          height: 1.35,
        ),
      ),
    );
  }

  Widget _buildBubble(ChatMessage message) {
    if (message.text.isEmpty && !message.isUser) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final align = message.isUser
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start;
        final background = message.isUser ? YotinTheme.ember : YotinTheme.deep2;
        final textColor = message.isUser
            ? YotinTheme.voidBg
            : YotinTheme.textWhite;
        final maxWidth = math.min(310.0, constraints.maxWidth * 0.88);

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: align,
            children: [
              Semantics(
                container: true,
                liveRegion: !message.isUser && !_isTyping,
                label: message.isUser
                    ? 'You: ${message.text}'
                    : 'ChatFi: ${message.text}',
                child: ExcludeSemantics(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxWidth),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: background,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(12),
                          topRight: const Radius.circular(12),
                          bottomLeft: Radius.circular(message.isUser ? 12 : 2),
                          bottomRight: Radius.circular(message.isUser ? 2 : 12),
                        ),
                        border: message.isUser
                            ? null
                            : Border.all(color: YotinTheme.sandLine),
                      ),
                      child: Text(
                        message.text,
                        style: YotinTheme.fontBody.copyWith(
                          color: textColor,
                          fontSize: 13,
                          fontWeight: message.isUser
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
