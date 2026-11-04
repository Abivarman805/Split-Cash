import {
  User,
  Group,
  Expense,
  Settlement,
  SimplifiedDebt,
  ExpenseCategory,
  SplitType,
} from '../types';

export interface BootstrapPayload {
  currentUser: User;
  users: User[];
  groups: Group[];
  activeGroup: Group;
  expenses: Expense[];
  settlements: Settlement[];
  netBalances: Record<string, number>;
  simplifiedDebts: SimplifiedDebt[];
  totalSpend: number;
}

export interface ParsedExpenseAI {
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidById: string;
  splitType: SplitType;
  participantIds: string[];
  notes?: string;
}

const inflightRequests = new Map<string, Promise<any>>();

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:3000`
    : '');

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const fullUrl = url.startsWith('http') ? url : `${BACKEND_BASE_URL}${url}`;
  const cacheKey = `${method}:${fullUrl}`;

  if (method === 'GET' && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const json = await response.json();
    if (!response.ok || json.success === false) {
      throw new Error(json.error || `API request failed: ${response.status}`);
    }
    return json;
  })();

  if (method === 'GET') {
    inflightRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => inflightRequests.delete(cacheKey));
  }

  return fetchPromise;
}

export const api = {
  health: () => requestJson<{ status: string; hasGeminiKey: boolean; timestamp: string }>('/api/health'),

  bootstrap: (groupId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    if (userId) params.set('userId', userId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return requestJson<{ success: boolean; data: BootstrapPayload }>(`/api/bootstrap${qs}`);
  },

  login: (email: string, password: string) =>
    requestJson<{ success: boolean; data: { user: User; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    requestJson<{ success: boolean; data: { user: User; token: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  quickLogin: (userId: string, email?: string) =>
    requestJson<{ success: boolean; data: { user: User; token: string } }>('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ userId, email }),
    }),

  logout: () => requestJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getUsers: () => requestJson<{ success: boolean; data: User[] }>('/api/users'),

  updateUser: (userId: string, updates: Partial<User>) =>
    requestJson<{ success: boolean; data: User }>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getGroups: () => requestJson<{ success: boolean; data: Group[] }>('/api/groups'),

  getGroupSummary: (groupId: string) =>
    requestJson<{
      success: boolean;
      data: {
        group: Group;
        expenseCount: number;
        settlementCount: number;
        totalSpend: number;
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/groups/${groupId}/summary`),

  createGroup: (group: Group) =>
    requestJson<{ success: boolean; data: Group }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    }),

  addGroupMember: (groupId: string, member: User) =>
    requestJson<{
      success: boolean;
      data: {
        member: User;
        group: Group;
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(member),
    }),

  getGroupExpenses: (groupId: string, memberId?: string | null) => {
    const qs = memberId ? `?memberId=${encodeURIComponent(memberId)}` : '';
    return requestJson<{ success: boolean; data: Expense[] }>(`/api/groups/${groupId}/expenses${qs}`);
  },

  createExpense: (groupId: string, expense: Expense) =>
    requestJson<{
      success: boolean;
      data: {
        expense: Expense;
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  deleteExpense: (expenseId: string) =>
    requestJson<{
      success: boolean;
      data: {
        deletedId: string;
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  getGroupBalances: (groupId: string) =>
    requestJson<{
      success: boolean;
      data: {
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/groups/${groupId}/balances`),

  getGroupSettlements: (groupId: string) =>
    requestJson<{ success: boolean; data: Settlement[] }>(`/api/groups/${groupId}/settlements`),

  recordSettlement: (groupId: string, settlement: Settlement) =>
    requestJson<{
      success: boolean;
      data: {
        settlement: Settlement;
        netBalances: Record<string, number>;
        simplifiedDebts: SimplifiedDebt[];
      };
    }>(`/api/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(settlement),
    }),

  parseExpensePrompt: (prompt: string, members: User[], groupCurrency: string) =>
    requestJson<{ success: boolean; data: ParsedExpenseAI }>('/api/ai/parse-expense', {
      method: 'POST',
      body: JSON.stringify({ prompt, members, groupCurrency }),
    }),

  scanReceipt: (payload: { imageBase64?: string; sampleType?: string }) =>
    requestJson<{ success: boolean; data: any }>('/api/ai/scan-receipt', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  explainBalances: (payload: {
    groupName: string;
    currencySymbol: string;
    expenses: Expense[];
    settlements: Settlement[];
    netBalances: Record<string, number>;
    simplifiedDebts: SimplifiedDebt[];
    members: User[];
  }) =>
    requestJson<{ success: boolean; narrative: string }>('/api/ai/explain-balances', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};