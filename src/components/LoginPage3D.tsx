import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { VaultScene } from './three/VaultScene';
import { supabase } from '../services/supabaseClient';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RotateCw, 
  UserPlus, 
  User as UserIcon,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface LoginPage3DProps {
  availableUsers: User[];
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'signin' | 'register';

export const LoginPage3D: React.FC<LoginPage3DProps> = ({
  onLoginSuccess,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<VaultScene | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3D Tilt
  const [tiltX, setTiltX] = useState(2);
  const [tiltY, setTiltY] = useState(-3);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setTiltX(-((y - centerY) / centerY) * 8);
    setTiltY(((x - centerX) / centerX) * 8);
    setGlarePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
      opacity: 0.85,
    });
    setIsCardHovered(true);
  };

  const handleCardMouseLeave = () => {
    setIsCardHovered(false);
    setTiltX(2);
    setTiltY(-3);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  useEffect(() => {
    if (!canvasMountRef.current) return;
    let scene: VaultScene | null = null;
    try {
      scene = new VaultScene(canvasMountRef.current);
      sceneRef.current = scene;
    } catch {
      sceneRef.current = null;
    }

    return () => {
      try {
        scene?.dispose();
      } catch {}
      sceneRef.current = null;
    };
  }, []);

  const triggerUnlockAndLogin = (userToLogin: User) => {
    if (sceneRef.current) {
      sceneRef.current.unlockVault(() => {
        onLoginSuccess(userToLogin);
      });
    } else {
      onLoginSuccess(userToLogin);
    }
  };

  // 1. SUPABASE AUTH: Sign In with permanent credentials
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    sceneRef.current?.spinDial(Math.PI * 1.5);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Retrieve display profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const userObj: User = {
          id: data.user.id,
          name: profile?.username || data.user.user_metadata?.username || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.user.id)}`,
          color: profile?.color || '#059669',
        };

        triggerUnlockAndLogin(userObj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. SUPABASE AUTH: Create new permanent account in auth.users
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    sceneRef.current?.spinDial(Math.PI * 2);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const userObj: User = {
          id: data.user.id,
          name: cleanUsername,
          email: cleanEmail,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
          color: '#059669',
        };

        triggerUnlockAndLogin(userObj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-[#060f14] font-sans"
      style={{
        background: 'radial-gradient(circle at 30% 50%, #0d2b24 0%, #071318 55%, #040b0e 100%)',
      }}
    >
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Brand Header */}
      <div className="absolute top-4 left-4 sm:left-6 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-white shadow-xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-600/30">
            SM
          </div>
          <div>
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>Split<span className="text-emerald-400">Mate</span></span>
            </div>
            <div className="text-[10px] text-slate-400">Powered by Supabase Auth</div>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div 
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-full max-w-[420px] max-h-[92vh] overflow-y-auto no-scrollbar pointer-events-auto"
        style={{ perspective: '1400px' }}
      >
        <div 
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="relative rounded-3xl p-6 sm:p-7 text-white shadow-2xl overflow-hidden cursor-default backdrop-blur-xl"
          style={{
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${isCardHovered ? 16 : 0}px)`,
            transformStyle: 'preserve-3d',
            transition: isCardHovered ? 'transform 0.08s ease-out' : 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.90) 0%, rgba(9, 16, 28, 0.96) 100%)',
            border: isCardHovered ? '1px solid rgba(16, 185, 129, 0.50)' : '1px solid rgba(16, 185, 129, 0.28)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200 rounded-3xl z-10"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle 340px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.18) 0%, transparent 70%)`,
            }}
          />

          <div className="relative z-20">
            <div className="pb-3 border-b border-slate-800">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                {authMode === 'signin' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Supabase Auth Login</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    <span>Create Your Account</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanent user IDs • Isolated private expenses
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/90 rounded-xl my-4 text-xs font-bold text-center border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition ${
                  authMode === 'signin' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition ${
                  authMode === 'register' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In & Restore Expenses</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Name / Username</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      required
                      placeholder="alex_rivera"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950/90 border border-slate-800 focus:border-emerald-400 focus:outline-none text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Create Vault</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};