enum ChatSender { user, bot, agent }

/// Pesan chat untuk layar Customer Service (M9).
class ChatMessage {
  final String id;
  final ChatSender sender;
  final String text;
  final String time;
  final String? agentName;
  final String? agentAvatar;

  const ChatMessage({
    required this.id,
    required this.sender,
    required this.text,
    required this.time,
    this.agentName,
    this.agentAvatar,
  });
}
