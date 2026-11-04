import React, { useState, useMemo } from 'react';
import { Group, User, Expense, SplitType, ExpenseCategory } from '../../types';
import { calculateExpenseSplits } from '../../utils/debtEngine';
import { api } from '../../services/api';
import { 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2
} from 'lucide-react';

interface AddExpenseModalProps {
  group: Group;
  currentUser: User;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  group,
  currentUser,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paidById, setPaidById] = useState(currentUser.id);
  const [splitType, setSplitType] = useState<'equal' | 'exact'>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    group.members.map(m => m.id)
  );
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [showAiBar, setShowAiBar] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  const totalAmount = parseFloat(amountStr) || 0;

  const { splits: calculatedSplits, error: splitError } = useMemo(() => {
    return calculateExpenseSplits(totalAmount, splitType as SplitType, selectedParticipants, customValues);
  }, [totalAmount, splitType, selectedParticipants, customValues]);

  const handleParseAiPrompt = async (textToParse?: string) => {
    const text = textToParse || aiPrompt;
    if (!text.trim()) return;

    setIsAiLoading(true);
    setFormError(null);
    try {
      const json = await api.parseExpensePrompt(text, group.members, group.currency);
      if (json.success && json.data) {
        const d = json.data;
        setTitle(d.title || text);
        setAmountStr(d.amount ? d.amount.toString() : '1500');
        if (d.category) setCategory(d.category);
        if (d.paidById && group.members.some(m => m.id === d.paidById)) {
          setPaidById(d.paidById);
        }
        setSplitType('equal');
        if (d.participantIds && d.participantIds.length > 0) {
          const valid = d.participantIds.filter((id: string) => group.members.some(m => m.id === id));
          if (valid.length > 0) setSelectedParticipants(valid);
        }
        setAiFilled(true);
        setShowAiBar(false);
      }
    } catch (err) {
      console.error('AI parse error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || totalAmount <= 0) {
      setFormError('Please enter what this expense was for and a valid amount.');
      return;
    }
    if (splitError) {
      setFormError(splitError);
      return;
    }
    if (calculatedSplits.length === 0) {
      setFormError('Please select at least one person to split with.');
      return;
    }

    onSave({
      groupId: group.id,
      title: title.trim(),
      category,
      amount: totalAmount,
      paidById,
      splitType,
      splits: calculatedSplits,
      date: new Date().toISOString().split('T')[0],
      aiGenerated: aiFilled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Add Expense</h2>
            <p className="text-xs text-slate-400">Split a bill with {group.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiBar(!showAiBar)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition border border-emerald-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Auto-Fill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showAiBar && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="text-xs font-bold text-emerald-950">
              Type a sentence and AI will fill the form for you:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Maya paid 3200 for lunch for everyone"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-emerald-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                disabled={isAiLoading || !aiPrompt.trim()}
                onClick={() => handleParseAiPrompt()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Fill</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-emerald-700 font-semibold">Try:</span>
              <button
                type="button"
                onClick={() => handleParseAiPrompt('Maya paid 3200 for beach lunch for everyone')}
                className="text-[11px] bg-white hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 transition"
              >
                "Maya paid 3200 for beach lunch"
              </button>
              <button
                type="button"
                onClick={() => handleParseAiPrompt('Alex paid 2800 for airport taxi')}
                className="text-[11px] bg-white hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 transition"
              >
                "Alex paid 2800 for taxi"
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {(formError || (totalAmount > 0 && splitError)) && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError || splitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                What was it for?
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Dinner, Taxi, Groceries"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-medium bg-white"
              >
                <option value="Food">🍽️ Food</option>
                <option value="Stay">🏨 Stay</option>
                <option value="Travel">🚕 Travel</option>
                <option value="Activity">🤿 Activity</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Utilities">💡 Utilities</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              How much did it cost? ({group.symbol})
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

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Who paid the bill?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.members.map(m => {
                const isSelected = paidById === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidById(m.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                    <span className="truncate">{m.id === currentUser.id ? 'You' : m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                How to split it?
              </label>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-3 py-1 rounded-lg transition ${
                    splitType === 'equal'
                      ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Split Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('exact')}
                  className={`px-3 py-1 rounded-lg transition ${
                    splitType === 'exact'
                      ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Custom Amounts
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {group.members.map(member => {
                const isChecked = selectedParticipants.includes(member.id);
                const splitItem = calculatedSplits.find(s => s.userId === member.id);

                return (
                  <div
                    key={member.id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
                      isChecked ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/40 border-transparent opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants([...selectedParticipants, member.id]);
                          } else {
                            setSelectedParticipants(selectedParticipants.filter(id => id !== member.id));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                      <span>{member.name} {member.id === currentUser.id && '(You)'}</span>
                    </label>

                    {isChecked && (
                      <div className="flex items-center gap-2">
                        {splitType === 'equal' ? (
                          <span className="font-extrabold text-slate-900">
                            {group.symbol}{splitItem?.amount || 0}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">{group.symbol}</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={customValues[member.id] || ''}
                              onChange={(e) =>
                                setCustomValues({ ...customValues, [member.id]: parseFloat(e.target.value) || 0 })
                              }
                              className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 font-bold text-right bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Expense</span>
          </button>
        </form>
      </div>
    </div>
  );
};