import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../lib/firebase';
import { Settings, Shield, Globe, Check, Loader2, Info, Upload, KeyRound, RefreshCw, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { Language, RestaurantOwner } from '../types';
import { refreshAllRestaurantData, RefreshProgress } from '../lib/dataRefresher';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPanelProps {
  ownerId: string;
  onLanguageChanged?: (lang: Language) => void;
}

// Preset logos that look gorgeous
const LOGO_PRESETS = [
  { name: 'Hotel Tara Heritage', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80' },
  { name: 'Classic Chef', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80' },
  { name: 'Organic / Veg Special', url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&auto=format&fit=crop&q=80' },
  { name: 'Khandeshi Tadka', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80' }
];

export default function SettingsPanel({ ownerId, onLanguageChanged }: SettingsPanelProps) {
  const [profile, setProfile] = useState<RestaurantOwner | null>(null);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [restaurantName, setRestaurantName] = useState('हॉटेल तारा');
  const [logoUrl, setLogoUrl] = useState('');
  const [language, setLanguage] = useState<Language>('mr');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [tagline, setTagline] = useState('खानदेशी झणझणीत शेवभाजी व स्पेशल व्हेज');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('हॉटेल तारा, मुख्य रस्ता, बस स्थानकाजवळ');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Full Refresh Data Modal state
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgress | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const docRef = doc(db, 'users', ownerId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setProfile(data);
        setRestaurantName(data.restaurantName || 'हॉटेल तारा');
        setLogoUrl(data.logoUrl || '');
        setLanguage(data.language || 'mr');
        setCustomBaseUrl(data.customBaseUrl || '');
        if (data.tagline) setTagline(data.tagline);
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [ownerId]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const docRef = doc(db, 'users', ownerId);
      await setDoc(docRef, {
        restaurantName: restaurantName.trim(),
        logoUrl: logoUrl.trim(),
        language,
        customBaseUrl: customBaseUrl.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage('सेटिंग्ज यशस्वीरित्या सेव्ह झाल्या! (Settings updated successfully!)');
      
      if (onLanguageChanged) {
        onLanguageChanged(language);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError('सेटिंग्ज अपडेट करताना त्रुटी आली.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerFullRefresh = async () => {
    setIsRefreshing(true);
    const success = await refreshAllRestaurantData(ownerId, (p) => {
      setRefreshProgress(p);
    });
    setIsRefreshing(false);
    if (success) {
      await fetchProfile();
      setTimeout(() => {
        setShowRefreshModal(false);
        setRefreshProgress(null);
        setMessage('संपूर्ण रेस्टॉरंट डेटा (मेनू, टेबल १-१०, ब्रँडिंग, ऑर्डर्स) यशस्वीरित्या रिफ्रेश झाला!');
      }, 1500);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-150 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          <span>रेस्टॉरंट ब्रँडिंग व व्यवस्थापन (Restaurant & System Settings)</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium">हॉटेल तारा ब्रँडिंग, भाषा आणि सुरक्षा सेटिंग्ज व्यवस्थापित करा.</p>
      </div>

      {/* Passkey & Credentials Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-black text-amber-950">
              डॅशबोर्ड लॉगिन पासवर्ड व माहिती (Dashboard Credentials)
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full">
            क्लायंट लॉगिन तयार
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          तुमच्या क्लायंटसाठी किंवा स्टाफसाठी डॅशबोर्डमध्ये प्रवेश करण्यासाठी खालील वापरकर्तानाव व पासवर्ड वापरा:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">वापरकर्तानाव (Username)</span>
              <code className="text-sm font-black text-orange-700">sushant</code>
            </div>
            <button
              onClick={() => copyToClipboard('sushant', 'user')}
              className="p-1.5 text-slate-400 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
              title="Copy Username"
            >
              {copiedKey === 'user' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">पासवर्ड (Password / Pass)</span>
              <code className="text-sm font-black text-orange-700">sushant</code>
            </div>
            <button
              onClick={() => copyToClipboard('sushant', 'pass')}
              className="p-1.5 text-slate-400 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
              title="Copy Password"
            >
              {copiedKey === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Restaurant Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                रेस्टॉरंटचे नाव (Restaurant Name)
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="उदा. हॉटेल तारा (Hotel Tara)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                टॅगलाईन / ब्रीदवाक्य (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="उदा. खानदेशी झणझणीत शेवभाजी व स्पेशल व्हेज"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                फोन नंबर (Phone / Contact)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                पत्ता (Address)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="हॉटेल तारा, मुख्य रस्ता"
              />
            </div>
          </div>

          {/* Logo Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              रेस्टॉरंट लोगो (Logo Icon)
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
                  No Logo
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png किंवा खालील पर्यायांमधून निवडा"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>अपलोड करा (Upload Image)</span>
                  <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {LOGO_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLogoUrl(p.url)}
                  className="flex items-center gap-2 p-2 border border-slate-200 hover:border-orange-300 rounded-xl hover:bg-orange-50/50 transition-all text-left cursor-pointer"
                >
                  <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                  <span className="text-[11px] font-bold text-slate-700 truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Language */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              डीफॉल्ट भाषा (Default Language)
            </label>
            <div className="flex gap-2">
              {[
                { code: 'mr', name: 'मराठी (Marathi - Official)' },
                { code: 'en', name: 'English' },
                { code: 'hi', name: 'हिन्दी (Hindi)' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    language === lang.code
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>सेव्ह होत आहे...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>बदल सेव्ह करा (Save Settings)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Full Factory Data Refresh Action Card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 mt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-600" />
              <span>संपूर्ण डेटा फॅक्टरी रिफ्रेश करा (Full System Data Refresh)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              हॉटेल ताराचे सर्व ७५+ पदार्थ, टेबल १ ते १० चे क्यूआर कोड आणि सुरुवातीच्या सेटिंग्ज एका क्लिकवर परत आणण्यासाठी ही क्रिया वापरा.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRefreshModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span>रिफ्रेश सुरू करा</span>
          </button>
        </div>
      </div>

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
                    संपूर्ण डेटा पूर्ववत रिफ्रेश करा
                  </h3>
                  <p className="text-xs text-slate-400">
                    हॉटेल ताराचे ७५+ मेनू पदार्थ, १० टेबल्स आणि ऑर्डर्स रिसेट करा
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 leading-relaxed">
                <p className="font-bold text-slate-700">काय रिफ्रेश केले जाईल?</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 font-medium">
                  <li>हॉटेल तारा प्रोफाइल व ब्रँडिंग माहिती (मराठी)</li>
                  <li>सर्व ७५+ अस्सल मराठी खाद्यपदार्थ (शेवभाजी, कढई पनीर, भाकरी, इ.)</li>
                  <li>टेबल १ ते १० साठी लगेच वापरता येणारे क्यूआर कोड</li>
                  <li>किचनसाठी थेट डेमो ऑर्डर्स</li>
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
                  onClick={handleTriggerFullRefresh}
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
    </div>
  );
}
