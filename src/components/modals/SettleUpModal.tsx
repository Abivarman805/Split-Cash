import React, { useState } from 'react';
import { Group, User, Settlement } from '../../types';
import { X, Handshake, Check, AlertCircle } from 'lucide-react';

interface SettleUpModalProps {
  group: Group;
  currentUser: User;
  initialData?: {
    payerId: string;
    receiverId: string;
    amount: number;
  } | null;
  onClose: () => void;
  onSave: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  group,
  currentUser,
  initialData,
  onClose,
  onSave,
}) => {
  const defaultPayerId = initialData?.payerId || currentUser.id;
  const defaultReceiverId =
    initialData?.receiverId || group.members.find(m => m.id !== defaultPayerId)?.id || '';

  const [payerId, setPayerId] = useState(defaultPayerId);
  const [receiverId, setReceiverId] = useState(defaultReceiverId);
  const [amountStr, setAmountStr] = useState(
    initialData ? initialData.amount.toString() : ''
  );
  const [method, setMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }
    if (payerId === receiverId) {
      setErrorMsg('Payer and receiver cannot be the same person.');
      return;
    }

    onSave({
      groupId: group.id,
      payerId,
      receiverId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Settle Up</h2>
              <p className="text-[11px] text-slate-400">Record a payment between friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Who Paid & Who Received */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Who Paid?
              </label>
              <select
                value={payerId}
                onChange={(e) => {
                  const newPayer = e.target.value;
                  setPayerId(newPayer);
                  if (newPayer === receiverId) {
                    const alt = group.members.find(m => m.id !== newPayer);
                    if (alt) setReceiverId(alt.id);
                  }
                }}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold bg-white"
              >
                {group.members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name.split(' ')[0]} {m.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Paid To Whom?
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold bg-white"
              >
                {group.members
                  .filter(m => m.id !== payerId)
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name.split(' ')[0]} {m.id === currentUser.id ? '(You)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Amount Paid ({group.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                {group.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-base font-extrabold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Simple Payment Mode Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Paid Via
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Cash', 'Bank Transfer'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMethod(mode)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                    method === mode
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode === 'UPI' ? '📱 UPI / GPay' : mode === 'Cash' ? '💵 Cash' : '🏦 Bank'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Record Payment</span>
          </button>
        </form>
      </div>
    </div>
  );
};
