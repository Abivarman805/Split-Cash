import React, { useState } from 'react';
import { Group, User, Expense, ExpenseCategory } from '../types';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Trash2, 
  Calendar, 
  Layers, 
  FileText,
  Filter
} from 'lucide-react';

interface ExpenseListProps {
  group: Group;
  currentUser: User;
  expenses: Expense[];
  onDeleteExpense: (expenseId: string) => void;
  selectedMemberFilter?: string | null;
  onClearMemberFilter?: () => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Stay: '🏨',
  Food: '🍽️',
  Travel: '🚕',
  Activity: '🤿',
  Shopping: '🛍️',
  Utilities: '💡',
  Other: '📦',
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  group,
  currentUser,
  expenses,
  onDeleteExpense,
  selectedMemberFilter,
  onClearMemberFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ['All', 'Food', 'Stay', 'Travel', 'Activity', 'Shopping', 'Utilities', 'Other'];

  const filteredExpenses = expenses.filter(exp => {
    // Search match
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category match
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

    // Member filter match
    const matchesMember = !selectedMemberFilter ||
      exp.paidById === selectedMemberFilter ||
      exp.splits.some(s => s.userId === selectedMemberFilter);

    return matchesSearch && matchesCategory && matchesMember;
  });

  const getUser = (id: string) => group.members.find(m => m.id === id) || { name: 'Unknown', avatar: '' };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses, notes, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-2xs"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Member Filter Alert if Active */}
      {selectedMemberFilter && (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
          <span>
            Filtered by member: <strong>{getUser(selectedMemberFilter).name}</strong>
          </span>
          <button
            onClick={onClearMemberFilter}
            className="font-bold underline hover:text-emerald-950"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Expense List Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
          <div className="text-4xl mb-2">🧾</div>
          <p className="font-bold text-slate-700">No expenses found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const payer = getUser(expense.paidById);
            const userSplit = expense.splits.find(s => s.userId === currentUser.id);
            const isPayer = expense.paidById === currentUser.id;
            const isExpanded = expandedId === expense.id;

            return (
              <div
                key={expense.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 transition shadow-xs overflow-hidden"
              >
                {/* Main Visible Strip */}
                <div 
                  onClick={() => toggleExpand(expense.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                      {CATEGORY_ICONS[expense.category] || '📦'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {expense.title}
                        </h3>
                        {expense.aiGenerated && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5" /> AI Parsed
                          </span>
                        )}
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                          Split: {expense.splitType}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          <strong className="text-slate-800">{payer.name}</strong> paid{' '}
                          <strong>{group.symbol}{expense.amount.toLocaleString()}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {expense.date}
                        </span>
                      </div>

                      {/* Participants Avatars Strip */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-400">Shared by:</span>
                        <div className="flex -space-x-1.5 overflow-hidden items-center">
                          {expense.splits.map(s => {
                            const m = getUser(s.userId);
                            return (
                              <img
                                key={s.userId}
                                src={m.avatar}
                                alt={m.name}
                                title={`${m.name}: ${group.symbol}${s.amount}`}
                                className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                              />
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({expense.splits.length} people)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount & User Status */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <div className="text-base sm:text-lg font-extrabold text-slate-900">
                      {group.symbol}{expense.amount.toLocaleString()}
                    </div>

                    <div className="text-xs mt-1 font-semibold">
                      {isPayer ? (
                        <span className="text-emerald-600">
                          You lent {group.symbol}{(expense.amount - (userSplit ? userSplit.amount : 0)).toLocaleString()}
                        </span>
                      ) : userSplit ? (
                        <span className="text-rose-600">
                          You borrowed {group.symbol}{userSplit.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not involved</span>
                      )}
                    </div>

                    <button 
                      className="mt-2 text-slate-400 hover:text-slate-700 flex items-center gap-0.5 text-xs font-semibold"
                      aria-label="Toggle details"
                    >
                      <span>{isExpanded ? 'Less' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Split Breakdown Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100 p-4 sm:p-5 text-xs text-slate-700 animate-in fade-in duration-200">
                    <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Itemized Split Shares ({expense.splitType}):</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Total {group.symbol}{expense.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {expense.splits.map(s => {
                        const m = getUser(s.userId);
                        return (
                          <div
                            key={s.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                              <span className="font-semibold text-slate-800">
                                {m.name} {s.userId === currentUser.id && '(You)'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">
                                {group.symbol}{s.amount.toLocaleString()}
                              </div>
                              {s.percentage !== undefined && (
                                <div className="text-[10px] text-slate-400">{s.percentage}% share</div>
                              )}
                              {s.shares !== undefined && (
                                <div className="text-[10px] text-slate-400">{s.shares} share(s)</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {expense.notes && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-slate-600">
                        <div className="font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" /> Notes:
                        </div>
                        <p>{expense.notes}</p>
                      </div>
                    )}

                    {/* Receipt Items breakdown if present */}
                    {expense.receiptData?.items && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-800 mb-1.5">
                          🧾 Receipt Items ({expense.receiptData.merchant}):
                        </div>
                        <div className="divide-y divide-slate-100">
                          {expense.receiptData.items.map((item, idx) => (
                            <div key={idx} className="py-1 flex justify-between text-[11px]">
                              <span>{item.name}</span>
                              <span className="font-semibold">{group.symbol}{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Added on {new Date(expense.createdAt).toLocaleString()}
                      </div>

                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Expense</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
