import React, { useState, useEffect } from 'react';
import { Group, User, Expense, Settlement, SimplifiedDebt } from '../../types';
import { api } from '../../services/api';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface AiExplainerModalProps {
  group: Group;
  currentUser: User;
  expenses: Expense[];
  settlements: Settlement[];
  netBalances: Record<string, number>;
  simplifiedDebts: SimplifiedDebt[];
  onClose: () => void;
}

export const AiExplainerModal: React.FC<AiExplainerModalProps> = ({
  group,
  expenses,
  settlements,
  netBalances,
  simplifiedDebts,
  onClose,
}) => {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const data = await api.explainBalances({
        groupName: group.name,
        currencySymbol: group.symbol,
        expenses,
        settlements,
        netBalances,
        simplifiedDebts,
        members: group.members,
      });

      if (data.success && data.narrative) {
        setNarrative(data.narrative);
      }
    } catch (err) {
      console.error(err);
      setNarrative('Could not generate AI explanation. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanation();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">SplitMate AI Spending Story</h2>
              <p className="text-[11px] text-slate-400">Plain-language breakdown of who owes whom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Analyzing transactions and calculating narratives...</p>
              <p className="text-[11px] text-slate-400">Powered by Google Gemini Flash</p>
            </div>
          ) : (
            <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-100 text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {narrative}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={fetchExplanation}
            disabled={loading}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Analysis</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
