import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../models/chat_message.dart';
import '../../services/api_service.dart';

/// M9 - Customer Service. Chat dengan bot/agen + indikator mengetik.
class CustomerServiceScreen extends StatefulWidget {
  const CustomerServiceScreen({super.key});

  @override
  State<CustomerServiceScreen> createState() => _CustomerServiceScreenState();
}

class _CustomerServiceScreenState extends State<CustomerServiceScreen> {
  final _api = ApiService.instance;
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _agentTyping = false;

  final List<ChatMessage> _messages = [
    const ChatMessage(
      id: 'm1',
      sender: ChatSender.bot,
      text:
          "Hello! I'm Smart Eco Bot. How can I help you with your sustainable banking today?",
      time: '09:41',
    ),
    const ChatMessage(
      id: 'm2',
      sender: ChatSender.agent,
      agentName: 'Sarah',
      text:
          "Hi there! This is Sarah from CS Eco. I see you're inquiring about your recent carbon offset rewards. I'd be happy to guide you through that.",
      time: '09:42',
    ),
  ];

  final _suggestions = const [
    'Check rewards status',
    'Transaction issue',
    'Offset calculator',
  ];

  Future<void> _send(String text) async {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(
        id: DateTime.now().toIso8601String(),
        sender: ChatSender.user,
        text: text.trim(),
        time: TimeOfDayString.now(),
      ));
      _input.clear();
      _agentTyping = true;
    });
    _scrollDown();

    final reply = await _api.sendSupportMessage(text);
    if (!mounted) return;
    setState(() {
      _agentTyping = false;
      _messages.add(ChatMessage(
        id: DateTime.now().toIso8601String(),
        sender: ChatSender.agent,
        agentName: 'Sarah',
        text: reply,
        time: TimeOfDayString.now(),
      ));
    });
    _scrollDown();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
            onPressed: () => Navigator.of(context).maybePop()),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Customer Service',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.onSurface)),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                      color: AppColors.primaryContainer,
                      shape: BoxShape.circle),
                ),
                const SizedBox(width: 6),
                Text('CS Eco is Online',
                    style: TextStyle(
                        fontSize: 12, color: AppColors.onSurfaceVariant)),
              ],
            ),
          ],
        ),
        actions: const [
          Icon(Icons.call, color: AppColors.onSurface),
          SizedBox(width: 16),
          Icon(Icons.more_vert, color: AppColors.onSurface),
          SizedBox(width: 8),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.surfaceVariant),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              children: [
                Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text('Today',
                        style: TextStyle(
                            fontSize: 12, color: AppColors.onSurfaceVariant)),
                  ),
                ),
                const SizedBox(height: 16),
                ..._messages.map(_bubble),
                if (_agentTyping) _typingIndicator(),
              ],
            ),
          ),
          _inputBar(),
        ],
      ),
    );
  }

  Widget _bubble(ChatMessage m) {
    final isUser = m.sender == ChatSender.user;
    final avatarColor = m.sender == ChatSender.bot
        ? AppColors.primaryContainer
        : AppColors.surfaceContainerHighest;

    final bubble = Container(
      constraints:
          BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isUser ? AppColors.primary : AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(14),
          topRight: const Radius.circular(14),
          bottomLeft: Radius.circular(isUser ? 14 : 4),
          bottomRight: Radius.circular(isUser ? 4 : 14),
        ),
      ),
      child: Text(m.text,
          style: TextStyle(
              color: isUser ? Colors.white : AppColors.onSurface,
              height: 1.35)),
    );

    final time = Padding(
      padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
      child: Text(m.time,
          style:
              const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant)),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 20,
              backgroundColor: avatarColor,
              child: Icon(m.sender == ChatSender.bot ? Icons.eco : Icons.person,
                  color: m.sender == ChatSender.bot
                      ? AppColors.onPrimaryContainer
                      : AppColors.onSurfaceVariant),
            ),
            const SizedBox(width: 12),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [bubble, time],
            ),
          ),
        ],
      ),
    );
  }

  Widget _typingIndicator() => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            const CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.surfaceContainerHighest,
                child: Icon(Icons.person, color: AppColors.onSurfaceVariant)),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(
                    3,
                    (i) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                              color: AppColors.outline, shape: BoxShape.circle),
                        )),
              ),
            ),
          ],
        ),
      );

  Widget _inputBar() => Container(
        padding: EdgeInsets.fromLTRB(
            12, 8, 12, MediaQuery.of(context).padding.bottom + 8),
        decoration: const BoxDecoration(
          color: AppColors.surfaceContainer,
          border: Border(top: BorderSide(color: AppColors.outlineVariant)),
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                IconButton(
                    icon: const Icon(Icons.add_circle_outline,
                        color: AppColors.onSurfaceVariant),
                    onPressed: () {}),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.outlineVariant),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Type your message...',
                        border: InputBorder.none,
                        filled: false,
                      ),
                      onSubmitted: _send,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _send(_input.text),
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.send, color: Colors.white),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: _suggestions
                    .map((s) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ActionChip(
                            label: Text(s,
                                style:
                                    const TextStyle(color: AppColors.primary)),
                            backgroundColor: AppColors.surfaceContainerLowest,
                            side: const BorderSide(
                                color: AppColors.outlineVariant),
                            onPressed: () => _send(s),
                          ),
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      );
}
