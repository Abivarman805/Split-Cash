import React from 'react';
import { Group, User, ActivityItem } from '../types';
import { Clock, PlusCircle, Handshake, Users, ShieldCheck } from 'lucide-react';

interface ActivityTimelineProps {
  group: Group;
  currentUser: User;
  activities: ActivityItem[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  group,
  activities,
}) => {
  const getUser = (id: string) => group.members.find(m => m.id === id) || { name: 'Someone', avatar: '' };

  const getActionIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'expense_added':
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case 'settlement_recorded':
        return <Handshake className="w-4 h-4 text-teal-600" />;
      case 'member_joined':
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Group Audit Trail & Activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent event log for all group expenses and ledger updates.
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audit Log</span>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {activities.map((act) => {
          const actor = getUser(act.actorId);
          return (
            <div key={act.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50/70 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getActionIcon(act.type)}
              </div>
              <div className="flex-1 text-xs">
                <div className="text-slate-800">
                  <span className="font-bold text-slate-900">{actor.name}</span> {act.description}
                  {act.amount && (
                    <span className="font-bold text-slate-900 ml-1">
                      ({act.currency || group.symbol}{act.amount.toLocaleString()})
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(act.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
