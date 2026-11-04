import React, { useState } from 'react';
import { Group, User, Expense, Settlement, SimplifiedDebt } from '../../types';
import { 
  X, 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AiThinkingAuditModalProps {
  group: Group;
  currentUser: User;
  expenses: Expense[];
  settlements: Settlement[];
  netBalances: Record<string, number>;
  simplifiedDebts: SimplifiedDebt[];
  onClose: () => void;
}

export const AiThinkingAuditModal: React.FC<AiThinkingAuditModalProps> = ({
  group,
  currentUser,
  expenses,
  settlements,
  netBalances,
  simplifiedDebts,
  onClose,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [thinkingDetails, setThinkingDetails] = useState<{ model: string; mode: string } | null>(null);

  const PRESET_QUERIES = [
    `Ravi wants to leave a day early. How should the Villa stay (₹24,000) and Scuba diving (₹9,000) be fairly recalculated without double-charging?`,
    `Audit our group liquidity: Alex fronted the Villa upfront. Are there spending inequities or cash flow burdens that need balancing?`,
    `Verify mathematical invariants: Confirm that debt minimization preserves every member's exact net balance with zero error.`,
  ];

  const handleRunAudit = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);

    const groupContext = {
      groupName: group.name,
      currency: `${group.currency} (${group.symbol})`,
      members: group.members.map(m => ({ id: m.id, name: m.name })),
      totalSpend: expenses.reduce((a, b) => a + b.amount, 0),
      expenses: expenses.map(e => ({
        title: e.title,
        amount: e.amount,
        paidBy: group.members.find(m => m.id === e.paidById)?.name,
        splitType: e.splitType,
        splits: e.splits.map(s => ({
          name: group.members.find(m => m.id === s.userId)?.name,
          amount: s.amount,
        })),
      })),
      settlements: settlements.map(s => ({
        payer: group.members.find(m => m.id === s.payerId)?.name,
        receiver: group.members.find(m => m.id === s.receiverId)?.name,
        amount: s.amount,
        method: s.method,
      })),
      netBalances,
      simplifiedDebts: simplifiedDebts.map(d => ({
        from: group.members.find(m => m.id === d.from)?.name,
        to: group.members.find(m => m.id === d.to)?.name,
        amount: d.amount,
      })),
    };

    try {
      const res = await fetch('/api/ai/complex-settlement-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: q,
          groupContext,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setResult(data.analysis);
        setThinkingDetails({ model: data.model, mode: data.thinkingMode });
      }
    } catch (err) {
      console.error(err);
      setResult('Failed to run audit analysis. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Financial Dispute & Audit Engine
                </h2>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span>🧠</span> Thinking Mode HIGH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Powered by <strong className="text-slate-600">Gemini 4 Argon</strong> with maximum reasoning depth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Introduction */}
        <div className="my-3 text-xs text-slate-600 leading-relaxed bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
          Have a complicated dispute, early departure, multi-currency twist, or fairness disagreement? Thinking mode breaks down the mathematics, checks conservation of debt, and returns a verified resolution plan.
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ask any complex settlement or fairness query:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., If Ravi leaves a day early, what is the fair adjustment?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
              <button
                onClick={() => handleRunAudit()}
                disabled={loading || !question.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Analyze</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Queries */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Or analyze common complex dilemmas:
            </span>
            <div className="space-y-1.5">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(preset);
                    handleRunAudit(preset);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 transition flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{preset}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Box */}
        {loading && (
          <div className="my-6 p-8 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-center space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-slate-800">
              Thinking deeply with Gemini 4 Argon...
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Evaluating mathematical constraints, checking bipartite debt conservation, and building step-by-step fairness audit...
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="my-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span>Reasoning Model: {thinkingDetails?.model || 'gemini-4-argon'}</span>
              <span className="text-emerald-600 font-bold">Level: {thinkingDetails?.mode || 'HIGH'}</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 text-xs leading-relaxed space-y-3 font-sans whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
