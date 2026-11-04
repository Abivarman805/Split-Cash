import React, { useState } from 'react';
import { Group, User } from '../types';
import { 
  Users, 
  Plus, 
  ChevronDown, 
  Settings,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  groups: Group[];
  activeGroup: Group;
  onSelectGroup: (group: Group) => void;
  onOpenNewGroup: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onOpenProfile: () => void;
  onOpenInvite: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onOpenNewGroup,
  users,
  currentUser,
  onSelectUser,
  onOpenProfile,
  onOpenInvite,
  onSignOut,
}) => {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-500/25 shadow-md text-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Group Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <span className="font-extrabold text-base tracking-tighter">SM</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white hidden sm:inline">
              Split<span className="text-emerald-400">Mate</span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Group Dropdown Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowGroupMenu(!showGroupMenu);
                setShowUserMenu(false);
              }}
              aria-label={`Switch group, currently viewing ${activeGroup.name}`}
              aria-expanded={showGroupMenu}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 transition text-white text-sm font-bold border border-slate-700"
            >
              <span className="line-clamp-1 max-w-[140px] sm:max-w-[200px]">{activeGroup.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30 hidden sm:inline">
                {activeGroup.symbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </button>

            {showGroupMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-slate-800">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Group
                </div>
                {groups.map(grp => (
                  <button
                    key={grp.id}
                    onClick={() => {
                      onSelectGroup(grp);
                      setShowGroupMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-emerald-50/50 transition text-sm ${
                      grp.id === activeGroup.id ? 'font-bold text-emerald-700 bg-emerald-50/80' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="truncate">{grp.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {grp.members.length} members • {grp.currency} ({grp.symbol})
                      </div>
                    </div>
                    {grp.id === activeGroup.id && (
                      <span className="text-emerald-600 text-xs font-bold">Active</span>
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      onOpenNewGroup();
                      setShowGroupMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>New Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Invite Button (Fixed with accessible aria-label) */}
          <button
            onClick={onOpenInvite}
            aria-label="Add Friend"
            title="Add Friend"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-100 hover:bg-slate-700 transition"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="hidden sm:inline">Add Friend</span>
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowGroupMenu(false);
              }}
              aria-label={`User menu for ${currentUser.name}`}
              aria-expanded={showUserMenu}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 transition border border-slate-700"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/50"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white line-clamp-1">{currentUser.name.split(' ')[0]}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">Viewing as</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-slate-800">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  View App As
                </div>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-emerald-50/50 transition ${
                      u.id === currentUser.id ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200" />
                    <div className="truncate flex-1 text-xs">
                      <div>{u.name}</div>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1 pt-1 px-1">
                  <button
                    onClick={() => {
                      onOpenProfile();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};