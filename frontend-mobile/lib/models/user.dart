/// Model pengguna. Disesuaikan dengan field form registrasi di mockup M1.
class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String address;
  final String? avatarUrl;
  final int pointBalance;
  final String greenLevel; // contoh: "Level 4: Green Hero"
  final String role;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone = '',
    this.address = '',
    this.avatarUrl,
    this.pointBalance = 0,
    this.greenLevel = '',
    this.role = 'user',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id']?.toString() ?? '',
        fullName: json['full_name'] ?? json['fullName'] ?? '',
        email: json['email'] ?? '',
        phone: json['phone'] ?? '',
        address: json['address'] ?? '',
        avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
        pointBalance: json['point_balance'] ?? json['pointBalance'] ?? 0,
        greenLevel: json['green_level'] ?? json['greenLevel'] ?? '',
        role: json['role'] ?? 'user',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'full_name': fullName,
        'email': email,
        'phone': phone,
        'address': address,
        'avatar_url': avatarUrl,
        'point_balance': pointBalance,
        'green_level': greenLevel,
        'role': role,
      };
}
