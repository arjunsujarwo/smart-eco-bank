import type {
  AuthResponse,
  DashboardData,
  DropLocation,
  Reward,
  RewardLocationStock,
  Transaction,
  ScanResult,
  ChatMessage,
  AppNotification,
  User,
} from "./types";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const API_URL = `${BASE_URL}/api`;

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

if (typeof window !== "undefined") {
  authToken = localStorage.getItem("eco_token");
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("eco_token", token);
      document.cookie = `eco_token=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
    } else {
      localStorage.removeItem("eco_token");
      document.cookie = "eco_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie = "eco_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
  }
}

export function setAuthRole(role: string) {
  if (typeof window !== "undefined") {
    document.cookie = `eco_role=${role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
  }
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function getStoredToken(): string | null {
  return authToken;
}

export function authHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Mappers (snake_case → camelCase)
// ---------------------------------------------------------------------------

function mapUser(u: Record<string, unknown>): User {
  return {
    id: String(u.id ?? ""),
    fullName: (u.full_name ?? u.fullName ?? "") as string,
    email: (u.email ?? "") as string,
    phone: (u.phone ?? "") as string,
    address: (u.address ?? "") as string,
    avatarUrl: (u.photo_url ?? u.avatar_url ?? u.avatarUrl ?? null) as string | null,
    pointBalance: Number(u.total_points ?? u.point_balance ?? u.pointBalance ?? 0),
    greenLevel: (u.green_level ?? u.greenLevel ?? "") as string,
    totalGramSaved: Number(u.total_gram_saved ?? u.totalGramSaved ?? 0),
    role: (u.role ?? "user") as string,
    hasPin: Boolean(u.has_pin),
    isCanceled: Boolean(u.is_suspended ?? u.is_canceled),
  };
}

function unwrap(data: Record<string, unknown>): Record<string, unknown> {
  return (data.data as Record<string, unknown>) ?? data;
}

async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, { cache: "no-store", ...init });
  if (res.status === 401) {
    setAuthToken(null);
    onUnauthorized?.();
    throw new Error("Sesi berakhir, silakan login kembali");
  }
  return res;
}

function parseDateLabel(iso: string): { date: string; timeLabel: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      timeLabel: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    };
  } catch {
    return { date: iso?.slice(0, 10) ?? "", timeLabel: "" };
  }
}

function mapTransaction(t: Record<string, unknown>): Transaction {
  const rawType = (t.type as string) ?? "";
  const type: Transaction["type"] =
    rawType === "setoran" || rawType === "deposit" ? "deposit" : "redeem";

  const isoDate = (t.date ?? t.created_at ?? "") as string;
  const { date, timeLabel } = parseDateLabel(isoDate);

  const points =
    type === "deposit"
      ? t.earned_points !== undefined && t.earned_points !== null
        ? Number(t.earned_points)
        : null
      : t.total_points !== undefined && t.total_points !== null
        ? Number(t.total_points)
        : null;

  const category =
    type === "deposit"
      ? ((t.category_name ?? t.category ?? "") as string)
      : ((t.product_name ?? t.rewardName ?? t.reward_name ?? "") as string);

  const aiRaw = t.ai_result as Record<string, unknown> | undefined;

  return {
    id: String(t.id ?? ""),
    date,
    timeLabel: (t.time_label ?? t.timeLabel ?? timeLabel) as string,
    category,
    iconKey: type === "deposit" ? "recycling" : "redeem",
    weightGram:
      t.weight_gram !== undefined && t.weight_gram !== null
        ? Number(t.weight_gram)
        : t.weight_kg !== undefined && t.weight_kg !== null
          ? Number(t.weight_kg) * 1000
          : null,
    points,
    status: (t.status ?? "pending") as Transaction["status"],
    type,
    // setoran fields
    locationName: (t.location_name ?? t.locationName) as string | undefined,
    photoPath: (t.photo_path ?? t.photoPath) as string | undefined,
    rejectionReason: (t.rejection_reason ?? t.rejectionReason ?? null) as string | null | undefined,
    aiResult: aiRaw
      ? {
          confidenceScore: Number(aiRaw.confidence_score ?? aiRaw.confidenceScore ?? 0),
          detectedCategory: (aiRaw.detected_category ?? aiRaw.detectedCategory ?? "") as string,
          result: (aiRaw.result ?? "") as string,
          message: (aiRaw.message ?? "") as string,
        }
      : undefined,
    qrCode: (t.qr_code ?? t.qrCode ?? null) as string | null | undefined,
    // tukar fields
    rewardName: type === "redeem" ? category : undefined,
    productImage: (t.product_image ?? t.productImage) as string | undefined,
    qty: t.quantity !== undefined ? Number(t.quantity) : t.qty !== undefined ? Number(t.qty) : undefined,
    pointPerItem: t.point_per_item !== undefined ? Number(t.point_per_item) : undefined,
    totalPoints: t.total_points !== undefined ? Number(t.total_points) : undefined,
    pickupCode: type === "redeem" ? (t.pickup_code as string | undefined) ?? undefined : undefined,
    pickupLocationName: type === "redeem" ? (t.pickup_location_name as string | undefined) ?? undefined : undefined,
    shippingStatus: type === "redeem"
      ? ((): Transaction["shippingStatus"] => {
          const raw = (t.shipping_status ?? t.shippingStatus) as string | undefined;
          if (raw) return raw as Transaction["shippingStatus"];
          const s = String(t.status ?? "");
          if (s === "pengiriman") return "dikirim";
          if (s === "selesai") return "sampai";
          return "diproses"; // menunggu / dikemas / process
        })()
      : undefined,
  };
}

function mapReward(r: Record<string, unknown>): Reward {
  const rawStocks = Array.isArray(r.location_stocks) ? (r.location_stocks as Record<string, unknown>[]) : [];
  const locationStocks: RewardLocationStock[] = rawStocks.map((ls) => {
    const loc = ls.location as Record<string, unknown> | undefined;
    return {
      locationId: Number(ls.location_id ?? 0),
      locationName: String(loc?.location_name ?? ""),
      address: String(loc?.address ?? ""),
      stock: Number(ls.stock ?? 0),
    };
  });
  return {
    id: String(r.id ?? ""),
    name: (r.product_name ?? r.name ?? "") as string,
    description: (r.description ?? "") as string,
    pointCost: Number(r.required_points ?? r.point_cost ?? r.pointCost ?? 0),
    category: (r.category ?? "") as string,
    stock: Number(r.stock ?? 0),
    stockMax: Number(r.stock_max ?? r.stockMax ?? r.stock ?? 0),
    badge: (r.badge ?? null) as string | null,
    image: (r.image_url ?? r.imageUrl ?? r.image ?? r.product_image ?? null) as string | null,
    locationStocks,
  };
}

function mapLocation(l: Record<string, unknown>): DropLocation {
  const status = (l.status as string) ?? "";
  const isFull = Boolean(l.is_full ?? false);
  const isActive = status === "Tersedia" || status === "Aktif";
  return {
    id: String(l.id ?? ""),
    name: (l.location_name ?? l.name ?? `Lokasi #${l.id}`) as string,
    address: (l.alamat ?? l.address ?? "") as string,
    distanceKm: Number(l.distance_km ?? l.distanceKm ?? 0),
    isOpen: isActive && !isFull,
    isFull,
    openInfo: isFull
      ? "Lokasi penuh"
      : isActive
        ? "Tersedia"
        : status || "Tidak aktif",
    visitorsToday: Number(l.visitors_today ?? l.visitorsToday ?? 0),
    lat: Number(l.lat ?? l.latitude ?? 0),
    lng: Number(l.long ?? l.longitude ?? l.lng ?? 0),
  };
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Login gagal");
  }
  const raw = await res.json();
  const data = unwrap(raw);
  const token = (data.token ?? raw.token) as string;
  const userRaw = (data.user ?? raw.user ?? data) as Record<string, unknown>;
  setAuthToken(token);
  setAuthRole((userRaw.role ?? "user") as string);
  return { token, user: mapUser(userRaw) };
}

export async function register(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
}): Promise<AuthResponse> {
  const form = new FormData();
  form.append("full_name", payload.fullName);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  form.append("address", payload.address);
  form.append("password", payload.password);
  form.append("password_confirmation", payload.password);
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Registrasi gagal",
    );
  }
  const raw = await res.json();
  const data = unwrap(raw);
  const token = (data.token ?? raw.token) as string;
  const userRaw = (data.user ?? raw.user ?? data) as Record<string, unknown>;
  setAuthToken(token);
  setAuthRole("user");
  return { token, user: mapUser(userRaw) };
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: authHeaders(),
  }).catch(() => {});
  setAuthToken(null);
}

export async function getUser(): Promise<User> {
  const res = await apiFetch(`${API_URL}/user`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat profil");
  const raw = await res.json();
  return mapUser(unwrap(raw));
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

export async function getDashboard(): Promise<DashboardData> {
  const res = await apiFetch(`${API_URL}/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal memuat dashboard");
  const raw = await res.json();
  const data = unwrap(raw) as Record<string, unknown>;
  return {
    recentTransactions: (
      (data.last_activity ?? data.recent_transactions ?? data.recentTransactions ?? []) as Record<string, unknown>[]
    ).map(mapTransaction),
    popularRewards: (
      (data.popularRewards ?? data.popular_rewards ?? []) as Record<string, unknown>[]
    ).map(mapReward),
    totalWaste: Number(data.totalWaste ?? data.total_waste ?? 0),
  };
}

// ---------------------------------------------------------------------------
// LOCATIONS
// ---------------------------------------------------------------------------

export interface LocationsResult {
  near: DropLocation[];
  all: DropLocation[];
  selectedLocation?: { id: number | string; locationName: string } | null;
}

export async function getLocations(
  query = "",
  userLat?: number,
  userLong?: number,
): Promise<LocationsResult> {
  const params = new URLSearchParams();

  if (userLat !== undefined && userLong !== undefined) {
    params.set("lat", String(userLat));
    params.set("long", String(userLong));
  } else if (typeof window !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 60000,
        }),
      );
      params.set("lat", String(pos.coords.latitude));
      params.set("long", String(pos.coords.longitude));
    } catch {
      params.set("lat", "-7.250445");
      params.set("long", "112.768845");
    }
  } else {
    params.set("lat", "-7.250445");
    params.set("long", "112.768845");
  }

  const res = await apiFetch(`${API_URL}/locations?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal memuat lokasi");
  const raw = await res.json();
  const data = unwrap(raw) as Record<string, unknown>;

  let near: DropLocation[] = (
    (data.near_location ?? []) as Record<string, unknown>[]
  ).map(mapLocation);
  const all: DropLocation[] = (
    (data.all_location ?? []) as Record<string, unknown>[]
  ).map(mapLocation);

  if (query) {
    const q = query.toLowerCase();
    near = near.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q),
    );
  }

  const selectedLocationRaw = data.selected_location as Record<string, unknown> | null;
  const selectedLocation = selectedLocationRaw ? {
    id: (selectedLocationRaw.id ?? "") as number | string,
    locationName: (selectedLocationRaw.location_name ?? "") as string
  } : null;

  return { near, all, selectedLocation };
}

export async function updateSelectedLocation(locationId: number | string): Promise<void> {
  const form = new FormData();
  form.append("location_id", String(locationId));
  const res = await apiFetch(`${API_URL}/locations/select`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui lokasi pilihan");
  }
}

// ---------------------------------------------------------------------------
// AI SCANNER
// ---------------------------------------------------------------------------

export async function analyzeWaste(image?: File): Promise<ScanResult> {
  const form = new FormData();
  if (image) form.append("waste_image", image);
  const res = await apiFetch(`${API_URL}/ai-scan`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Analisis AI gagal",
    );
  }
  const raw = await res.json();
  const data = unwrap(raw) as Record<string, unknown>;
  const mappedCat = data.mapped_category as Record<string, unknown> | undefined;
  const categoryName = (data.category_name ?? data.category ?? "") as string;
  const resultLabel = (data.result ?? "") as string;
  const tags = [categoryName, resultLabel].filter(Boolean) as string[];
  return {
    depositorName: "",
    locationName: "",
    productName: (data.product_name ?? data.productName ?? "") as string,
    category: categoryName,
    tags,
    confidence: Number(data.confidence ?? 0),
    estimatedWeight: Number(data.estimated_weight ?? 0),
    estimatedPoint: Number(data.estimated_point ?? 0),
    imagePath: (data.image_path ?? "") as string,
    categoryId: (mappedCat?.id ?? data.category_id ?? data.categoryId) as string | number | undefined,
    locationId: (data.location_id ?? data.locationId) as string | number | undefined,
    message: (data.message ?? "") as string,
  };
}

export function estimatePoints(grams: number): number {
  return Math.round(grams * 0.002 * 10) / 10;
}

export async function submitDeposit(payload: {
  productName: string;
  category: string;
  weightGrams: number;
  locationId: number | string;
  categoryId?: number | string;
  confidence?: number;
  message?: string;
  imagePath?: string;
}): Promise<Transaction> {
  const form = new FormData();
  form.append("product_name", payload.productName);
  form.append("category_name", payload.category);
  form.append("weight_gram", String(payload.weightGrams));
  form.append("location_id", String(payload.locationId));
  form.append("category_id", String(payload.categoryId ?? ""));
  form.append("confidence", String(payload.confidence ?? 0));
  form.append("message", payload.message ?? "");
  if (payload.imagePath) form.append("image_path", payload.imagePath);

  const res = await apiFetch(`${API_URL}/ai-scan/submit`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Pengiriman setoran gagal",
    );
  }
  const data = await res.json();
  return mapTransaction(data.transaction ?? data);
}

// ---------------------------------------------------------------------------
// TRANSACTIONS (History)
// ---------------------------------------------------------------------------

export interface TransactionsResult {
  transactions: Transaction[];
  totalPoint: number;
}

export async function getTransactions(
  filter: "all" | "deposit" | "redeem" = "all",
): Promise<TransactionsResult> {
  const res = await apiFetch(`${API_URL}/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat riwayat");
  const raw = await res.json();
  const payload = unwrap(raw) as Record<string, unknown>;

  const totalPoint = Number(payload.totalPoint ?? payload.total_point ?? 0);

  let all: Transaction[];
  if (payload.setoran !== undefined || payload.tukar !== undefined) {
    const deposits = ((payload.setoran ?? []) as Record<string, unknown>[]).map(mapTransaction);
    const redeems = ((payload.tukar ?? []) as Record<string, unknown>[]).map(mapTransaction);
    all = [...deposits, ...redeems].sort((a, b) => b.date.localeCompare(a.date));
  } else {
    all = (Array.isArray(payload) ? payload : []).map(mapTransaction);
  }

  const transactions = filter === "all" ? all : all.filter((t) => t.type === filter);
  return { transactions, totalPoint };
}

export async function getTransactionDetail(
  id: string,
): Promise<Transaction | null> {
  const res = await apiFetch(`${API_URL}/history/${id}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const { transactions } = await getTransactions();
    return transactions.find((t) => t.id === id) ?? null;
  }
  const raw = await res.json();
  const data = unwrap(raw) as Record<string, unknown>;
  return mapTransaction(data.transaction ? (data.transaction as Record<string, unknown>) : data);
}

// Not yet in API — no-op placeholder
export interface RewardTrackingItem {
  status: string;
  label: string;
  description: string;
  date: string;
  is_completed: boolean;
}

export async function getRewardOrderDetail(id: string): Promise<{
  status: string;
  tracking: RewardTrackingItem[];
  pickupCode?: string;
  pickupLocationName?: string;
  pickupLocationAddress?: string;
}> {
  const res = await apiFetch(`${API_URL}/rewards/orders/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat detail pesanan");
  const raw = await res.json();
  const d = (raw.data ?? raw) as Record<string, unknown>;
  const order = (d.order ?? d) as Record<string, unknown>;
  const loc = d.pickup_location as Record<string, unknown> | undefined;
  return {
    status: String(order.status ?? ""),
    tracking: Array.isArray(d.tracking) ? (d.tracking as RewardTrackingItem[]) : [],
    pickupCode: d.pickup_code ? String(d.pickup_code) : undefined,
    pickupLocationName: loc?.location_name ? String(loc.location_name) : undefined,
    pickupLocationAddress: loc?.address ? String(loc.address) : undefined,
  };
}

export async function confirmDelivery(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/rewards/orders/${id}/confirm`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal mengkonfirmasi penerimaan");
  }
}

// ---------------------------------------------------------------------------
// REWARDS
// ---------------------------------------------------------------------------

export async function getRewards(category = "All"): Promise<Reward[]> {
  const res = await apiFetch(`${API_URL}/rewards`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Gagal memuat reward");
  const data = await res.json();
  const payload = data.data ?? data;
  const products = Array.isArray(payload) ? payload : (payload.products ?? []);
  const all: Reward[] = (products as Record<string, unknown>[]).map(mapReward);
  if (category === "All") return all;
  return all.filter((r) => r.category === category);
}

export async function redeemReward(
  rewardId: string,
  quantity = 1,
  locationId: number,
): Promise<{ success: boolean; newBalance: number }> {
  const form = new FormData();
  form.append("product_id", rewardId);
  form.append("quantity", String(quantity));
  form.append("location_id", String(locationId));
  const res = await apiFetch(`${API_URL}/rewards/exchange`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Penukaran gagal");
  }
  const data = await res.json();
  return {
    success: true,
    newBalance: Number(data.new_balance ?? data.newBalance ?? 0),
  };
}

// ---------------------------------------------------------------------------
// CHATBOT / CUSTOMER SERVICE
// ---------------------------------------------------------------------------

export async function getChatHistory(): Promise<{ messages: ChatMessage[]; chatId: number | null }> {
  const res = await apiFetch(`${API_URL}/chatbot`, { headers: authHeaders() });
  if (!res.ok) return { messages: initialSupportMessages(), chatId: null };
  const data = await res.json();
  const payload = data.data ?? data;
  const chatId: number | null =
    typeof payload === "object" && !Array.isArray(payload)
      ? (((payload.chat as Record<string, unknown>)?.id ?? payload.chat_id ?? payload.chatId ?? null) as number | null)
      : null;
  const rawMsgs: unknown = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.messages)
      ? payload.messages
      : (payload.data ?? []);
  const msgs = (Array.isArray(rawMsgs) ? rawMsgs : []) as Record<string, unknown>[];
  if (!msgs.length) return { messages: initialSupportMessages(), chatId };
  return {
    messages: msgs.map(
      (m): ChatMessage => {
        const senderObj =
          typeof m.sender === "object" && m.sender !== null
            ? (m.sender as Record<string, unknown>)
            : null;
        const isAdmin = senderObj
          ? senderObj.role === "admin"
          : Boolean(m.from_admin);
        return {
          id: String(m.id ?? Math.random()),
          sender: isAdmin ? "agent" : "user",
          senderName: String(
            senderObj?.full_name ??
            m.sender_name ??
            m.senderName ??
            (isAdmin ? "Admin" : "Anda"),
          ),
          text: (m.message ?? m.text ?? "") as string,
          timeLabel: (m.time_label ??
            m.timeLabel ??
            new Date(
              (m.created_at as string | number | undefined) ?? Date.now(),
            ).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })) as string,
        };
      },
    ),
    chatId,
  };
}

export async function sendSupportMessage(
  message: string,
): Promise<{ chatId: number | null }> {
  const form = new FormData();
  form.append("message", message);
  const res = await apiFetch(`${API_URL}/chatbot/send`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Gagal mengirim pesan",
    );
  }
  const data = await res.json();
  const payload = data.data ?? data;
  const chatId: number | null =
    typeof payload === "object" && !Array.isArray(payload)
      ? (((payload.user_message as Record<string, unknown>)?.chat_id ?? payload.chat_id ?? payload.chatId ?? null) as number | null)
      : null;
  return { chatId };
}

export function initialSupportMessages(): ChatMessage[] {
  return [
    {
      id: "msg_init_1",
      sender: "agent",
      senderName: "Sarah",
      text: "Halo! Saya Sarah dari tim Admin Smart Eco Bank. Ada yang bisa saya bantu hari ini? 😊",
      timeLabel: "09:15",
    },
  ];
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

function notifTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

const NOTIF_ICON: Record<string, string> = {
  transaction: "recycling",
  reward: "redeem",
  chat: "chat",
};

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch(`${API_URL}/notifications`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.data ?? []);
  const today = new Date().toDateString();
  return (items as Record<string, unknown>[])
    .map((n) => {
      const createdAt = (n.created_at as string | undefined) ?? "";
      const notifDate = createdAt ? new Date(createdAt).toDateString() : today;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const group: AppNotification["group"] =
        notifDate === today ? "Terbaru" :
        notifDate === yesterday ? "Kemarin" : "Lebih Lama";
      return {
        id: String(n.id ?? Math.random()),
        iconKey: NOTIF_ICON[(n.reference_type as string) ?? ""] ?? "notifications",
        title: String(n.title ?? "Notifikasi"),
        body: String(n.message ?? n.body ?? ""),
        timeAgo: createdAt ? notifTimeAgo(createdAt) : "Baru saja",
        group,
        read: Boolean(n.is_read),
      };
    })
    .filter((n) => {
      if (typeof window === "undefined") return true;
      if (n.iconKey === "chat" && localStorage.getItem("eco_notif_chat") === "false") return false;
      if ((n.iconKey === "recycling" || n.iconKey === "redeem") && localStorage.getItem("eco_notif_update") === "false") return false;
      return true;
    });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`${API_URL}/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(),
  }).catch(() => {});
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/notifications/${id}/delete`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menghapus notifikasi");
  }
}

export async function deleteAllNotifications(): Promise<void> {
  const res = await apiFetch(`${API_URL}/notifications/delete-all`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal menghapus semua notifikasi");
  }
}

// ---------------------------------------------------------------------------
// SCAN QR (user side)
// ---------------------------------------------------------------------------

export interface ScanQrResult {
  pointsEarned: number;
  totalPoints: number;
  message: string;
}

export async function scanQr(qrToken: string): Promise<ScanQrResult> {
  const form = new FormData();
  form.append("qr_token", qrToken);
  const res = await apiFetch(`${API_URL}/scan-qr`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Scan QR gagal");
  }
  const data = await res.json();
  const d = (data.data ?? data) as Record<string, unknown>;
  return {
    pointsEarned: Number(d.points_earned ?? 0),
    totalPoints: Number(d.total_points ?? 0),
    message: String(data.message ?? "QR berhasil dipindai"),
  };
}

// ---------------------------------------------------------------------------
// PROFILE & SECURITY
// ---------------------------------------------------------------------------

export async function updateUserProfile(payload: { fullName?: string; phone?: string; address?: string; photo?: File | null }): Promise<void> {
  const form = new FormData();
  if (payload.fullName) form.append("full_name", payload.fullName);
  if (payload.phone) form.append("phone", payload.phone);
  if (payload.address) form.append("address", payload.address);
  if (payload.photo) form.append("photo", payload.photo);

  const res = await fetch(`${API_URL}/profile/update`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Gagal memperbarui profil");
  }
}

export async function deleteUserPhoto(): Promise<void> {
  const res = await fetch(`${API_URL}/profile/photo`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Gagal menghapus foto profil");
}

export async function updateUserPassword(payload: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }): Promise<void> {
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

export async function updateUserPin(payload: { currentPin?: string; newPin: string; newPinConfirmation: string }): Promise<void> {
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

export async function verifyUserPin(pin: string): Promise<void> {
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


