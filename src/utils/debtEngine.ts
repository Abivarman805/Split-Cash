import { User, Expense, Settlement, SimplifiedDebt, SplitType, SplitDetail } from '../types';

/**
 * Recalculates net balances for all group members from raw expenses and settlements.
 * Positive balance = member is owed money (creditor).
 * Negative balance = member owes money (debtor).
 * Zero balance = completely settled.
 */
export function calculateNetBalances(
  members: User[],
  expenses: Expense[],
  settlements: Settlement[]
): Record<string, number> {
  const netBalances: Record<string, number> = {};

  // Initialize all group members with 0
  members.forEach(member => {
    netBalances[member.id] = 0;
  });

  // 1. Process Expenses
  expenses.forEach(exp => {
    // The person who paid gets credited the full amount
    netBalances[exp.paidById] = (netBalances[exp.paidById] || 0) + exp.amount;

    // Each participant gets debited their specific share
    exp.splits.forEach(split => {
      netBalances[split.userId] = (netBalances[split.userId] || 0) - split.amount;
    });
  });

  // 2. Process Settlements
  settlements.forEach(settlement => {
    // Payer sent money, so their debt decreases (net balance increases)
    netBalances[settlement.payerId] = (netBalances[settlement.payerId] || 0) + settlement.amount;
    // Receiver got money, so their credit decreases (net balance decreases)
    netBalances[settlement.receiverId] = (netBalances[settlement.receiverId] || 0) - settlement.amount;
  });

  // Round all balances to 2 decimal places to avoid floating point inaccuracies
  Object.keys(netBalances).forEach(userId => {
    netBalances[userId] = Math.round(netBalances[userId] * 100) / 100;
  });

  return netBalances;
}

/**
 * Greedy bipartite debt minimization algorithm.
 * Transforms an arbitrary mesh of debts into minimal pairwise payments.
 */
export function simplifyDebts(
  members: User[],
  netBalances: Record<string, number>
): SimplifiedDebt[] {
  interface Account {
    userId: string;
    amount: number;
  }

  const debtors: Account[] = [];
  const creditors: Account[] = [];

  Object.entries(netBalances).forEach(([userId, balance]) => {
    const val = Math.round(balance * 100) / 100;
    if (val < -0.01) {
      debtors.push({ userId, amount: -val }); // Positive amount owed
    } else if (val > 0.01) {
      creditors.push({ userId, amount: val }); // Positive amount to receive
    }
  });

  // Sort descending to settle largest amounts first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplified: SimplifiedDebt[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const settleAmount = Math.min(debtors[d].amount, creditors[c].amount);
    const rounded = Math.round(settleAmount * 100) / 100;

    if (rounded > 0.01) {
      simplified.push({
        from: debtors[d].userId,
        to: creditors[c].userId,
        amount: rounded,
      });
    }

    debtors[d].amount = Math.round((debtors[d].amount - settleAmount) * 100) / 100;
    creditors[c].amount = Math.round((creditors[c].amount - settleAmount) * 100) / 100;

    if (debtors[d].amount <= 0.01) d++;
    if (creditors[c].amount <= 0.01) c++;
  }

  return simplified;
}

/**
 * Calculates itemized split distribution based on split type and member values.
 */
export function calculateExpenseSplits(
  totalAmount: number,
  splitType: SplitType,
  participantIds: string[],
  customValues: Record<string, number>
): { splits: SplitDetail[]; error?: string } {
  if (totalAmount <= 0) {
    return { splits: [], error: 'Amount must be greater than zero' };
  }
  if (participantIds.length === 0) {
    return { splits: [], error: 'At least one participant must be selected' };
  }

  const n = participantIds.length;

  if (splitType === 'equal') {
    // Distribute total equally with exact penny distribution for remainder
    const baseShare = Math.floor((totalAmount / n) * 100) / 100;
    let remainder = Math.round((totalAmount - (baseShare * n)) * 100);

    const splits = participantIds.map((userId, index) => {
      let amount = baseShare;
      if (index < remainder) {
        amount = Math.round((amount + 0.01) * 100) / 100;
      }
      return { userId, amount };
    });
    return { splits };
  }

  if (splitType === 'exact') {
    let sum = 0;
    const splits = participantIds.map(userId => {
      const val = Math.max(0, customValues[userId] || 0);
      sum += val;
      return {
        userId,
        amount: Math.round(val * 100) / 100,
        exactAmount: val,
      };
    });

    sum = Math.round(sum * 100) / 100;
    const diff = Math.round((totalAmount - sum) * 100) / 100;
    if (Math.abs(diff) > 0.05) {
      return {
        splits,
        error: `Sum of exact amounts (${sum}) does not match total (${totalAmount}). Difference: ${diff > 0 ? `+${diff}` : diff}`,
      };
    }
    return { splits };
  }

  if (splitType === 'percentage') {
    let totalPct = 0;
    participantIds.forEach(userId => {
      totalPct += Math.max(0, customValues[userId] || 0);
    });

    totalPct = Math.round(totalPct * 100) / 100;
    if (Math.abs(totalPct - 100) > 0.1) {
      return {
        splits: [],
        error: `Total percentage must equal 100% (currently ${totalPct}%)`,
      };
    }

    const splits = participantIds.map(userId => {
      const pct = Math.max(0, customValues[userId] || 0);
      const amount = Math.round((totalAmount * (pct / 100)) * 100) / 100;
      return {
        userId,
        amount,
        percentage: pct,
      };
    });
    return { splits };
  }

  if (splitType === 'shares') {
    let totalShares = 0;
    participantIds.forEach(userId => {
      const shares = Math.max(1, customValues[userId] || 1);
      totalShares += shares;
    });

    if (totalShares <= 0) {
      return { splits: [], error: 'Total shares must be at least 1' };
    }

    const splits = participantIds.map(userId => {
      const shares = Math.max(1, customValues[userId] || 1);
      const amount = Math.round(((totalAmount * shares) / totalShares) * 100) / 100;
      return {
        userId,
        amount,
        shares,
      };
    });
    return { splits };
  }

  return { splits: [] };
}
