import React, { useState } from 'react';
import { User, Group } from '../../types';
import { X, UserCheck, Settings } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  users: User[];
  groups: Group[];
  onSelectUser: (user: User) => void;
  onUpdateCurrentUser: (updated: Partial<User>) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  users,
  onSelectUser,
  onUpdateCurrentUser,
  onClose,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateCurrentUser({ name: name.trim(), email: email.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Account & Profile</h2>
              <p className="text-[11px] text-slate-400">Settings and active member perspective</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 my-4">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.email}</div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Active Session
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
          >
            Save Profile Changes
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Switch Member Perspective:</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            Switch between users to simulate the experience from another friend's point of view:
          </p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelectUser(u);
                  setName(u.name);
                  setEmail(u.email);
                }}
                className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition ${
                  u.id === currentUser.id
                    ? 'bg-emerald-50 font-bold text-emerald-800 border border-emerald-200'
                    : 'hover:bg-emerald-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                  <span>{u.name}</span>
                </div>
                {u.id === currentUser.id && (
                  <span className="text-[10px] text-emerald-600 font-bold">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};