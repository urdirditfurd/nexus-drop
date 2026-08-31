import { clearToken, getToken, setToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = RequestInit & { auth?: boolean };

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((e: { msg?: string }) => e.msg ?? "").join(", ");
    }
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (res.status === 401 && options.auth) {
    clearToken();
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function getAdminMe(): Promise<AdminUser> {
  return apiFetch<AdminUser>("/auth/me", { auth: true });
}

// --- Products ---

export interface AdminProduct {
  id: number;
  sku: string;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  cost_price: number;
  sell_price: number;
  currency: string;
  stock: number;
  image_urls: string[] | null;
  supplier_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  return apiFetch<AdminProduct[]>("/products", { auth: true });
}

// --- Orders ---

export interface AdminOrderItem {
  id: number;
  product_id: number | null;
  quantity: number;
  unit_price: number;
  title_snapshot: string | null;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_email: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items: AdminOrderItem[];
}

export async function listAdminOrders(): Promise<AdminOrder[]> {
  return apiFetch<AdminOrder[]>("/orders", { auth: true });
}

// --- Suppliers ---

export interface AdminSupplier {
  id: number;
  name: string;
  platform: string | null;
  contact_email: string | null;
  api_url: string | null;
  notes: string | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
}

export async function listAdminSuppliers(): Promise<AdminSupplier[]> {
  return apiFetch<AdminSupplier[]>("/suppliers", { auth: true });
}

// --- Trends ---

export interface AdminTrend {
  id: number;
  keyword: string;
  niche: string | null;
  platform: string | null;
  score: number;
  search_volume: number | null;
  avg_price: number | null;
  competition: string | null;
  scanned_at: string;
}

export async function listAdminTrends(): Promise<AdminTrend[]> {
  return apiFetch<AdminTrend[]>("/trends", { auth: true });
}

// --- Dashboard ---

export interface DashboardKPIs {
  total_products: number;
  active_listings: number;
  pending_orders: number;
  revenue_month: number;
  avg_margin_pct: number;
  top_trend_keyword: string | null;
}

export interface ChartPoint {
  name: string;
  revenue: number;
  orders: number;
}

export async function getDashboardKpis(): Promise<DashboardKPIs> {
  return apiFetch<DashboardKPIs>("/dashboard/kpis", { auth: true });
}

export async function getDashboardChart(): Promise<ChartPoint[]> {
  return apiFetch<ChartPoint[]>("/dashboard/chart", { auth: true });
}

// --- Checkout ---

export interface CheckoutItem {
  product_id: number;
  quantity: number;
}

export interface CreateIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  publishable_key: string;
  order_id: number;
  order_number: string;
}

export async function createCheckoutIntent(payload: {
  items: CheckoutItem[];
  customer_email: string;
  currency?: string;
  shipping_address?: Record<string, string>;
}): Promise<CreateIntentResponse> {
  return apiFetch<CreateIntentResponse>("/checkout/create-intent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmCheckout(
  paymentIntentId: string,
): Promise<{ order_number: string; status: string }> {
  return apiFetch("/checkout/confirm", {
    method: "POST",
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });
}

// --- Auto-Publish ---

export interface AutoPublishStatus {
  enabled: boolean;
  daily_target: number;
  published_today: number;
  queue_count: number;
  quarantine_count: number;
  published_total: number;
  last_run: string | null;
}

export interface AutoPublishRunResult {
  success: boolean;
  product_id: number | null;
  status: string;
  reason: string | null;
  steps: string[];
}

export interface QuarantineProduct {
  id: number;
  sku: string;
  title: string;
  cost_price: number;
  quarantine_reason: string | null;
  keyword: string | null;
  created_at: string;
}

export interface AutoPublishLogEntry {
  id: number;
  action: string;
  product_id: number | null;
  title: string | null;
  status: string;
  reason: string | null;
  created_at: string;
}

export async function getAutoPublishStatus(): Promise<AutoPublishStatus> {
  return apiFetch<AutoPublishStatus>("/auto-publish/status", { auth: true });
}

export async function updateAutoPublishSettings(payload: {
  enabled?: boolean;
  daily_target?: number;
}): Promise<{ enabled: boolean; daily_target: number }> {
  return apiFetch("/auto-publish/settings", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function runAutoPublishCycle(
  seed?: Record<string, string>,
): Promise<AutoPublishRunResult> {
  return apiFetch<AutoPublishRunResult>("/auto-publish/run", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ seed: seed ?? null }),
  });
}

export async function getAutoPublishHistory(): Promise<AutoPublishLogEntry[]> {
  return apiFetch<AutoPublishLogEntry[]>("/auto-publish/history", { auth: true });
}

export async function getQuarantineProducts(): Promise<QuarantineProduct[]> {
  return apiFetch<QuarantineProduct[]>("/auto-publish/quarantine", { auth: true });
}

export async function reviveQuarantineProduct(
  productId: number,
): Promise<{ id: number; status: string }> {
  return apiFetch(`/auto-publish/quarantine/${productId}/revive`, {
    method: "POST",
    auth: true,
  });
}

// --- Dry-Run ---

export interface DryRunReport {
  dry_run: boolean;
  keyword: string;
  ean: string | null;
  asin: string | null;
  overall_would_publish: boolean;
  step_1_trend: { success: boolean; data: Record<string, unknown>; error?: string | null };
  step_2_supplier: { success: boolean; data: Record<string, unknown>; error?: string | null };
  step_3_competitor: { success: boolean; data: Record<string, unknown>; error?: string | null };
  step_4_pricing: {
    status: string;
    reason?: string | null;
    calculated_price?: number | null;
    margin?: number | null;
    guard_failed?: string | null;
  };
  step_5_listing: { success: boolean; data: Record<string, unknown>; error?: string | null };
}

export async function runDryRun(payload: {
  keyword: string;
  ean?: string;
  asin?: string;
  title?: string;
  source_url?: string;
}): Promise<DryRunReport> {
  return apiFetch<DryRunReport>("/auto-publish/dry-run", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}
