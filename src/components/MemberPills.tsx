import React from 'react';
import { Group, User } from '../types';
import { UserPlus } from 'lucide-react';

interface MemberPillsProps {
  group: Group;
  currentUser: User;
  netBalances: Record<string, number>;
  onOpenInvite: () => void;
  onSelectMemberFilter?: (userId: string | null) => void;
  selectedMemberId?: string | null;
}

export const MemberPills: React.FC<MemberPillsProps> = ({
  group,
  currentUser,
  netBalances,
  onOpenInvite,
  onSelectMemberFilter,
  selectedMemberId,
}) => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
      {group.members.map(member => {
        const balance = Math.round((netBalances[member.id] || 0) * 100) / 100;
        const isUser = member.id === currentUser.id;
        const isSelected = selectedMemberId === member.id;

        return (
          <button
            key={member.id}
            onClick={() => onSelectMemberFilter && onSelectMemberFilter(isSelected ? null : member.id)}
            className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition text-left ${
              isSelected
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs'
            }`}
          >
            <div className="relative">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-100"
              />
              {isUser && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 line-clamp-1">
                  {member.name.split(' ')[0]} {isUser && '(You)'}
                </span>
              </div>
              <div
                className={`text-[11px] font-bold ${
                  balance > 0.01
                    ? 'text-emerald-600'
                    : balance < -0.01
                    ? 'text-rose-600'
                    : 'text-slate-400'
                }`}
              >
                {balance > 0.01
                  ? `+${group.symbol}${balance.toLocaleString()}`
                  : balance < -0.01
                  ? `-${group.symbol}${Math.abs(balance).toLocaleString()}`
                  : 'Settled'}
              </div>
            </div>
          </button>
        );
      })}

      {/* Invite Member Pill */}
      <button
        onClick={onOpenInvite}
        className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 transition text-slate-600 hover:text-emerald-700 text-xs font-bold"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600">
          <UserPlus className="w-4 h-4" />
        </div>
        <span>+ Invite</span>
      </button>
    </div>
  );
};
