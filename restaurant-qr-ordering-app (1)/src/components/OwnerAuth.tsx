import React, { useState } from 'react';
import { db, doc, setDoc, getDoc } from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../lib/translations';
import { refreshAllRestaurantData, RefreshProgress } from '../lib/dataRefresher';
import { Lock, User, AlertCircle, Sparkles, Loader2, Utensils, Eye, EyeOff, KeyRound, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OwnerAuthProps {
  onAuthSuccess: (uid: string) => void;
}

export default function OwnerAuth({ onAuthSuccess }: OwnerAuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data Refresh Modal State
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgress | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const performLogin = async (userVal: string, passVal: string) => {
    setError('');
    setLoading(true);

    const normalizedUser = userVal.trim().toLowerCase();
    // Accept 'sushant' or 'admin' or 'owner' with password 'sushant'
    if ((normalizedUser === 'sushant' || normalizedUser === 'admin' || normalizedUser === 'owner') && passVal === 'sushant') {
      try {
        const ownerId = 'hotel_tara_owner';

        // Auto-initialize Hotel Tara configuration if it doesn't exist in Firestore
        const userDocRef = doc(db, 'users', ownerId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: ownerId,
            email: 'sushant@hoteltara.com',
            restaurantName: 'हॉटेल तारा (Hotel Tara)',
            ownerName: 'Sushant Kate',
            tagline: 'खानदेशी झणझणीत शेवभाजी व स्पेशल व्हेज',
            language: 'mr',
            categories: DEFAULT_CATEGORIES,
            adminUsername: 'sushant',
            adminPassword: 'sushant',
            createdAt: new Date().toISOString()
          });
        }

        // Persist session locally
        localStorage.setItem('hotel_tara_logged_in', 'true');
        
        // Notify app shell of success
        onAuthSuccess(ownerId);
      } catch (err: any) {
        console.error("Firestore initialization error:", err);
        setError('डेटाबेस जोडणी अयशस्वी झाली. कृपया इंटरनेट कनेक्शन तपासा.');
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setError('चुकीचे वापरकर्तानाव किंवा पासवर्ड! कृपया "sushant" वापरून पहा.');
        setLoading(false);
      }, 500);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleQuickDemoLogin = () => {
    setUsername('sushant');
    setPassword('sushant');
    performLogin('sushant', 'sushant');
  };

  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    const success = await refreshAllRestaurantData('hotel_tara_owner', (p) => {
      setRefreshProgress(p);
    });
    setIsRefreshing(false);
    if (success) {
      setTimeout(() => {
        setShowRefreshModal(false);
        setRefreshProgress(null);
      }, 1500);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex justify-center items-center gap-2 mb-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Utensils className="w-7 h-7" />
          </div>
        </motion.div>
        
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          हॉटेल तारा
        </h2>
        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Hotel Tara • QR Menu & Live Orders System
        </p>
        <p className="mt-1 text-xs text-slate-400">
          मालक व कर्मचाऱ्यांसाठी डिजिटल डॅशबोर्ड
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-7 px-5 shadow-xl border border-slate-100 rounded-3xl sm:px-8">
          
          {/* Credentials Banner for Client Demo */}
          <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                <KeyRound className="w-4 h-4 text-orange-600" />
                लॉगिन पासवर्ड (Passkey)
              </span>
              <span className="text-[10px] font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                Client Demo Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white/80 p-2 rounded-xl border border-amber-100 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Username</span>
                <code className="text-orange-700 font-black text-xs">sushant</code>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Password</span>
                <code className="text-orange-700 font-black text-xs">sushant</code>
              </div>
            </div>

            {/* 1-Click Quick Demo Button */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="mt-2.5 w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>१-क्लिक ऑटो लॉगिन (1-Click Demo Sign In)</span>
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs flex items-start gap-2.5 rounded-r-xl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                वापरकर्तानाव (Username)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all"
                  placeholder="उदा. sushant"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                पासवर्ड (Password)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all"
                  placeholder="उदा. sushant"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-black tracking-wider uppercase text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 active:scale-[0.98] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>लॉगिन होत आहे...</span>
                  </>
                ) : (
                  <>
                    <span>डॅशबोर्डमध्ये प्रवेश करा (Sign In)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Actions Separator */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-slate-400">किंवा थेट पर्यायी मार्ग (Or)</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Direct Customer Menu Preview */}
            <a
              href="?table=1&restaurantId=hotel_tara_owner"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-orange-50/50 text-slate-700 hover:text-orange-700 text-xs font-bold transition-all flex items-center justify-center gap-2 text-center"
            >
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>🍽️ ग्राहक मेनू पाहा (Preview Customer QR Menu)</span>
            </a>

            {/* Refresh All Data Button */}
            <button
              type="button"
              onClick={() => setShowRefreshModal(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-orange-400 bg-white hover:bg-orange-50/30 text-slate-600 hover:text-orange-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
              <span>🔄 संपूर्ण डेटा रिफ्रेश करा (Refresh All Data)</span>
            </button>
          </div>

        </div>
      </motion.div>

      {/* Refresh Data Modal */}
      <AnimatePresence>
        {showRefreshModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    सर्व डेटा रिफ्रेश करा (Refresh All Data)
                  </h3>
                  <p className="text-xs text-slate-400">
                    हॉटेल तारा साठी ताज्या अधिकृत मेनू, टेबल व ऑर्डर्स रीलोड करा
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 leading-relaxed">
                <p>या क्रियेमुळे खालील गोष्टी आपोआप तयार होतील:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 font-medium">
                  <li>हॉटेल तारा अधिकृत प्रोफाइल व ब्रँडिंग माहिती</li>
                  <li>सर्व ७५+ मराठी खाद्यपदार्थ (खानदेशी शेवभाजी, कढई पनीर, इ.) योग्य किमतीसह</li>
                  <li>टेबल १ ते १० चे स्कॅन करता येणारे डिजिटल क्यूआर कोड</li>
                  <li>किचन डिस्प्लेसाठी ताजी डेमो ऑर्डर स्थिती</li>
                </ul>
              </div>

              {refreshProgress && (
                <div className="mb-5 bg-orange-50 border border-orange-200 p-3 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    {refreshProgress.status === 'running' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-600 shrink-0" />
                    ) : refreshProgress.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-800">
                      टप्पा {refreshProgress.step} / {refreshProgress.totalSteps}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium pl-6">
                    {refreshProgress.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => setShowRefreshModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleTriggerRefresh}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black hover:from-orange-700 hover:to-amber-700 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>रिफ्रेश सुरू आहे...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>होय, रिफ्रेश करा (Start)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-[11px] text-slate-400 font-medium">
        © {new Date().getFullYear()} हॉटेल तारा (Hotel Tara). सर्व हक्क सुरक्षित.
      </div>
    </div>
  );
}
