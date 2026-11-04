import { User, Group, Expense, Settlement, ActivityItem, NotificationItem } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    email: 'alex@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    color: '#059669', // Emerald
  },
  {
    id: 'u2',
    name: 'Maya Patel',
    email: 'maya@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    color: '#7c3aed', // Purple
  },
  {
    id: 'u3',
    name: 'Ravi Kumar',
    email: 'ravi@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    color: '#0284c7', // Sky
  },
  {
    id: 'u4',
    name: 'Neha Sharma',
    email: 'neha@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
    color: '#e11d48', // Rose
  },
  {
    id: 'u5',
    name: 'Jordan Lee',
    email: 'jordan@splitmate.app',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    color: '#d97706', // Amber
  },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp_goa_01',
    name: 'Goa Weekend 🏖️',
    description: '4-day beach trip, villa booking, water sports & seaside dining',
    currency: 'INR',
    symbol: '₹',
    createdAt: '2026-10-23',
    members: [INITIAL_USERS[0], INITIAL_USERS[1], INITIAL_USERS[2], INITIAL_USERS[3]],
  },
  {
    id: 'grp_apt_02',
    name: 'Apartment 402 Roommates 🏠',
    description: 'Rent, high-speed WiFi, groceries & housekeeping',
    currency: 'INR',
    symbol: '₹',
    createdAt: '2026-09-01',
    members: [INITIAL_USERS[0], INITIAL_USERS[1], INITIAL_USERS[4]],
  },
  {
    id: 'grp_tokyo_03',
    name: 'Tokyo Dream Tour ✈️',
    description: 'Shibuya, Shinjuku nightlife, bullet train & team ramen',
    currency: 'USD',
    symbol: '$',
    createdAt: '2026-10-15',
    members: [INITIAL_USERS[0], INITIAL_USERS[2], INITIAL_USERS[4]],
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    groupId: 'grp_goa_01',
    title: 'Candolim Beach Villa Stay',
    category: 'Stay',
    amount: 24000,
    paidById: 'u1', // Alex paid
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 6000 },
      { userId: 'u2', amount: 6000 },
      { userId: 'u3', amount: 6000 },
      { userId: 'u4', amount: 6000 },
    ],
    date: '2026-10-24',
    notes: '3 nights stay with pool access. Invoice #AB-88219',
    createdAt: '2026-10-24T14:30:00Z',
  },
  {
    id: 'exp_2',
    groupId: 'grp_goa_01',
    title: "Fisherman's Wharf Seafood & Drinks",
    category: 'Food',
    amount: 6400,
    paidById: 'u2', // Maya paid
    splitType: 'exact',
    splits: [
      { userId: 'u1', amount: 1400, exactAmount: 1400 },
      { userId: 'u2', amount: 1600, exactAmount: 1600 },
      { userId: 'u3', amount: 2000, exactAmount: 2000 }, // Ravi ordered extra cocktails
      { userId: 'u4', amount: 1400, exactAmount: 1400 },
    ],
    date: '2026-10-25',
    notes: 'Dinner at waterfront. Ravi took care of extra imported beverages.',
    createdAt: '2026-10-25T21:15:00Z',
  },
  {
    id: 'exp_3',
    groupId: 'grp_goa_01',
    title: 'Scuba Diving at Grand Island',
    category: 'Activity',
    amount: 9000,
    paidById: 'u3', // Ravi paid
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 3000 },
      { userId: 'u2', amount: 3000 },
      { userId: 'u3', amount: 3000 },
    ],
    date: '2026-10-26',
    notes: 'Includes speed boat ride, diving gear, and HD underwater GoPro footage. (Neha opted out)',
    createdAt: '2026-10-26T11:45:00Z',
  },
  {
    id: 'exp_4',
    groupId: 'grp_goa_01',
    title: 'Innova Airport Pickup & Tolls',
    category: 'Travel',
    amount: 2800,
    paidById: 'u4', // Neha paid
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 700 },
      { userId: 'u2', amount: 700 },
      { userId: 'u3', amount: 700 },
      { userId: 'u4', amount: 700 },
    ],
    date: '2026-10-27',
    notes: 'Airport Dabolim to Candolim transfer plus bridge tolls.',
    createdAt: '2026-10-27T09:20:00Z',
  },
  {
    id: 'exp_5',
    groupId: 'grp_goa_01',
    title: 'Sunset Cocktails at Curlies Shack',
    category: 'Food',
    amount: 4500,
    paidById: 'u1', // Alex paid
    splitType: 'shares',
    splits: [
      { userId: 'u1', amount: 1500, shares: 2 },
      { userId: 'u2', amount: 1500, shares: 2 },
      { userId: 'u3', amount: 750, shares: 1 },
      { userId: 'u4', amount: 750, shares: 1 },
    ],
    date: '2026-10-27',
    notes: 'Shared platters & cocktails on Anjuna cliff.',
    aiGenerated: true,
    createdAt: '2026-10-27T19:40:00Z',
  },
  // Apartment 402 Roommate Expenses
  {
    id: 'exp_apt_1',
    groupId: 'grp_apt_02',
    title: 'Airtel Gigabit Fiber Internet',
    category: 'Utilities',
    amount: 1499,
    paidById: 'u1',
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 500 },
      { userId: 'u2', amount: 500 },
      { userId: 'u5', amount: 499 },
    ],
    date: '2026-10-01',
    notes: 'Monthly billing cycle Oct 2026',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'exp_apt_2',
    groupId: 'grp_apt_02',
    title: 'Nature Basket Kitchen Supplies & Snacks',
    category: 'Food',
    amount: 3600,
    paidById: 'u2',
    splitType: 'equal',
    splits: [
      { userId: 'u1', amount: 1200 },
      { userId: 'u2', amount: 1200 },
      { userId: 'u5', amount: 1200 },
    ],
    date: '2026-10-12',
    notes: 'Olive oil, coffee beans, dishwashing pods',
    createdAt: '2026-10-12T17:30:00Z',
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'stl_1',
    groupId: 'grp_goa_01',
    payerId: 'u4', // Neha
    receiverId: 'u1', // Alex
    amount: 3000,
    date: '2026-10-26',
    method: 'UPI',
    note: 'GPay advance for villa booking',
    createdAt: '2026-10-26T16:00:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Expense Added',
    message: 'Neha added "Innova Airport Pickup & Tolls" (₹2,800)',
    timeAgo: '1 hour ago',
    read: false,
    type: 'expense',
  },
  {
    id: 'n2',
    title: 'Payment Recorded',
    message: 'Neha recorded a UPI payment of ₹3,000 to Alex',
    timeAgo: 'Yesterday',
    read: true,
    type: 'settle',
  },
  {
    id: 'n3',
    title: 'Settlement Reminder',
    message: 'Goa Weekend has 2 pending settlements to clear debts.',
    timeAgo: '2 days ago',
    read: true,
    type: 'reminder',
  },
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_1',
    groupId: 'grp_goa_01',
    type: 'expense_added',
    actorId: 'u1',
    description: 'added "Candolim Beach Villa Stay"',
    amount: 24000,
    currency: '₹',
    timestamp: '2026-10-24T14:30:00Z',
  },
  {
    id: 'act_2',
    groupId: 'grp_goa_01',
    type: 'expense_added',
    actorId: 'u2',
    description: 'added "Fisherman\'s Wharf Seafood & Drinks"',
    amount: 6400,
    currency: '₹',
    timestamp: '2026-10-25T21:15:00Z',
  },
  {
    id: 'act_3',
    groupId: 'grp_goa_01',
    type: 'settlement_recorded',
    actorId: 'u4',
    description: 'paid ₹3,000 to Alex via UPI',
    amount: 3000,
    currency: '₹',
    timestamp: '2026-10-26T16:00:00Z',
  },
  {
    id: 'act_4',
    groupId: 'grp_goa_01',
    type: 'expense_added',
    actorId: 'u3',
    description: 'added "Scuba Diving at Grand Island"',
    amount: 9000,
    currency: '₹',
    timestamp: '2026-10-26T11:45:00Z',
  },
];
