import React, { useEffect, useState } from 'react';
import { Download, Share, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone PWA mode
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    // 2. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Listen for Android / Chrome install prompt
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

  // Do not show if already running as installed app or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Trigger Chrome/Android Native Install Dialog
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
      {/* 1. Android / Desktop Chrome Custom Install Button */}
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

      {/* 2. iOS Safari Install Helper Tip */}
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
                1. Tap the <strong>Share</strong> button <Share className="inline w-3 h-3 text-emerald-400" /> in Safari's toolbar.<br />
                2. Scroll down and tap <strong>"Add to Home Screen"</strong>.<br />
                3. Open SplitMate from your home screen for full-screen mode!
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};