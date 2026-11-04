import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetBalances, simplifyDebts, calculateExpenseSplits } from './debtEngine';
import { User, Expense, Settlement } from '../types';

const mockMembers: User[] = [
  { id: 'u1', name: 'Alex', email: 'alex@example.com', avatar: '' },
  { id: 'u2', name: 'Maya', email: 'maya@example.com', avatar: '' },
  { id: 'u3', name: 'Ravi', email: 'ravi@example.com', avatar: '' },
  { id: 'u4', name: 'Neha', email: 'neha@example.com', avatar: '' },
];

test('calculateExpenseSplits - equal split distributes evenly and accounts for remainder pennies', () => {
  const res = calculateExpenseSplits(100, 'equal', ['u1', 'u2', 'u3'], {});
  assert.equal(res.error, undefined);
  assert.equal(res.splits.length, 3);
  const total = res.splits.reduce((sum, s) => sum + s.amount, 0);
  assert.equal(Math.round(total * 100) / 100, 100);
});

test('calculateExpenseSplits - exact split checks match with total', () => {
  const invalid = calculateExpenseSplits(500, 'exact', ['u1', 'u2'], { u1: 200, u2: 250 });
  assert.ok(invalid.error?.includes('does not match total'));

  const valid = calculateExpenseSplits(500, 'exact', ['u1', 'u2'], { u1: 250, u2: 250 });
  assert.equal(valid.error, undefined);
  assert.equal(valid.splits[0].amount, 250);
  assert.equal(valid.splits[1].amount, 250);
});

test('calculateExpenseSplits - percentage split validates 100% total', () => {
  const invalid = calculateExpenseSplits(1000, 'percentage', ['u1', 'u2'], { u1: 60, u2: 30 });
  assert.ok(invalid.error?.includes('must equal 100%'));

  const valid = calculateExpenseSplits(1000, 'percentage', ['u1', 'u2'], { u1: 60, u2: 40 });
  assert.equal(valid.error, undefined);
  assert.equal(valid.splits[0].amount, 600);
  assert.equal(valid.splits[1].amount, 400);
});

test('calculateExpenseSplits - shares split calculates proportions correctly', () => {
  // u1: 2 shares, u2: 1 share -> total 3 shares of 300 => 200 and 100
  const res = calculateExpenseSplits(300, 'shares', ['u1', 'u2'], { u1: 2, u2: 1 });
  assert.equal(res.error, undefined);
  assert.equal(res.splits[0].amount, 200);
  assert.equal(res.splits[1].amount, 100);
});

test('calculateNetBalances - net balances always sum to zero and reflect Goa weekend dummy data', () => {
  const expenses: Expense[] = [
    {
      id: 'e1',
      groupId: 'g1',
      title: 'Villa Stay',
      category: 'Stay',
      amount: 24000,
      paidById: 'u1',
      splitType: 'equal',
      splits: [
        { userId: 'u1', amount: 6000 },
        { userId: 'u2', amount: 6000 },
        { userId: 'u3', amount: 6000 },
        { userId: 'u4', amount: 6000 },
      ],
      date: '2026-10-24',
      createdAt: '2026-10-24',
    },
    {
      id: 'e2',
      groupId: 'g1',
      title: 'Seafood Dinner',
      category: 'Food',
      amount: 6400,
      paidById: 'u2',
      splitType: 'exact',
      splits: [
        { userId: 'u1', amount: 1400 },
        { userId: 'u2', amount: 1600 },
        { userId: 'u3', amount: 2000 },
        { userId: 'u4', amount: 1400 },
      ],
      date: '2026-10-25',
      createdAt: '2026-10-25',
    },
  ];

  const settlements: Settlement[] = [
    {
      id: 's1',
      groupId: 'g1',
      payerId: 'u4',
      receiverId: 'u1',
      amount: 3000,
      date: '2026-10-26',
      method: 'UPI',
      createdAt: '2026-10-26',
    },
  ];

  const nets = calculateNetBalances(mockMembers, expenses, settlements);

  // Sum of all net balances must equal 0
  const sum = Object.values(nets).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum) < 0.01, `Net balances must sum to 0, got ${sum}`);

  // Test debt simplification
  const debts = simplifyDebts(mockMembers, nets);
  assert.ok(debts.length > 0);
  
  // Total debt owed in simplified graph must match total debtor balances
  const totalDebtorAmount = Object.values(nets)
    .filter(val => val < 0)
    .reduce((a, b) => a + (-b), 0);
  const totalDebtTransfers = debts.reduce((a, b) => a + b.amount, 0);
  assert.ok(Math.abs(totalDebtorAmount - totalDebtTransfers) < 0.05);
});
