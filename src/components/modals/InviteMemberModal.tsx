import React, { useState } from 'react';
import { Group, User } from '../../types';
import { X, UserPlus, Check, Copy, Compass } from 'lucide-react';

interface InviteMemberModalProps {
  group: Group;
  onClose: () => void;
  onAddMember: (newMember: User) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  group,
  onClose,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteCode = 'GOA24';
  const inviteLink = `https://splitmate.app/join/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const colors = ['#4F46E5', '#7C3AED', '#6366F1', '#059669', '#E11D48', '#D97706'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: User = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@splitmate.app`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      color: randomColor,
    };

    onAddMember(newMember);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Invite Members</h2>
              <p className="text-[11px] text-slate-400">Add friends to {group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link Box */}
        <div className="my-4 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Direct Invite Link:
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-white px-2.5 py-1.5 text-xs rounded-xl border border-emerald-200 text-slate-700 font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400 font-medium">Or add directly</span>
          </div>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Friend's Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Priya Verma, Rohan Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g., priya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Add to Group</span>
          </button>
        </form>
      </div>
    </div>
  );
};
