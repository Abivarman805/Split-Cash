export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export type ExpenseCategory = 'Stay' | 'Food' | 'Travel' | 'Activity' | 'Shopping' | 'Utilities' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color?: string;
  role?: 'admin' | 'user'; // Distinguishes admin from regular users
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  symbol: string;
  members: User[];
  createdAt: string;
}

export interface SplitDetail {
  userId: string;
  amount: number;
  exactAmount?: number;
  percentage?: number;
  shares?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  userId?: string;     // Unique owner ID linked to authenticated user
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidById: string;
  splitType: SplitType;
  splits: SplitDetail[];
  date: string;
  notes?: string;
  receiptUrl?: string;
  receiptData?: {
    merchant?: string;
    tax?: number;
    subtotal?: number;
    items?: Array<{ name: string; price: number }>;
  };
  aiGenerated?: boolean;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
  note?: string;
  createdAt: string;
}

export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

export interface ActivityItem {
  id: string;
  groupId: string;
  type: 'expense_added' | 'settlement_recorded' | 'member_joined' | 'group_created';
  actorId: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  type: 'expense' | 'settle' | 'reminder';
}