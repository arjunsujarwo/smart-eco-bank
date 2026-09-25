class AdminVerification {
  const AdminVerification({
    required this.id,
    required this.userName,
    required this.category,
    required this.categoryId,
    required this.weightGram,
    required this.status,
  });

  final String id;
  final String userName;
  final String category;
  final int categoryId;
  final int weightGram;
  final String status;

  factory AdminVerification.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final category = json['category'];
    return AdminVerification(
      id: json['id'].toString(),
      userName: user is Map<String, dynamic>
          ? (user['full_name'] ?? 'Pengguna').toString()
          : 'Pengguna',
      category: category is Map<String, dynamic>
          ? (category['category_name'] ?? 'Sampah').toString()
          : 'Sampah',
      categoryId: category is Map<String, dynamic>
          ? (category['id'] as num?)?.toInt() ?? 1
          : 1,
      weightGram: (json['weight_gram'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'pending',
    );
  }
}

class AdminUser {
  const AdminUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.suspended,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final bool suspended;

  factory AdminUser.fromJson(Map<String, dynamic> json) => AdminUser(
        id: json['id'].toString(),
        name: (json['full_name'] ?? 'Pengguna').toString(),
        email: (json['email'] ?? '').toString(),
        role: (json['role'] ?? 'user').toString(),
        suspended: json['is_suspended'] == true,
      );
}

class AdminReward {
  const AdminReward({
    required this.id,
    required this.name,
    required this.points,
    required this.active,
  });

  final String id;
  final String name;
  final int points;
  final bool active;

  factory AdminReward.fromJson(Map<String, dynamic> json) => AdminReward(
        id: json['id'].toString(),
        name: (json['product_name'] ?? 'Reward').toString(),
        points: (json['required_points'] as num?)?.toInt() ?? 0,
        active: json['is_active'] != false && json['is_active'] != 0,
      );
}
