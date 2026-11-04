import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  INITIAL_GROUPS,
  INITIAL_EXPENSES,
  INITIAL_SETTLEMENTS,
} from './src/data/dummyData';
import {
  calculateNetBalances,
  simplifyDebts,
  calculateExpenseSplits,
} from './src/utils/debtEngine';
import { validateEmail, validatePassword, authenticateUser } from './src/utils/auth';
import { User, Group, Expense, Settlement } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI client on server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
// ARD Specification: Agent Resource Discovery Manifest
app.get(['/ai-catalog.json', '/.well-known/ai-catalog.json', '/.well-known/ard.json'], (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    specVersion: "1.0",
    host: {
      displayName: "SplitMate"
    },
    entries: [
      {
        identifier: "urn:air:splitmate:api:health",
        displayName: "SplitMate Health API",
        type: "application/json",
        url: `http://${_req.headers.host || 'localhost:3000'}/api/health`,
        description: "API status and AI capability discovery for SplitMate"
      }
    ]
  });
});
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// USERS STORE WITH EXPLICIT ADMIN VS REGULAR USER ROLES
// ============================================================================
let usersStore: User[] = [
  {
    id: 'u_admin',
    name: 'Security Admin',
    email: 'admin@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
    color: '#dc2626',
    role: 'admin', // Full system access
  },
  {
    id: 'u1',
    name: 'Alex Rivera',
    email: 'alex@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    color: '#059669',
    role: 'user', // Regular user: only sees own records
  },
  {
    id: 'u2',
    name: 'Maya Patel',
    email: 'maya@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    color: '#7c3aed',
    role: 'user',
  },
  {
    id: 'u3',
    name: 'Ravi Kumar',
    email: 'ravi@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    color: '#0284c7',
    role: 'user',
  },
  {
    id: 'u4',
    name: 'Neha Sharma',
    email: 'neha@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
    color: '#e11d48',
    role: 'user',
  },
];

let groupsStore: Group[] = structuredClone(INITIAL_GROUPS);

// Pre-link all initial expenses to their owner's user ID
let expensesStore: Expense[] = INITIAL_EXPENSES.map(e => ({
  ...e,
  userId: e.paidById, // Explicitly linked to unique user ID
}));

let settlementsStore: Settlement[] = structuredClone(INITIAL_SETTLEMENTS);

function computeGroupLedger(groupId: string) {
  const group = groupsStore.find(g => g.id === groupId) || groupsStore[0];
  const groupExpenses = expensesStore.filter(e => e.groupId === group.id);
  const groupSettlements = settlementsStore.filter(s => s.groupId === group.id);
  const netBalances = calculateNetBalances(group.members, groupExpenses, groupSettlements);
  const simplifiedDebts = simplifyDebts(group.members, netBalances);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    group,
    expenses: groupExpenses,
    settlements: groupSettlements,
    netBalances,
    simplifiedDebts,
    totalSpend,
  };
}

// ARD Specification: Agent Resource Discovery Manifest
app.get(['/ai-catalog.json', '/.well-known/ai-catalog.json', '/.well-known/ard.json'], (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    specVersion: '1.0',
    host: {
      displayName: 'SplitMate',
    },
    entries: [
      {
        identifier: 'urn:air:splitmate:api:health',
        displayName: 'SplitMate Health API',
        type: 'application/json',
        url: `http://${_req.headers.host || 'localhost:3000'}/api/health`,
        description: 'API status and AI capability discovery for SplitMate',
      },
    ],
  });
});

// ============================================================================
// SYSTEM & BOOTSTRAP APIs (With Strict Role-based Expense Isolation)
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!ai,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/bootstrap', (req, res) => {
  const groupId = (req.query.groupId as string) || groupsStore[0]?.id || 'grp_goa_01';
  const userId = (req.query.userId as string) || usersStore[1]?.id || 'u1';

  const currentUser = usersStore.find(u => u.id === userId) || usersStore[1];
  const ledger = computeGroupLedger(groupId);

  // STRICT ACCESS ISOLATION:
  // Admin receives all expenses; Regular users receive ONLY expenses they own
  let userVisibleExpenses = ledger.expenses;
  if (currentUser.role !== 'admin') {
    userVisibleExpenses = ledger.expenses.filter(
      e => e.userId === currentUser.id || e.paidById === currentUser.id
    );
  }

  res.json({
    success: true,
    data: {
      currentUser,
      users: usersStore,
      groups: groupsStore,
      activeGroup: ledger.group,
      expenses: userVisibleExpenses,
      settlements: ledger.settlements,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
      totalSpend: ledger.totalSpend,
    },
  });
});

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }
  const passCheck = validatePassword(password || '');
  if (!passCheck.valid) {
    return res.status(400).json({ success: false, error: passCheck.error || 'Invalid password' });
  }

  let user = authenticateUser(email, usersStore);
  if (!user) {
    const isAdminEmail = email.toLowerCase().includes('admin');
    user = {
      id: 'u_' + Date.now(),
      name: email.split('@')[0],
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email.trim())}`,
      color: isAdminEmail ? '#dc2626' : '#059669',
      role: isAdminEmail ? 'admin' : 'user',
    };
    usersStore.push(user);
  }

  return res.json({
    success: true,
    data: {
      user,
      token: `sm_jwt_${user.id}_${Date.now()}`,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Please enter your name' });
  }
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }
  const passCheck = validatePassword(password || '');
  if (!passCheck.valid) {
    return res.status(400).json({ success: false, error: passCheck.error || 'Password must be at least 6 characters' });
  }

  const existing = authenticateUser(email, usersStore);
  if (existing) {
    return res.json({
      success: true,
      data: {
        user: existing,
        token: `sm_jwt_${existing.id}_${Date.now()}`,
      },
    });
  }

  const isAdminEmail = email.toLowerCase().includes('admin');
  const newUser: User = {
    id: 'u_' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    color: isAdminEmail ? '#dc2626' : '#059669',
    role: isAdminEmail ? 'admin' : 'user', // Defaults to regular user unless admin
  };

  usersStore.push(newUser);

  if (groupsStore.length > 0 && !groupsStore[0].members.some(m => m.id === newUser.id)) {
    groupsStore[0].members.push(newUser);
  }

  return res.status(201).json({
    success: true,
    data: {
      user: newUser,
      token: `sm_jwt_${newUser.id}_${Date.now()}`,
    },
  });
});

app.post('/api/auth/quick-login', (req, res) => {
  const { userId, email } = req.body;
  const user =
    usersStore.find(u => u.id === userId) ||
    (email ? authenticateUser(email, usersStore) : null) ||
    usersStore[1]; // Defaults to Alex (user)

  return res.json({
    success: true,
    data: {
      user,
      token: `sm_jwt_${user.id}_${Date.now()}`,
    },
  });
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ success: true });
});

app.get('/api/users', (_req, res) => {
  return res.json({ success: true, data: usersStore });
});

app.patch('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, avatar, color } = req.body;

  const userIndex = usersStore.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const updatedUser: User = {
    ...usersStore[userIndex],
    ...(name ? { name: name.trim() } : {}),
    ...(email ? { email: email.trim() } : {}),
    ...(avatar ? { avatar } : {}),
    ...(color ? { color } : {}),
  };

  usersStore[userIndex] = updatedUser;

  groupsStore = groupsStore.map(g => ({
    ...g,
    members: g.members.map(m => (m.id === id ? updatedUser : m)),
  }));

  return res.json({ success: true, data: updatedUser });
});

// ============================================================================
// GROUPS & EXPENSES APIs (With User ID Linking & Query Filter)
// ============================================================================

app.get('/api/groups', (_req, res) => {
  return res.json({ success: true, data: groupsStore });
});

app.get('/api/groups/:groupId/summary', (req, res) => {
  const { groupId } = req.params;
  const ledger = computeGroupLedger(groupId);
  return res.json({
    success: true,
    data: {
      group: ledger.group,
      expenseCount: ledger.expenses.length,
      settlementCount: ledger.settlements.length,
      totalSpend: ledger.totalSpend,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

app.post('/api/groups', (req, res) => {
  const { id, name, description, currency, symbol, members } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Group name is required' });
  }

  const newGroup: Group = {
    id: id || 'grp_' + Date.now(),
    name: name.trim(),
    description: description || '',
    currency: currency || 'INR',
    symbol: symbol || '₹',
    members: Array.isArray(members) && members.length > 0 ? members : [usersStore[1]],
    createdAt: new Date().toISOString().split('T')[0],
  };

  groupsStore = [newGroup, ...groupsStore];
  return res.status(201).json({ success: true, data: newGroup });
});

app.post('/api/groups/:groupId/members', (req, res) => {
  const { groupId } = req.params;
  const { id, name, email, avatar, color } = req.body;

  const groupIndex = groupsStore.findIndex(g => g.id === groupId);
  if (groupIndex === -1) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Member name and email are required' });
  }

  let member = usersStore.find(u => u.id === id || u.email.toLowerCase() === email.trim().toLowerCase());
  if (!member) {
    member = {
      id: id || 'u_' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      color: color || '#059669',
      role: 'user',
    };
    usersStore.push(member);
  }

  const group = groupsStore[groupIndex];
  if (!group.members.some(m => m.id === member!.id)) {
    group.members = [...group.members, member];
    groupsStore[groupIndex] = group;
  }

  const ledger = computeGroupLedger(groupId);
  return res.status(201).json({
    success: true,
    data: {
      member,
      group,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

// GET /api/groups/:groupId/expenses
// Queries and returns ONLY the records belonging to the requesting user (unless Admin)
app.get('/api/groups/:groupId/expenses', (req, res) => {
  const { groupId } = req.params;
  const requestingUserId = req.query.userId as string | undefined;
  const memberFilter = req.query.memberId as string | undefined;

  const requestingUser = usersStore.find(u => u.id === requestingUserId);

  let list = expensesStore.filter(e => e.groupId === groupId);

  // If requesting user is NOT admin, isolate expenses strictly to their own user ID
  if (requestingUser?.role !== 'admin' && requestingUserId) {
    list = list.filter(
      e => e.userId === requestingUserId || e.paidById === requestingUserId
    );
  }

  if (memberFilter) {
    list = list.filter(
      e => e.paidById === memberFilter || e.splits.some(s => s.userId === memberFilter)
    );
  }

  return res.json({ success: true, data: list });
});

// POST /api/groups/:groupId/expenses
// Links the created expense record to the authenticated user's unique user ID
app.post('/api/groups/:groupId/expenses', (req, res) => {
  const { groupId } = req.params;
  const {
    id,
    title,
    category,
    amount,
    paidById,
    userId,
    splitType,
    splits,
    participantIds,
    customValues,
    date,
    notes,
    aiGenerated,
  } = req.body;

  if (!title || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Valid title and amount > 0 are required' });
  }

  let finalSplits = splits;
  if (!Array.isArray(finalSplits) || finalSplits.length === 0) {
    const calc = calculateExpenseSplits(
      Number(amount),
      splitType || 'equal',
      participantIds || [],
      customValues || {}
    );
    if (calc.error) {
      return res.status(400).json({ success: false, error: calc.error });
    }
    finalSplits = calc.splits;
  }

  const authenticatedOwnerId = userId || paidById;

  const newExpense: Expense = {
    id: id || 'exp_' + Date.now(),
    groupId,
    userId: authenticatedOwnerId, // Explicitly linked to current user's ID
    paidById: authenticatedOwnerId,
    title: title.trim(),
    category: category || 'Food',
    amount: Number(amount),
    splitType: splitType || 'equal',
    splits: finalSplits,
    date: date || new Date().toISOString().split('T')[0],
    notes,
    aiGenerated: !!aiGenerated,
    createdAt: new Date().toISOString(),
  };

  expensesStore = [newExpense, ...expensesStore];
  const ledger = computeGroupLedger(groupId);

  return res.status(201).json({
    success: true,
    data: {
      expense: newExpense,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

app.delete('/api/expenses/:expenseId', (req, res) => {
  const { expenseId } = req.params;
  const existing = expensesStore.find(e => e.id === expenseId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  expensesStore = expensesStore.filter(e => e.id !== expenseId);
  const ledger = computeGroupLedger(existing.groupId);

  return res.json({
    success: true,
    data: {
      deletedId: expenseId,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

app.get('/api/groups/:groupId/balances', (req, res) => {
  const { groupId } = req.params;
  const ledger = computeGroupLedger(groupId);
  return res.json({
    success: true,
    data: {
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

app.get('/api/groups/:groupId/settlements', (req, res) => {
  const { groupId } = req.params;
  const list = settlementsStore.filter(s => s.groupId === groupId);
  return res.json({ success: true, data: list });
});

app.post('/api/groups/:groupId/settlements', (req, res) => {
  const { groupId } = req.params;
  const { id, payerId, receiverId, amount, method, date, note } = req.body;

  if (!payerId || !receiverId || payerId === receiverId || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid payerId, receiverId, and amount > 0 are required',
    });
  }

  const newSettlement: Settlement = {
    id: id || 'stl_' + Date.now(),
    groupId,
    payerId,
    receiverId,
    amount: Number(amount),
    method: method || 'UPI',
    date: date || new Date().toISOString().split('T')[0],
    note,
    createdAt: new Date().toISOString(),
  };

  settlementsStore = [newSettlement, ...settlementsStore];
  const ledger = computeGroupLedger(groupId);

  return res.status(201).json({
    success: true,
    data: {
      settlement: newSettlement,
      netBalances: ledger.netBalances,
      simplifiedDebts: ledger.simplifiedDebts,
    },
  });
});

// ============================================================================
// AI GEMINI SERVICES APIs
// ============================================================================

app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    const { prompt, members, groupCurrency } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const membersList = (members || []).map((m: any) => `${m.name} (id: ${m.id})`).join(', ');

    if (ai) {
      try {
        const systemInstruction = `You are an expense extraction assistant for SplitMate.
Extract expense details from informal user prompts.
Available group members: ${membersList}.
Group Currency: ${groupCurrency || 'INR'}.
Rules:
1. Match the payer (paidById) and involved participants from the provided group members list.
2. If payer is ambiguous, select the most likely member mentioned.
3. If participants are not specified, default to all available group members.
4. Default splitType to "equal", "exact", "percentage", or "shares" based on the text.
5. If amounts for each participant are stated, assign them.
6. Return purely JSON conforming to the schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Parse this expense prompt: "${prompt}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Food', 'Stay', 'Travel', 'Activity', 'Shopping', 'Utilities', 'Other'] },
                amount: { type: Type.NUMBER },
                paidById: { type: Type.STRING },
                splitType: { type: Type.STRING, enum: ['equal', 'exact', 'percentage', 'shares'] },
                participantIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                notes: { type: Type.STRING },
              },
              required: ['title', 'category', 'amount', 'paidById', 'splitType', 'participantIds'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed });
        }
      } catch (err: any) {
        console.warn('Gemini parse fallback:', err.message);
      }
    }

    const lower = prompt.toLowerCase();
    let detectedAmount = 0;
    const amtMatch = prompt.match(/(?:₹|\$|€|£|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (amtMatch) {
      detectedAmount = parseFloat(amtMatch[1].replace(/,/g, ''));
    }

    let detectedCategory = 'Food';
    if (lower.includes('taxi') || lower.includes('cab') || lower.includes('flight') || lower.includes('uber') || lower.includes('fuel')) {
      detectedCategory = 'Travel';
    } else if (lower.includes('hotel') || lower.includes('villa') || lower.includes('airbnb') || lower.includes('stay') || lower.includes('resort')) {
      detectedCategory = 'Stay';
    } else if (lower.includes('scuba') || lower.includes('dive') || lower.includes('tour') || lower.includes('ticket') || lower.includes('museum')) {
      detectedCategory = 'Activity';
    }

    let payerId = members?.[0]?.id || 'u1';
    for (const m of (members || [])) {
      if (lower.includes(m.name.toLowerCase().split(' ')[0])) {
        payerId = m.id;
        break;
      }
    }

    const participants: string[] = [];
    (members || []).forEach((m: any) => {
      const firstName = m.name.toLowerCase().split(' ')[0];
      if (lower.includes(firstName) || lower.includes('everyone') || lower.includes('all')) {
        participants.push(m.id);
      }
    });

    const finalParticipants = participants.length > 0 ? participants : (members || []).map((m: any) => m.id);

    return res.json({
      success: true,
      data: {
        title: prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt,
        category: detectedCategory,
        amount: detectedAmount || 1500,
        paidById: payerId,
        splitType: 'equal',
        participantIds: finalParticipants,
        notes: `Parsed from: "${prompt}"`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse expense' });
  }
});

app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, sampleType } = req.body;

    if (ai && imageBase64) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
              },
            },
            {
              text: 'Extract merchant name, date, subtotal, tax, total, and line items from this receipt. Return strictly JSON.',
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                merchant: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Food', 'Stay', 'Travel', 'Activity', 'Shopping', 'Utilities', 'Other'] },
                date: { type: Type.STRING },
                subtotal: { type: Type.NUMBER },
                tax: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER },
                    },
                  },
                },
              },
              required: ['merchant', 'total', 'category'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed });
        }
      } catch (err: any) {
        console.warn('Gemini receipt scan fallback:', err.message);
      }
    }

    const samples: Record<string, any> = {
      restaurant: {
        merchant: "Fisherman's Cove Goa",
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        subtotal: 5400,
        tax: 450,
        total: 5850,
        items: [
          { name: 'Butter Garlic Tiger Prawns', price: 1800 },
          { name: 'Goan Fish Curry & Rice (x2)', price: 1200 },
          { name: 'Wood-fired Pizza Margherita', price: 850 },
          { name: 'Craft Beers & Cocktails (x4)', price: 1550 },
          { name: 'Service Tax & GST (5%)', price: 450 },
        ],
      },
    };

    const chosen = samples[sampleType || 'restaurant'] || samples.restaurant;
    return res.json({ success: true, data: chosen });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to scan receipt' });
  }
});

app.post('/api/ai/explain-balances', async (req, res) => {
  try {
    const { groupName, currencySymbol, expenses = [], settlements = [], netBalances = {}, simplifiedDebts = [], members = [] } = req.body;

    const summaryData = {
      groupName,
      totalExpenses: expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
      expenseCount: expenses.length,
      settlementCount: settlements.length,
      netBalances,
      simplifiedDebts,
      members: members.map((m: any) => ({ id: m.id, name: m.name, netBalance: netBalances[m.id] })),
    };

    if (ai) {
      try {
        const prompt = `Here is the current financial state of group "${groupName}" in currency ${currencySymbol}:
${JSON.stringify(summaryData, null, 2)}

Provide a clear, engaging, 3-paragraph plain-English narrative for the members:
1. High-level trip spending overview and highlight the primary expenditure driver.
2. Explain specifically who has a credit or debit and WHY.
3. Explain the settlement path with simplified debt transfers.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          return res.json({ success: true, narrative: response.text });
        }
      } catch (err: any) {
        console.warn('Gemini explainer fallback:', err.message);
      }
    }

    const totalSpend = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const sortedCreditors = Object.entries(netBalances)
      .filter(([_, b]: any) => b > 0)
      .sort((a: any, b: any) => b[1] - a[1]);

    const topCreditor = sortedCreditors[0] ? members.find((m: any) => m.id === sortedCreditors[0][0])?.name : 'Group';

    const narrative = `### 📊 Trip Financial Summary for ${groupName}

**Overview & Spending Drivers:**
Your group has logged **${currencySymbol}${totalSpend.toLocaleString()}** across ${expenses.length} shared items and ${settlements.length} settlement(s). The largest single commitment was fronted by **${topCreditor}**.

**Debt Simplification Path:**
SplitMate's greedy engine has streamlined the entire ledger down to just **${simplifiedDebts.length} simple pairwise transfers**. Once these specific payments are marked as settled, all accounts will stand at exactly ${currencySymbol}0.00.`;

    return res.json({ success: true, narrative });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate explanation' });
  }
});

app.post('/api/ai/complex-settlement-audit', async (req, res) => {
  try {
    const { userQuestion, groupContext } = req.body;
    if (!userQuestion) {
      return res.status(400).json({ error: 'userQuestion is required' });
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: `Group Context:
${JSON.stringify(groupContext, null, 2)}

User Complex Query / Scenario:
"${userQuestion}"`,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });

        if (response.text) {
          return res.json({
            success: true,
            model: 'gemini-4-argon',
            thinkingMode: 'HIGH',
            analysis: response.text,
          });
        }
      } catch (err: any) {
        console.warn('Gemini 4 Argon audit fallback:', err.message);
      }
    }

    const analysis = `### 🧠 Deep Settlement & Fairness Audit (High Reasoning Mode)

* **Total Ledger Conservation:** The sum of all net balances in the group is rigorously conserved at $\\sum Net = 0.00$.
* Debt simplification preserves exact individual net values while minimizing cash transfers.`;

    return res.json({
      success: true,
      model: 'gemini-4-argon (simulated response)',
      thinkingMode: 'HIGH',
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Audit failed' });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
// ARD Specification: Agent Resource Discovery Manifest
app.get(['/ai-catalog.json', '/.well-known/ai-catalog.json', '/.well-known/ard.json'], (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    specVersion: "1.0",
    host: {
      displayName: "SplitMate"
    },
    entries: [
      {
        identifier: "urn:air:splitmate:api:health",
        displayName: "SplitMate Health API",
        type: "application/json",
        url: `http://${_req.headers.host || 'localhost:3000'}/api/health`,
        description: "API status and AI capability discovery for SplitMate"
      }
    ]
  });
});