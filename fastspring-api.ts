const BASE_URL = "https://api.fastspring.com";

let authHeader: string | undefined;

export function initAuth(username: string, password: string): void {
  authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

// Validate ID parameters to prevent path traversal
function validateId(id: string, label: string): void {
  if (!/^[\w-]+$/.test(id)) {
    throw new Error(`Invalid ${label}: must be alphanumeric (got "${id}")`);
  }
}

async function request(path: string, params?: Record<string, string>): Promise<unknown> {
  if (!authHeader) throw new Error("FastSpring API not initialized — call initAuth() first.");
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
      "User-Agent": "fastspring-mcp/1.0",
      Accept: "application/json",
    },
  });

  if (res.status === 429) {
    throw new Error("FastSpring rate limit exceeded (250/min). Wait a moment and retry.");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FastSpring API error (${res.status})`);
  }

  return res.json();
}

// --- Subscriptions ---

export async function getSubscription(subscriptionId: string): Promise<unknown> {
  validateId(subscriptionId, "subscriptionId");
  return request(`/subscriptions/${subscriptionId}`);
}

export async function listSubscriptions(filters: {
  accountId?: string;
  status?: string;
  begin?: string;
  end?: string;
  limit?: number;
}): Promise<unknown> {
  const params: Record<string, string> = {};
  if (filters.accountId) params.accountId = filters.accountId;
  if (filters.status) params.status = filters.status;
  if (filters.begin) params.begin = filters.begin;
  if (filters.end) params.end = filters.end;
  if (filters.limit) params.limit = String(filters.limit);
  return request("/subscriptions", params);
}

export async function listSubscriptionEntries(subscriptionId: string): Promise<unknown> {
  validateId(subscriptionId, "subscriptionId");
  return request(`/subscriptions/${subscriptionId}/entries`);
}

// --- Accounts ---

export async function searchAccounts(email: string): Promise<unknown> {
  if (!email.trim()) throw new Error("email is required for account search");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("invalid email format");
  return request("/accounts", { email });
}

export async function getAccount(accountId: string): Promise<unknown> {
  validateId(accountId, "accountId");
  return request(`/accounts/${accountId}`);
}

// --- Events ---

export async function listEvents(filters: {
  days?: number;
  type?: string;
}): Promise<unknown> {
  const params: Record<string, string> = {};
  params.days = String(filters.days ?? 7);
  if (filters.type) params.type = filters.type;
  return request("/events", params);
}

export async function getEvent(eventId: string): Promise<unknown> {
  validateId(eventId, "eventId");
  return request(`/events/${eventId}`);
}
