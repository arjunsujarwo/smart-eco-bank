export type VerificationStatus = "pending" | "approved" | "completed" | "rejected";

export interface AdminVerification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  categoryId: number;
  categoryName: string;
  locationName: string;
  locationAddress: string;
  photoPath: string | null;
  weightGram: number;
  earnedPoints: number;
  aiCategory: string;
  aiMessage: string;
  status: VerificationStatus;
  submittedAt: string;
  confidence: number;
  rejectionReason?: string | null;
}

export interface AdminCategory {
  id: number;
  name: string;
}

export interface ProductLocationStock {
  id: number;
  productId: string;
  locationId: number;
  stock: number;
  location: {
    id: number;
    locationName: string;
    address: string;
  };
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  pointCost: number;
  imageUrl?: string | null;
  locationStocks: ProductLocationStock[];
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  color: "primary" | "secondary" | "tertiary";
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  photoUrl?: string | null;
  hasPin?: boolean;
  activityLogs?: ActivityLog[] | null;
}

export interface AdminChatSession {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type RewardOrderStatus = "menunggu" | "dikemas" | "pengiriman" | "selesai";

export interface AdminRewardOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  rewardName: string;
  qty: number;
  pointPerItem: number;
  totalPoints: number;
  status: RewardOrderStatus;
  createdAt: string;
  pickupCode?: string;
  pickupLocationName?: string;
  pickupLocationId?: number;
}

export interface AdminLocation {
  id: number;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  currentCapacity?: number;
  maxCapacity?: number;
  status?: string;
  createdAt?: string;
}
