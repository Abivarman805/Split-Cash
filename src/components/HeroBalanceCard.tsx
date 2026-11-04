import React from 'react';
import { Group, User, Expense } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Handshake, 
  Receipt,
  ArrowRight
} from 'lucide-react';

interface HeroBalanceCardProps {
  group: Group;
  currentUser: User;
  netBalance: number;
  expenses: Expense[];
  simplifiedDebtsCount: number;
  onOpenAddExpense: () => void;
  onOpenSettleUp: () => void;
  onViewBalances: () => void;
  onOpenAiExplainer: () => void;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  group,
  currentUser,
  netBalance,
  expenses,
  simplifiedDebtsCount,
  onOpenAddExpense,
  onOpenSettleUp,
  onViewBalances,
  onOpenAiExplainer,
}) => {
  const roundedNet = Math.round(netBalance * 100) / 100;
  const isCreditor = roundedNet > 0.01;
  const isDebtor = roundedNet < -0.01;
  const isSettled = !isCreditor && !isDebtor;

  const totalGroupSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const userTotalPaid = expenses
    .filter(e => e.paidById === currentUser.id)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group.name}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {group.currency} ({group.symbol})
            </span>
          </div>
          {group.description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              {group.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSettleUp}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Handshake className="w-4 h-4 text-emerald-600" />
            <span>Settle Up</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Your Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl" />
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Your Balance
              </span>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                {isCreditor && <ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
                {isDebtor && <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                {isSettled && <CheckCircle2 className="w-4 h-4 text-slate-300" />}
              </div>
            </div>

            <div className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight flex items-baseline gap-1">
              {isCreditor && (
                <span className="text-emerald-400">
                  +{group.symbol}{roundedNet.toLocaleString()}
                </span>
              )}
              {isDebtor && (
                <span className="text-rose-400">
                  -{group.symbol}{Math.abs(roundedNet).toLocaleString()}
                </span>
              )}
              {isSettled && (
                <span className="text-slate-300">
                  {group.symbol}0.00
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
              {isCreditor && "You get money back overall."}
              {isDebtor && "You owe money overall."}
              {isSettled && "All settled up!"}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>You paid: {group.symbol}{userTotalPaid.toLocaleString()}</span>
            <span>{currentUser.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Card 2: Total Group Spend */}
        <div className="bg-gradient-to-br from-white via-slate-50/90 to-emerald-50/50 rounded-3xl p-5 sm:p-6 border border-emerald-200/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Total Group Spend
              </span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group.symbol}{totalGroupSpend.toLocaleString()}
            </div>

            <p className="text-xs text-slate-500 mt-1.5">
              Across <strong>{expenses.length} expenses</strong> shared by {group.members.length} friends.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
              Per person avg: {group.symbol}{group.members.length ? Math.round(totalGroupSpend / group.members.length).toLocaleString() : 0}
            </span>
          </div>
        </div>

        {/* Card 3: Easy Settle Plan */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-800">
                Easy Settle Plan
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Auto-Simplified
              </span>
            </div>

            <div className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {simplifiedDebtsCount === 0
                ? 'Everyone is settled!'
                : `${simplifiedDebtsCount} payment${simplifiedDebtsCount > 1 ? 's' : ''} left`}
            </div>

            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
              We combined all bills into the fewest possible payments to settle everyone up.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
            <button
              onClick={onViewBalances}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
            >
              <span>See Who Pays Whom</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAiExplainer}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>AI Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
