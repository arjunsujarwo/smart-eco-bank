/// Notifikasi untuk layar Notifikasi (M8).
class AppNotification {
  final String id;
  final String iconKey;
  final String title;
  final String body;
  final String timeAgo; // "2mnt", "1j lalu"
  final String group; // "Terbaru" / "Kemarin"
  final bool read;

  const AppNotification({
    required this.id,
    required this.iconKey,
    required this.title,
    required this.body,
    required this.timeAgo,
    required this.group,
    this.read = false,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id']?.toString() ?? '',
        iconKey: json['icon'] ?? 'eco',
        title: json['title'] ?? '',
        body: json['body'] ?? '',
        timeAgo: json['time_ago'] ?? '',
        group: json['group'] ?? 'Terbaru',
        read: json['read'] ?? false,
      );
}
