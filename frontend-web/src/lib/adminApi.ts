import { BASE_URL, setAuthToken, setAuthRole, authHeaders, logout as adminLogout } from "./api";
export { adminLogout };

const API_URL = `${BASE_URL}/api`;
import type {
  AdminVerification,
  AdminCategory,
  AdminProduct,
  AdminProfile,
  AdminUser,
  AdminChatSession,
  AdminRewardOrder,
  RewardOrderStatus,
  ActivityLog,
  AdminLocation,
  ProductLocationStock,
} from "./adminTypes";
import type { ChatMessage } from "./types";

export const LOW_STOCK_THRESHOLD = 15;

export function isLowStock(p: AdminProduct): boolean {
  return p.stock <= LOW_STOCK_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Auth (same /login endpoint as user)
// ---------------------------------------------------------------------------

export async function adminLogin(
  email: string,
  password: string,
): Promise<boolean> {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    });
    if (!res.ok) return false;
    const data = await res.json();
    const token = (data.token ?? data.data?.token) as string;
    setAuthToken(token);
    setAuthRole("admin");
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapVerification(v: Record<string, unknown>): AdminVerification {
  const user     = v.user      as Record<string, unknown> | undefined;
  const category = v.category  as Record<string, unknown> | undefined;
  const location = v.location  as Record<string, unknown> | undefined;
  const aiResult = v.ai_result as Record<string, unknown> | undefined;

  return {
    id:              String(v.id ?? ""),
    userId:          String(v.user_id ?? user?.id ?? ""),
    userName:        String(user?.full_name ?? user?.name ?? ""),
    userEmail:       String(user?.email ?? ""),
    userPhone:       String(user?.phone ?? ""),
    categoryId:      Number(v.category_id ?? category?.id ?? 0),
    categoryName:    String(category?.category_name ?? v.category ?? ""),
    locationName:    String(location?.location_name ?? location?.nama_pengepul ?? ""),
    locationAddress: String(location?.address ?? location?.alamat ?? ""),
    photoPath:       v.photo_path ? String(v.photo_path) : null,
    weightGram:      Number(v.weight_gram ?? 0),
    earnedPoints:    Number(v.earned_points ?? 0),
    aiCategory:      String(aiResult?.detected_category ?? category?.category_name ?? ""),
    aiMessage:       String(aiResult?.message ?? ""),
    status:          (v.status ?? "pending") as AdminVerification["status"],
    submittedAt:     String(v.created_at ?? v.submitted_at ?? ""),
    confidence:      Number(aiResult?.confidence_score ?? v.confidence ?? 0),
    rejectionReason: v.rejection_reason ? String(v.rejection_reason) : null,
  };
}

// ---------------------------------------------------------------------------
// Verification queue
// ---------------------------------------------------------------------------

export async function getAdminVerifications(): Promise<{
  items: AdminVerification[];
  categories: AdminCategory[];
}> {
  const res = await fetch(`${API_URL}/admin/verification`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal memuat antrian verifikasi");
  const data = await res.json();
  const payload = (data.data ?? data) as Record<string, unknown>;

  const txList: Record<string, unknown>[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.transactions)
      ? (payload.transactions as Record<string, unknown>[])
      : [];

  const catList: Record<string, unknown>[] = Array.isArray(payload.categories)
    ? (payload.categories as Record<string, unknown>[])
    : [];

  return {
    items: txList.map(mapVerification),
    categories: catList.map((c) => ({
      id: Number(c.id),
      name: String(c.category_name ?? c.name ?? ""),
    })),
  };
}

export interface ApproveResult {
  token: string;
  points: number;
  transactionId: number;
}

export async function approveVerification(
  id: string,
  payload: { productName: string; categoryId: number | string; weightGram: number },
): Promise<ApproveResult> {
  const res = await fetch(`${API_URL}/admin/verification/${id}/approve`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      product_name: payload.productName,
      category_id: Number(payload.categoryId),
      weight_gram: payload.weightGram,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menyetujui verifikasi");
  }
  const data = await res.json();
  const d = (data.data ?? data) as Record<string, unknown>;
  return {
    token: String(d.token ?? ""),
    points: Number(d.points ?? 0),
    transactionId: Number(d.transaction_id ?? d.transactionId ?? 0),
  };
}

export async function rejectVerification(
  id: string,
  reason: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/verification/${id}/reject`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ rejection_reason: reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menolak verifikasi");
  }
}

// ---------------------------------------------------------------------------
// Dashboard, Users, Reports
// ---------------------------------------------------------------------------

export async function getAdminDashboard(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal memuat dashboard admin");
  return res.json();
}

export async function deleteAdminPhoto(): Promise<void> {
  const res = await fetch(`${API_URL}/profile/photo`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal menghapus foto profil");
}

export async function createAdminUser(payload: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: "admin" | "user";
}): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      password: payload.password,
      role: payload.role,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal membuat user");
  }
  const data = await res.json();
  const u = (data.data ?? data) as Record<string, unknown>;
  return {
    id: String(u.id ?? ""),
    fullName: String(u.full_name ?? u.name ?? ""),
    email: String(u.email ?? ""),
    phone: String(u.phone ?? ""),
    address: String(u.address ?? ""),
    points: Number(u.points ?? 0),
    role: ((u.role as string) === "admin" ? "admin" : "user") as "admin" | "user",
    isActive: u.is_active !== false && u.is_active !== 0,
    createdAt: String(u.created_at ?? ""),
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_URL}/admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat daftar user");
  const data = await res.json();
  const payload = (data.data ?? data) as Record<string, unknown>;
  const list: Record<string, unknown>[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.users)
      ? (payload.users as Record<string, unknown>[])
      : [];
  return list.map((u) => ({
    id: String(u.id ?? ""),
    fullName: String(u.full_name ?? u.name ?? ""),
    email: String(u.email ?? ""),
    phone: String(u.phone ?? ""),
    address: String(u.address ?? ""),
    points: Number(u.points ?? u.total_points ?? 0),
    role: ((u.role as string) === "admin" ? "admin" : "user") as "admin" | "user",
    isActive: !u.is_suspended && u.is_active !== false && u.is_active !== 0,
    createdAt: String(u.created_at ?? ""),
  }));
}

export async function updateAdminUser(
  id: string,
  payload: { fullName: string; phone: string; address: string },
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${id}/update`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: payload.fullName,
      phone: payload.phone,
      address: payload.address,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui user");
  }
}

export async function suspendAdminUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${id}/suspend`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui status user");
  }
}

export async function adjustUserPoints(
  userId: string,
  points: number,
  action: "add" | "subtract",
  description: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/points/adjust`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, points, action, description }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menyesuaikan poin");
  }
}

export async function getAdminReports(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/admin/reports`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

// ---------------------------------------------------------------------------
// Admin QR scan (direct deposit)
// ---------------------------------------------------------------------------

export async function adminScanQr(payload: {
  uniqueCode: string;
  weightGram: number;
  locationId: number | string;
  categoryId: number | string;
}): Promise<void> {
  const form = new FormData();
  form.append("unique_code", payload.uniqueCode);
  form.append("weight_gram", String(payload.weightGram));
  form.append("location_id", String(payload.locationId));
  form.append("category_id", String(payload.categoryId));
  const res = await fetch(`${API_URL}/admin/scan-qr`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error("Admin scan QR gagal");
}

// ---------------------------------------------------------------------------
// Profile (reuses /user endpoint)
// ---------------------------------------------------------------------------

export async function getAdminProfile(): Promise<AdminProfile> {
  const res = await fetch(`${API_URL}/user`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat profil admin");
  const raw = await res.json();
  const d = (raw.data as Record<string, unknown>) ?? raw;
  return {
    name: (d.full_name ?? d.name ?? d.fullName ?? "") as string,
    email: (d.email ?? "") as string,
    phone: (d.phone ?? "") as string,
    address: (d.address ?? "") as string,
    role: (d.role ?? "Administrator") as string,
    photoUrl: (d.photo_url ?? null) as string | null,
    hasPin: Boolean(d.has_pin),
    activityLogs: Array.isArray(d.activity_logs)
      ? (d.activity_logs as Record<string, unknown>[]).map((l) => {
          const TYPE_COLOR: Record<string, ActivityLog["color"]> = {
            auth: "primary", verification: "secondary", stock: "tertiary",
          };
          return {
            id: String(l.id ?? ""),
            action: String(l.title ?? l.action ?? ""),
            timestamp: String(l.time ?? l.timestamp ?? ""),
            color: TYPE_COLOR[String(l.type ?? "")] ?? "primary",
          };
        })
      : null,
  };
}

export async function updateAdminProfile(payload: { fullName?: string; phone?: string; address?: string; photo?: File | null }): Promise<void> {
  const form = new FormData();
  if (payload.fullName) form.append("full_name", payload.fullName);
  if (payload.phone) form.append("phone", payload.phone);
  if (payload.address) form.append("address", payload.address);
  if (payload.photo) form.append("photo", payload.photo);

  const res = await fetch(`${API_URL}/profile/update`, {
    method: "POST",
    headers: authHeaders(), // Form data should NOT have Content-Type: application/json
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui profil");
  }
}

export async function updateAdminPassword(payload: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }): Promise<void> {
  const res = await fetch(`${API_URL}/profile/password`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
      new_password_confirmation: payload.newPasswordConfirmation,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui password");
  }
}

export async function updateAdminPin(payload: { currentPin?: string; newPin: string; newPinConfirmation: string }): Promise<void> {
  const res = await fetch(`${API_URL}/profile/pin`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      current_pin: payload.currentPin,
      new_pin: payload.newPin,
      new_pin_confirmation: payload.newPinConfirmation,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal mengatur PIN");
  }
}

export async function verifyAdminPin(pin: string): Promise<void> {
  const res = await fetch(`${API_URL}/profile/verify-pin`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "PIN salah");
  }
}

// ---------------------------------------------------------------------------
// Products (stock management)
// ---------------------------------------------------------------------------

function mapProduct(p: Record<string, unknown>): AdminProduct {
  const rawStocks = Array.isArray(p.location_stocks)
    ? (p.location_stocks as Record<string, unknown>[])
    : [];
  const locationStocks: ProductLocationStock[] = rawStocks.map((ls) => {
    const loc = ls.location as Record<string, unknown> | undefined;
    return {
      id: Number(ls.id ?? 0),
      productId: String(p.id ?? ""),
      locationId: Number(ls.location_id ?? 0),
      stock: Number(ls.stock ?? 0),
      location: {
        id: Number(loc?.id ?? ls.location_id ?? 0),
        locationName: String(loc?.location_name ?? ""),
        address: String(loc?.address ?? ""),
      },
    };
  });
  return {
    id: String(p.id ?? ""),
    name: String(p.product_name ?? p.name ?? ""),
    category: String(p.category ?? ""),
    stock: Number(p.stock ?? 0),
    pointCost: Number(p.required_points ?? p.point_cost ?? 0),
    imageUrl: (p.image_url ?? p.imageUrl ?? null) as string | null,
    locationStocks,
  };
}

function mapLocation(loc: Record<string, unknown>): AdminLocation {
  return {
    id: Number(loc.id ?? 0),
    locationName: String(loc.location_name ?? ""),
    address: String(loc.address ?? ""),
    latitude: Number(loc.latitude ?? 0),
    longitude: Number(loc.longitude ?? 0),
    currentCapacity: Number(loc.current_capacity ?? 0),
    maxCapacity: Number(loc.max_capacity ?? 0),
    status: String(loc.status ?? ""),
    createdAt: String(loc.created_at ?? ""),
  };
}

export async function getAdminStockData(): Promise<{ products: AdminProduct[]; locations: AdminLocation[] }> {
  const res = await fetch(`${API_URL}/admin/stock`, { headers: authHeaders() });
  if (!res.ok) return { products: [], locations: [] };
  const data = await res.json();
  const payload = (data.data ?? data) as Record<string, unknown>;
  const productList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.products)
      ? (payload.products as Record<string, unknown>[])
      : [];
  const locationList = Array.isArray(payload.locations)
    ? (payload.locations as Record<string, unknown>[])
    : [];
  return {
    products: productList.map(mapProduct),
    locations: locationList.map(mapLocation),
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  return (await getAdminStockData()).products;
}

export async function updateProductLocationStock(
  productId: string,
  locationId: number,
  stock: number
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/stock/${productId}/update`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ location_id: locationId, stock }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui stok");
  }
}

export async function createProduct(payload: {
  name: string;
  category?: string;
  requiredPoints: number;
  image?: File | null;
}): Promise<AdminProduct> {
  const formData = new FormData();
  formData.append("product_name", payload.name);
  if (payload.category) formData.append("category", payload.category);
  formData.append("required_points", payload.requiredPoints.toString());
  if (payload.image) {
    formData.append("image", payload.image);
  }

  // Build headers excluding Content-Type (let browser set it with boundary)
  const headers: HeadersInit = authHeaders();
  if (headers && "Content-Type" in headers) {
    delete (headers as Record<string, string>)["Content-Type"];
  }

  const res = await fetch(`${API_URL}/admin/rewards`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menambah produk");
  }
  const data = await res.json();
  return mapProduct((data.data ?? data) as Record<string, unknown>);
}

export async function updateProduct(
  id: string,
  payload: { name: string; category?: string; pointCost: number; image?: File | null }
): Promise<void> {
  const formData = new FormData();
  formData.append("product_name", payload.name);
  if (payload.category !== undefined) formData.append("category", payload.category);
  formData.append("required_points", payload.pointCost.toString());
  if (payload.image) {
    formData.append("image", payload.image);
  }

  // Build headers excluding Content-Type
  const headers: HeadersInit = authHeaders();
  if (headers && "Content-Type" in headers) {
    delete (headers as Record<string, string>)["Content-Type"];
  }

  const res = await fetch(`${API_URL}/admin/rewards/${id}/update`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui produk");
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/rewards/${id}/delete`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menghapus produk");
  }
}

// ---------------------------------------------------------------------------
// Admin Chat
// ---------------------------------------------------------------------------

export async function getAdminChatSessions(): Promise<AdminChatSession[]> {
  const res = await fetch(`${API_URL}/admin/chats`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.data ?? []);
  return (list as Record<string, unknown>[]).map((s) => {
    const user = s.user as Record<string, unknown> | undefined;
    return {
      id: Number(s.id ?? 0),
      userId: String(s.user_id ?? user?.id ?? ""),
      userName: String(s.user_name ?? user?.full_name ?? user?.name ?? "User"),
      userEmail: String(s.user_email ?? user?.email ?? ""),
      lastMessage: String(s.last_message ?? ""),
      lastMessageAt: String(s.last_message_at ?? s.updated_at ?? ""),
      unreadCount: Number(s.unread_count ?? 0),
    };
  });
}

export async function getAdminChatMessages(chatId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${API_URL}/admin/chats/${chatId}`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const payload = data.data ?? data;
  const msgs: Record<string, unknown>[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.messages)
      ? payload.messages
      : [];
  return msgs.map((m) => {
    const sender = m.sender as Record<string, unknown> | undefined;
    const isAdmin = (sender?.role ?? m.from_admin) === "admin" || Boolean(m.from_admin);
    return {
      id: String(m.id ?? Math.random()),
      sender: isAdmin ? "agent" : "user",
      senderName: String(sender?.full_name ?? m.sender_name ?? (isAdmin ? "Admin" : "User")),
      text: String(m.message ?? m.text ?? ""),
      timeLabel: new Date(
        (m.created_at as string | undefined) ?? Date.now(),
      ).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    } satisfies ChatMessage;
  });
}

// ---------------------------------------------------------------------------
// Reward Orders
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, RewardOrderStatus> = {
  process:    "menunggu",
  pending:    "menunggu",
  menunggu:   "menunggu",
  dikemas:    "dikemas",
  pengiriman: "pengiriman",
  selesai:    "selesai",
};

export async function getAdminRewardOrders(): Promise<AdminRewardOrder[]> {
  const res = await fetch(`${API_URL}/admin/rewards`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const payload = (data.data ?? data) as Record<string, unknown>;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.orders)
      ? (payload.orders as Record<string, unknown>[])
      : [];
  return list.map((o) => {
    const user = o.user as Record<string, unknown> | undefined;
    const loc = o.pickup_location as Record<string, unknown> | undefined;
    return {
      id: String(o.id ?? ""),
      userId: String(o.user_id ?? user?.id ?? ""),
      userName: String(user?.full_name ?? user?.name ?? "User"),
      userPhone: String(user?.phone ?? "—"),
      rewardName: String(o.product_name ?? "—"),
      qty: Number(o.quantity ?? 1),
      pointPerItem: Number(o.point_per_item ?? 0),
      totalPoints: Number(o.total_points ?? 0),
      status: STATUS_MAP[String(o.status ?? "process")] ?? "menunggu",
      createdAt: String(o.created_at ?? ""),
      pickupCode: o.pickup_code ? String(o.pickup_code) : undefined,
      pickupLocationName: loc?.location_name ? String(loc.location_name) : undefined,
      pickupLocationId: loc?.id ? Number(loc.id) : undefined,
    };
  });
}

export async function updateRewardOrderStatus(
  id: string,
  status: "dikemas" | "pengiriman",
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/rewards/${id}/status/${status}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui status");
  }
}

export async function verifyRewardPickup(id: string, code: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/rewards/${id}/verify`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Verifikasi gagal");
  }
}

export async function sendAdminMessage(chatId: number, message: string): Promise<void> {
  const form = new FormData();
  form.append("message", message);
  const res = await fetch(`${API_URL}/admin/chats/${chatId}/send`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal mengirim pesan");
  }
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export async function getAdminLocations(): Promise<AdminLocation[]> {
  const res = await fetch(`${API_URL}/admin/locations`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil data lokasi");
  const data = await res.json();
  const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
  return list.map((loc: Record<string, unknown>) => ({
    id: Number(loc.id ?? 0),
    locationName: String(loc.location_name ?? ""),
    address: String(loc.address ?? ""),
    latitude: Number(loc.latitude ?? 0),
    longitude: Number(loc.longitude ?? 0),
    currentCapacity: Number(loc.current_capacity ?? 0),
    maxCapacity: Number(loc.max_capacity ?? 0),
    status: String(loc.status ?? ""),
    createdAt: String(loc.created_at ?? ""),
  }));
}

export async function createAdminLocation(payload: {
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
}): Promise<AdminLocation> {
  const form = new FormData();
  form.append("location_name", payload.locationName);
  form.append("address", payload.address);
  form.append("latitude", String(payload.latitude));
  form.append("longitude", String(payload.longitude));

  const res = await fetch(`${API_URL}/admin/locations`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menambahkan lokasi");
  }
  const data = await res.json();
  const loc = (data.data ?? data) as Record<string, unknown>;
  return {
    id: Number(loc.id ?? 0),
    locationName: String(loc.location_name ?? ""),
    address: String(loc.address ?? ""),
    latitude: Number(loc.latitude ?? 0),
    longitude: Number(loc.longitude ?? 0),
  };
}

export async function updateAdminLocation(
  id: number | string,
  payload: {
    locationName: string;
    address: string;
    latitude: number;
    longitude: number;
  }
): Promise<AdminLocation> {
  const form = new FormData();
  form.append("location_name", payload.locationName);
  form.append("address", payload.address);
  form.append("latitude", String(payload.latitude));
  form.append("longitude", String(payload.longitude));

  const res = await fetch(`${API_URL}/admin/locations/${id}/update`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui lokasi");
  }
  const data = await res.json();
  const loc = (data.data ?? data) as Record<string, unknown>;
  return {
    id: Number(loc.id ?? 0),
    locationName: String(loc.location_name ?? ""),
    address: String(loc.address ?? ""),
    latitude: Number(loc.latitude ?? 0),
    longitude: Number(loc.longitude ?? 0),
  };
}

export async function deleteAdminLocation(id: number | string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/locations/${id}/delete`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menghapus lokasi");
  }
}

