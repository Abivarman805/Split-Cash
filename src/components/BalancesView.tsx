import React from 'react';
import { Group, User, SimplifiedDebt, Expense } from '../types';
import { 
  ArrowRight, 
  Handshake, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';

interface BalancesViewProps {
  group: Group;
  currentUser: User;
  simplifiedDebts: SimplifiedDebt[];
  netBalances: Record<string, number>;
  expenses: Expense[];
  onInitiateSettlement: (fromUserId: string, toUserId: string, amount: number) => void;
  onOpenAiExplainer: () => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  group,
  currentUser,
  simplifiedDebts,
  netBalances,
  expenses,
  onInitiateSettlement,
  onOpenAiExplainer,
}) => {
  const getUser = (id: string) => group.members.find(m => m.id === id) || { name: 'Unknown', avatar: '' };

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Debt Simplification Algorithm Explainer Banner */}
      <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3 shadow-2xs">
        <span className="text-xl">⚡</span>
        <div className="flex-1">
          <div className="font-extrabold text-emerald-950 text-sm">
            Smart Debt Minimization Active
          </div>
          <p className="mt-0.5 leading-relaxed text-emerald-900/80">
            SplitMate analyzed all shared transactions and consolidated messy back-and-forth debts into{' '}
            <strong>{simplifiedDebts.length} minimal payments</strong>. Anyone can clear their full balance with just one direct transfer.
          </p>
        </div>
        <button
          onClick={onOpenAiExplainer}
          className="self-center hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-200/80 hover:bg-emerald-200 text-emerald-950 font-bold text-xs transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Explain</span>
        </button>
      </div>

      {/* Suggested Payments Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Suggested Payments to Settle Debts ({simplifiedDebts.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Direct peer-to-peer resolution
          </span>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All Settled Up!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Every member has a zero net balance. No payments are currently needed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {simplifiedDebts.map((debt, idx) => {
              const fromUser = getUser(debt.from);
              const toUser = getUser(debt.to);
              const isPayer = debt.from === currentUser.id;
              const isReceiver = debt.to === currentUser.id;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPayer
                      ? 'border-rose-300 ring-2 ring-rose-500/10 shadow-sm'
                      : isReceiver
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm'
                      : 'border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {/* Parties & Transfer Graphic */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    {/* From User */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={fromUser.avatar}
                        alt={fromUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {fromUser.name} {isPayer && '(You)'}
                        </div>
                        <div className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider">
                          Payer (Debtor)
                        </div>
                      </div>
                    </div>

                    {/* Arrow & Badge */}
                    <div className="flex flex-col items-center px-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:inline">
                        Owes
                      </span>
                      <div className="flex items-center text-slate-300 my-0.5">
                        <ArrowRight className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2.5">
                      <img
                        src={toUser.avatar}
                        alt={toUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {toUser.name} {isReceiver && '(You)'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                          Receiver (Creditor)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Record Payment Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {group.symbol}{debt.amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {isPayer
                          ? 'You need to send this'
                          : isReceiver
                          ? 'You should receive this'
                          : 'Peer-to-peer transfer'}
                      </div>
                    </div>

                    <button
                      onClick={() => onInitiateSettlement(debt.from, debt.to, debt.amount)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Standings Breakdown Grid */}
      <div className="mt-8 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Individual Member Net Standings
          </h3>
          <span className="text-[11px] text-slate-400">Sum of net balances is always ₹0.00</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {group.members.map(member => {
            const balance = Math.round((netBalances[member.id] || 0) * 100) / 100;
            const isUser = member.id === currentUser.id;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {member.name} {isUser && '(You)'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Net Balance:
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      balance > 0.01
                        ? 'text-emerald-600'
                        : balance < -0.01
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {balance > 0.01
                      ? `+${group.symbol}${balance.toLocaleString()}`
                      : balance < -0.01
                      ? `-${group.symbol}${Math.abs(balance).toLocaleString()}`
                      : `${group.symbol}0.00`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
