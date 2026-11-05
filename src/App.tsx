import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Group, 
  User, 
  Expense, 
  Settlement
} from './types';
import { calculateNetBalances, simplifyDebts } from './utils/debtEngine';
import { supabase } from './services/supabaseClient';
import { Navbar } from './components/Navbar';
import { HeroBalanceCard } from './components/HeroBalanceCard';
import { MemberPills } from './components/MemberPills';
import { ExpenseList } from './components/ExpenseList';
import { BalancesView } from './components/BalancesView';
import { SettlementHistory } from './components/SettlementHistory';

// Modals
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { SettleUpModal } from './components/modals/SettleUpModal';
import { AiExplainerModal } from './components/modals/AiExplainerModal';
import { NewGroupModal } from './components/modals/NewGroupModal';
import { InviteMemberModal } from './components/modals/InviteMemberModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { LoginPage3D } from './components/LoginPage3D';

import { 
  Receipt, 
  Handshake, 
  History,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share,
  X,
  Sparkles
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {deferredPrompt && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Install SplitMate</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/30 transition min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              aria-label="Dismiss install prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isIos && !deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {!showIosTip ? (
            <button
              onClick={() => setShowIosTip(true)}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Install on iPhone</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-extrabold">Tap to see how →</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Share className="w-3.5 h-3.5" />
                  <span>Install on iOS Safari:</span>
                </span>
                <button onClick={() => setShowIosTip(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                1. Tap the <strong>Share</strong> button in Safari's toolbar.<br />
                2. Scroll down and tap <strong>"Add to Home Screen"</strong>.<br />
                3. Open SplitMate from your home screen for full-screen mode!
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Clean state: ZERO dummy data
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    name: 'User',
    email: '',
    avatar: '',
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(false);
  const [expenseFetchError, setExpenseFetchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements'>('expenses');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleInitialData, setSettleInitialData] = useState<{
    payerId: string;
    receiverId: string;
    amount: number;
  } | null>(null);
  const [showAiExplainer, setShowAiExplainer] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const mapDbExpense = (row: any): Expense => ({
    id: row.id,
    groupId: row.group_id || 'grp_personal',
    userId: row.user_id,
    title: row.title || row.description || 'Expense',
    category: row.category || 'Food',
    amount: Number(row.amount),
    paidById: row.user_id,
    splitType: row.split_type || 'equal',
    splits: typeof row.splits === 'string' ? JSON.parse(row.splits) : (row.splits || []),
    date: row.date || row.expense_date || new Date().toISOString().split('T')[0],
    notes: row.notes || undefined,
    createdAt: row.created_at,
  });

  // Load authenticated user's profile, groups, and expenses from Supabase
  const loadUserData = useCallback(async (userId: string, email: string, metadataName?: string) => {
    setIsLoadingExpenses(true);
    setExpenseFetchError(null);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const userObj: User = {
        id: userId,
        name: profile?.username || metadataName || email.split('@')[0],
        email: email,
        avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}`,
        color: profile?.color || '#059669',
      };
      setCurrentUser(userObj);

      const personalGroupId = 'grp_' + userId.slice(0, 8);
      const personalGroup: Group = {
        id: personalGroupId,
        name: 'My Expenses',
        description: 'Personal & Shared expenses',
        currency: 'INR',
        symbol: '₹',
        createdAt: new Date().toISOString().split('T')[0],
        members: [userObj],
      };

      setGroups([personalGroup]);
      setActiveGroupId(personalGroupId);
      setUsers([userObj]);

      // Fetch ONLY this user's expenses (enforced by RLS user_id = auth.uid() AND explicit filter)
      const { data: dbExpenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (expError) throw expError;

      if (dbExpenses && Array.isArray(dbExpenses)) {
        setExpenses(dbExpenses.map(mapDbExpense));
      } else {
        setExpenses([]);
      }
    } catch (err: any) {
      console.error('Error loading user expenses:', err);
      setExpenseFetchError(err.message || 'Failed to load expenses from Supabase.');
    } finally {
      setIsLoadingExpenses(false);
    }
  }, []);

  // Session restoration & auth state listener
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await loadUserData(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.name
          );
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Session check error:', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && mounted) {
          await loadUserData(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.name
          );
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT' && mounted) {
          // Ends session in memory; never deletes database rows
          setIsAuthenticated(false);
          setExpenses([]);
          setSettlements([]);
          setGroups([]);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [loadUserData]);

  const activeGroup: Group = useMemo(() => {
    return groups.find(g => g.id === activeGroupId) || groups[0] || {
      id: 'grp_default',
      name: 'My Expenses',
      description: 'Personal & Shared expenses',
      currency: 'INR',
      symbol: '₹',
      members: [currentUser],
      createdAt: new Date().toISOString().split('T')[0],
    };
  }, [groups, activeGroupId, currentUser]);

  const currentGroupExpenses = useMemo(() => {
    if (groups.length <= 1) return expenses;
    return expenses.filter(e => e.groupId === activeGroup.id);
  }, [expenses, activeGroup.id, groups.length]);

  const { netBalances, simplifiedDebts } = useMemo(() => {
    const nets = calculateNetBalances(activeGroup.members || [], currentGroupExpenses, settlements);
    const debts = simplifyDebts(activeGroup.members || [], nets);
    return { netBalances: nets, simplifiedDebts: debts };
  }, [activeGroup.members, currentGroupExpenses, settlements]);

  const currentUserNet = netBalances[currentUser.id] || 0;

  // Save Expense in Supabase associated with authenticated user's ID
  const handleSaveExpense = async (newExpData: Omit<Expense, 'id' | 'createdAt'>): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to save an expense.');
    }

    const newId = `exp_${Date.now()}`;
    const expenseDate = newExpData.date || new Date().toISOString().split('T')[0];

    const dbPayload = {
      id: newId,
      user_id: user.id,
      paid_by_id: user.id,
      group_id: activeGroup.id,
      title: newExpData.title.trim(),
      description: newExpData.title.trim(),
      amount: newExpData.amount,
      category: newExpData.category,
      date: expenseDate,
      expense_date: expenseDate,
      split_type: newExpData.splitType || 'equal',
      splits: newExpData.splits || [],
      notes: newExpData.notes || null,
    };

    const { data: insertedRecord, error: insertError } = await supabase
      .from('expenses')
      .insert(dbPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(insertError.message || 'Failed to save expense to Supabase.');
    }

    const confirmedExpense = mapDbExpense(insertedRecord);
    setExpenses(prev => [confirmedExpense, ...prev.filter(e => e.id !== confirmedExpense.id)]);
    showNotification(`Saved "${confirmedExpense.title}" to your account.`);
    return true;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', user.id);

    if (deleteError) {
      alert(`Could not delete expense: ${deleteError.message}`);
      return;
    }

    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    showNotification('Expense deleted.');
  };

  const handleCreateGroup = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);
    setShowNewGroupModal(false);
  };

  const handleAddMemberToActiveGroup = (newMember: User) => {
    if (!users.some(u => u.id === newMember.id)) {
      setUsers(prev => [...prev, newMember]);
    }
    setGroups(prev =>
      prev.map(grp =>
        grp.id === activeGroup.id
          ? { ...grp, members: [...grp.members, newMember] }
          : grp
      )
    );
    setShowInviteModal(false);
  };

  // Sign Out: Only ends session, never deletes saved accounts or expenses
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setIsAuthenticated(false);
    setExpenses([]);
    setSettlements([]);
    setGroups([]);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#060f14] text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs font-semibold text-slate-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage3D
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadUserData(user.id, user.email, user.name);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-slate-100 to-slate-200/70 text-slate-800 flex flex-col font-sans pb-12">
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={(grp) => {
          setActiveGroupId(grp.id);
          setSelectedMemberFilter(null);
        }}
        onOpenNewGroup={() => setShowNewGroupModal(true)}
        users={[currentUser]}
        currentUser={currentUser}
        onSelectUser={() => {}}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenInvite={() => setShowInviteModal(true)}
        onSignOut={handleSignOut}
      />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
        {expenseFetchError && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{expenseFetchError}</span>
            </div>
            <button
              onClick={() => loadUserData(currentUser.id, currentUser.email, currentUser.name)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <HeroBalanceCard
          group={activeGroup}
          currentUser={currentUser}
          netBalance={currentUserNet}
          expenses={currentGroupExpenses}
          simplifiedDebtsCount={simplifiedDebts.length}
          onOpenAddExpense={() => setShowAddModal(true)}
          onOpenSettleUp={() => {
            setSettleInitialData(null);
            setShowSettleModal(true);
          }}
          onViewBalances={() => setActiveTab('balances')}
          onOpenAiExplainer={() => setShowAiExplainer(true)}
        />

        <div className="pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Group Members:
          </div>
          <MemberPills
            group={activeGroup}
            currentUser={currentUser}
            netBalances={netBalances}
            onOpenInvite={() => setShowInviteModal(true)}
            onSelectMemberFilter={(uid) => setSelectedMemberFilter(uid)}
            selectedMemberId={selectedMemberFilter}
          />
        </div>

        {/* 3 Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Expenses ({currentGroupExpenses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('balances')}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'balances'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Handshake className="w-4 h-4" />
              <span>Who Pays Whom ({simplifiedDebts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settlements')}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'settlements'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Paid History ({settlements.length})</span>
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'expenses' && (
            isLoadingExpenses ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Loading your expenses from Supabase...</p>
              </div>
            ) : (
              <ExpenseList
                group={activeGroup}
                currentUser={currentUser}
                expenses={currentGroupExpenses}
                onDeleteExpense={handleDeleteExpense}
                selectedMemberFilter={selectedMemberFilter}
                onClearMemberFilter={() => setSelectedMemberFilter(null)}
              />
            )
          )}

          {activeTab === 'balances' && (
            <BalancesView
              group={activeGroup}
              currentUser={currentUser}
              simplifiedDebts={simplifiedDebts}
              netBalances={netBalances}
              expenses={currentGroupExpenses}
              onInitiateSettlement={() => {}}
              onOpenAiExplainer={() => setShowAiExplainer(true)}
            />
          )}

          {activeTab === 'settlements' && (
            <SettlementHistory
              group={activeGroup}
              currentUser={currentUser}
              settlements={settlements}
              onOpenSettleUp={() => {
                setSettleInitialData(null);
                setShowSettleModal(true);
              }}
            />
          )}
        </div>
      </main>

      {showAddModal && (
        <AddExpenseModal
          group={activeGroup}
          currentUser={currentUser}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveExpense}
        />
      )}

      {showSettleModal && (
        <SettleUpModal
          group={activeGroup}
          currentUser={currentUser}
          initialData={settleInitialData}
          onClose={() => {
            setShowSettleModal(false);
            setSettleInitialData(null);
          }}
          onSave={() => {}}
        />
      )}

      {showAiExplainer && (
        <AiExplainerModal
          group={activeGroup}
          currentUser={currentUser}
          expenses={currentGroupExpenses}
          settlements={settlements}
          netBalances={netBalances}
          simplifiedDebts={simplifiedDebts}
          onClose={() => setShowAiExplainer(false)}
        />
      )}

      {showNewGroupModal && (
        <NewGroupModal
          availableUsers={users}
          currentUser={currentUser}
          onClose={() => setShowNewGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          group={activeGroup}
          onClose={() => setShowInviteModal(false)}
          onAddMember={handleAddMemberToActiveGroup}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          currentUser={currentUser}
          users={users}
          groups={groups}
          onSelectUser={() => {}}
          onUpdateCurrentUser={async (updated) => {
            setCurrentUser(prev => ({ ...prev, ...updated }));
            try {
              await supabase
                .from('profiles')
                .update({ username: updated.name })
                .eq('id', currentUser.id);
            } catch {}
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      <PwaInstallBanner />
    </div>
  );
}