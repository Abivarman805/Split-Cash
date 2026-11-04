import React, { useState } from 'react';
import { Group, User } from '../../types';
import { X, Plus, Check } from 'lucide-react';

interface NewGroupModalProps {
  availableUsers: User[];
  currentUser: User;
  onClose: () => void;
  onCreateGroup: (group: Group) => void;
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  availableUsers,
  currentUser,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    availableUsers.map(u => u.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    const groupMembers = availableUsers.filter(u => selectedUserIds.includes(u.id));

    const newGroup: Group = {
      id: 'grp_' + Date.now(),
      name: name.trim(),
      currency: cur.code,
      symbol: cur.symbol,
      members: groupMembers.length > 0 ? groupMembers : [currentUser],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreateGroup(newGroup);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">New Group</h2>
              <p className="text-[11px] text-slate-400">Create a group for trips, rent, or events</p>
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
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Group Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Road Trip, Apartment Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Currency
            </label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Include Friends:
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {availableUsers.map(u => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={u.id === currentUser.id}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                          else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                        }}
                        className="rounded text-emerald-600 focus:ring-0"
                      />
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-semibold text-slate-800">
                        {u.name} {u.id === currentUser.id ? '(You)' : ''}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Create Group</span>
          </button>
        </form>
      </div>
    </div>
  );
};
