// ============================================================================
// Tipe data domain (sesuai field yang muncul di mockup W1-W10).
// Setiap tipe punya bentuk yang sama dengan response API yang diharapkan,
// sehingga saat backend siap, JSON tinggal di-cast ke tipe ini.
// ============================================================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string | null;
  pointBalance: number;
  greenLevel: string;
  totalGramSaved: number;
  role: string; // "admin" | "user"
  hasPin?: boolean;
  isCanceled?: boolean;
}

export type TxStatus = "success" | "pending" | "failed" | "process" | "completed" | "rejected" | "dikemas" | "pengiriman" | "selesai";
export type TxType = "deposit" | "redeem";
export type ShippingStatus = "diproses" | "dikirim" | "sampai";

export interface Transaction {
  id: string;
  date: string;
  timeLabel: string;
  category: string;
  iconKey: string;
  weightGram: number | null;
  points: number | null;
  status: TxStatus;
  type: TxType;
  // setoran-only
  locationName?: string;
  photoPath?: string;
  rejectionReason?: string | null;
  aiResult?: {
    confidenceScore: number;
    detectedCategory: string;
    result: string;
    message: string;
  };
  qrCode?: string | null;
  // tukar-only
  rewardName?: string;
  productImage?: string;
  qty?: number;
  pointPerItem?: number;
  totalPoints?: number;
  shippingStatus?: ShippingStatus;
  pickupCode?: string;
  pickupLocationName?: string;
}

export interface RewardLocationStock {
  locationId: number;
  locationName: string;
  address: string;
  stock: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  category: string;
  stock: number;
  stockMax: number;
  badge: string | null;
  image?: string | null;
  locationStocks: RewardLocationStock[];
}

export interface DropLocation {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  isOpen: boolean;
  isFull: boolean;
  openInfo: string;
  visitorsToday: number;
  lat: number;
  lng: number;
}

export interface ScanResult {
  depositorName: string;
  locationName: string;
  productName: string;
  category: string;
  tags: string[];
  confidence: number;
  estimatedWeight?: number;
  estimatedPoint?: number;
  imagePath?: string;
  categoryId?: number | string;
  locationId?: number | string;
  message?: string;
}

export interface DashboardData {
  recentTransactions: Transaction[];
  popularRewards: Reward[];
  totalWaste: number;
}

export type ChatSender = "bot" | "agent" | "user";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  senderName: string;
  text: string;
  timeLabel: string;
}

export interface AppNotification {
  id: string;
  iconKey: string;
  title: string;
  body: string;
  timeAgo: string;
  group: "Terbaru" | "Kemarin" | "Lebih Lama";
  read: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
