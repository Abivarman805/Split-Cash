import React from 'react';
import { Group, User, Settlement } from '../types';
import { Handshake, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface SettlementHistoryProps {
  group: Group;
  currentUser: User;
  settlements: Settlement[];
  onOpenSettleUp: () => void;
}

export const SettlementHistory: React.FC<SettlementHistoryProps> = ({
  group,
  currentUser,
  settlements,
  onOpenSettleUp,
}) => {
  const getUser = (id: string) => group.members.find(m => m.id === id) || { name: 'Unknown', avatar: '' };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'Cash':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'Bank Transfer':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return <Handshake className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Recorded Settlement History ({settlements.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of external payments (UPI, Cash, Bank Transfer) recorded to clear group balances.
          </p>
        </div>

        <button
          onClick={onOpenSettleUp}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Record New Payment</span>
        </button>
      </div>

      {settlements.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
          <div className="text-4xl mb-2">🤝</div>
          <p className="font-bold text-slate-700">No settlements recorded yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When members pay each other outside the app, record it here to keep your group balances balanced.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {settlements.map(s => {
            const payer = getUser(s.payerId);
            const receiver = getUser(s.receiverId);
            const isUserPayer = s.payerId === currentUser.id;
            const isUserReceiver = s.receiverId === currentUser.id;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-300 transition shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    {getMethodIcon(s.method)}
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{payer.name}</span>
                      <span className="text-slate-400 font-normal">paid</span>
                      <span>{receiver.name}</span>
                      {(isUserPayer || isUserReceiver) && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                          {isUserPayer ? 'You paid' : 'You received'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-700">{s.method}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {s.date}
                      </span>
                      {s.note && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="italic text-slate-600">"{s.note}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-black text-emerald-600">
                    +{group.symbol}{s.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Settled
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
