import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, getDoc } from '../lib/firebase';
import { QRCodeData } from '../types';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { 
  QrCode, 
  Plus, 
  Download, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2, 
  Link, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Printer, 
  Palette, 
  Eye, 
  Layout, 
  Type, 
  Image, 
  CheckSquare, 
  Settings,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

// Patch getComputedStyle to convert 'oklch' and 'oklab' to standard rgb/rgba
// because html2canvas does not support parsing oklch/oklab colors from Tailwind v4.
if (typeof window !== 'undefined') {
  const originalGetComputedStyle = window.getComputedStyle;
  
  // Custom oklab to rgb converter
  const oklabToRgb = (l: number, a: number, b: number): [number, number, number] => {
    const l_lms = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_lms = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_lms = l - 0.0894841775 * a - 1.2914855480 * b;

    const l_ = l_lms * l_lms * l_lms;
    const m_ = m_lms * m_lms * m_lms;
    const s_ = s_lms * s_lms * s_lms;

    const out_r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
    const out_g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
    const out_b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

    const convertChannel = (val: number) => {
      val = Math.max(0, Math.min(1, val));
      return val <= 0.0031308 
        ? 12.92 * val 
        : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    return [
      Math.round(convertChannel(out_r) * 255),
      Math.round(convertChannel(out_g) * 255),
      Math.round(convertChannel(out_b) * 255)
    ];
  };

  // Custom oklch to rgb converter
  const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
    const hRad = (isNaN(h) ? 0 : h * Math.PI) / 180;
    const ok_a = c * Math.cos(hRad);
    const ok_b = c * Math.sin(hRad);
    return oklabToRgb(l, ok_a, ok_b);
  };

  const convertOklchToRgb = (oklchStr: string): string => {
    try {
      return oklchStr.replace(/oklch\([^)]+\)/g, (match) => {
        const matches = match.match(/(-?\d*\.?\d+(?:%|deg)?)/g);
        if (!matches || matches.length < 3) return 'rgb(255, 255, 255)';

        let l = parseFloat(matches[0]);
        if (matches[0].endsWith('%')) l = l / 100;
        const c = parseFloat(matches[1]);
        let h = parseFloat(matches[2]);

        let alpha = 1;
        if (matches.length >= 4) {
          const aVal = matches[3];
          alpha = parseFloat(aVal);
          if (aVal.endsWith('%')) alpha = alpha / 100;
        }

        const [r, g, b] = oklchToRgb(l, c, h);
        if (alpha !== 1) {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      });
    } catch (err) {
      return 'rgb(255, 255, 255)';
    }
  };

  const convertOklabToRgb = (oklabStr: string): string => {
    try {
      return oklabStr.replace(/oklab\([^)]+\)/g, (match) => {
        const matches = match.match(/(-?\d*\.?\d+(?:%|deg)?)/g);
        if (!matches || matches.length < 3) return 'rgb(255, 255, 255)';

        let l = parseFloat(matches[0]);
        if (matches[0].endsWith('%')) l = l / 100;
        const a = parseFloat(matches[1]);
        const b = parseFloat(matches[2]);

        let alpha = 1;
        if (matches.length >= 4) {
          const aVal = matches[3];
          alpha = parseFloat(aVal);
          if (aVal.endsWith('%')) alpha = alpha / 100;
        }

        const [r, g, bVal] = oklabToRgb(l, a, b);
        if (alpha !== 1) {
          return `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${bVal})`;
      });
    } catch (err) {
      return 'rgb(255, 255, 255)';
    }
  };

  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function(propertyName: string) {
            let val = target.getPropertyValue(propertyName);
            if (typeof val === 'string') {
              if (val.includes('oklch')) {
                val = convertOklchToRgb(val);
              }
              if (val.includes('oklab')) {
                val = convertOklabToRgb(val);
              }
            }
            return val;
          };
        }
        let val = Reflect.get(target, prop);
        if (typeof val === 'string') {
          if (val.includes('oklch')) {
            val = convertOklchToRgb(val);
          }
          if (val.includes('oklab')) {
            val = convertOklabToRgb(val);
          }
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };
}

interface QRManagerProps {
  ownerId: string;
}

interface RestaurantBranding {
  name: string;
  logoUrl: string;
}

export default function QRManager({ ownerId }: QRManagerProps) {
  // Database states
  const [tableNumber, setTableNumber] = useState('');
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTableValue, setEditTableValue] = useState('');
  const [qrCache, setQrCache] = useState<{ [key: string]: string }>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  // Card download states
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Restaurant branding info state
  const [restaurantBranding, setRestaurantBranding] = useState<RestaurantBranding>({
    name: 'हॉटेल तारा (Hotel Tara)',
    logoUrl: ''
  });

  // Designer System States
  const [activeTab, setActiveTab] = useState<'list' | 'designer'>('list');
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [qrTheme, setQrTheme] = useState<'saffron' | 'emerald' | 'charcoal' | 'classic'>('saffron');
  
  // Custom texts
  const [headerText, setHeaderText] = useState('Welcome / स्वागत आहे!');
  const [ctaText, setCtaText] = useState('स्कॅन करा आणि ऑर्डर करा (Scan & Order)');
  const [footerText, setFooterText] = useState('No App Download Required • Direct to Kitchen');
  
  // Toggles
  const [showLogo, setShowLogo] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showTableBadge, setShowTableBadge] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [cardSize, setCardSize] = useState<'standard' | 'large' | 'compact'>('standard');

  // Load restaurant branding data
  const fetchBranding = async () => {
    try {
      const docRef = doc(db, 'users', ownerId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRestaurantBranding({
          name: data.restaurantName && data.restaurantName !== 'QuickBite Eatery' ? data.restaurantName : 'हॉटेल तारा (Hotel Tara)',
          logoUrl: data.logoUrl || ''
        });
        if (data.customBaseUrl) {
          setCustomBaseUrl(data.customBaseUrl);
        }
      }
    } catch (err) {
      console.error("Error fetching restaurant branding for QR:", err);
    }
  };

  const getBaseUrl = () => {
    let base = customBaseUrl ? customBaseUrl.trim().replace(/\/$/, '') : window.location.origin;
    if (base.includes('ais-dev-')) {
      base = base.replace('ais-dev-', 'ais-pre-');
    }
    return base;
  };

  const fetchQRs = async () => {
    setFetching(true);
    try {
      const qrsRef = collection(db, 'qrs');
      const q = query(qrsRef, where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);
      const fetchedQRs = snapshot.docs.map(doc => {
        const data = doc.data();
        let url = data.url || '';
        if (url.includes('ais-dev-')) {
          url = url.replace('ais-dev-', 'ais-pre-');
        }
        return {
          id: doc.id,
          ...data,
          url
        } as QRCodeData;
      });
      
      // Sort in memory to avoid needing a Firestore composite index!
      fetchedQRs.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
      setQrs(fetchedQRs);

      // Save corrected URLs to Firestore in the background
      for (const qr of fetchedQRs) {
        const origDoc = snapshot.docs.find(d => d.id === qr.id);
        if (origDoc) {
          const origUrl = origDoc.data().url || '';
          if (origUrl !== qr.url) {
            try {
              await updateDoc(doc(db, 'qrs', qr.id), { url: qr.url });
            } catch (e) {
              console.error("Error correcting stale QR url in DB:", e);
            }
          }
        }
      }

      // Pre-generate QR Code images (Data URLs) using the qrcode library
      const cache: { [key: string]: string } = {};
      for (const qr of fetchedQRs) {
        try {
          const dataUrl = await QRCode.toDataURL(qr.url, { width: 300, margin: 2 });
          cache[qr.id] = dataUrl;
        } catch (err) {
          console.error("Failed to generate QR data url:", err);
        }
      }
      setQrCache(cache);
    } catch (err) {
      console.error("Error fetching QR codes:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchQRs();
    fetchBranding();
  }, [ownerId]);

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    setLoading(true);

    try {
      // Check if table already exists in the list to prevent duplicates
      const exists = qrs.some(q => q.tableNumber.toLowerCase() === tableNumber.trim().toLowerCase());
      if (exists) {
        alert(`QR Code for Table ${tableNumber} already exists.`);
        setLoading(false);
        return;
      }

      // Create target URL pointing to the customer menu with restaurant ID and table number query params
      const base = getBaseUrl();
      const targetUrl = `${base}/?restaurantId=${ownerId}&table=${encodeURIComponent(tableNumber.trim())}`;
      
      const newQR = {
        ownerId,
        tableNumber: tableNumber.trim(),
        url: targetUrl,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'qrs'), newQR);
      
      // Update local state
      const generatedQr: QRCodeData = { id: docRef.id, ...newQR };
      setQrs(prev => [...prev, generatedQr].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })));
      
      // Generate QR image cache
      const dataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
      setQrCache(prev => ({ ...prev, [docRef.id]: dataUrl }));
      
      setTableNumber('');
    } catch (err) {
      console.error("Error generating QR:", err);
      alert("Error creating QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCreateTables = async () => {
    setLoading(true);
    try {
      const tablesToCreate = ['1', '2'];
      const updatedQRs = [...qrs];
      const base = getBaseUrl();

      for (const tNum of tablesToCreate) {
        const exists = qrs.some(q => q.tableNumber.toLowerCase() === tNum.toLowerCase());
        if (!exists) {
          const targetUrl = `${base}/?restaurantId=${ownerId}&table=${encodeURIComponent(tNum)}`;
          const newQR = {
            ownerId,
            tableNumber: tNum,
            url: targetUrl,
            createdAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'qrs'), newQR);
          const generatedQr: QRCodeData = { id: docRef.id, ...newQR };
          updatedQRs.push(generatedQr);
          
          const dataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
          setQrCache(prev => ({ ...prev, [docRef.id]: dataUrl }));
        }
      }
      updatedQRs.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
      setQrs(updatedQRs);
    } catch (err) {
      console.error("Error quick creating tables:", err);
      alert("Error creating quick tables.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQR = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'qrs', id));
      setQrs(prev => prev.filter(q => q.id !== id));
      setQrCache(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting QR code:", err);
    }
  };

  const startEdit = (qr: QRCodeData) => {
    setEditingId(qr.id);
    setEditTableValue(qr.tableNumber);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTableValue.trim()) return;
    try {
      const base = getBaseUrl();
      const targetUrl = `${base}/?restaurantId=${ownerId}&table=${encodeURIComponent(editTableValue.trim())}`;
      
      await updateDoc(doc(db, 'qrs', id), {
        tableNumber: editTableValue.trim(),
        url: targetUrl
      });

      // Update locally
      setQrs(prev => prev.map(q => q.id === id ? { ...q, tableNumber: editTableValue.trim(), url: targetUrl } : q));
      
      // Re-generate cache for this QR
      const dataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
      setQrCache(prev => ({ ...prev, [id]: dataUrl }));

      setEditingId(null);
    } catch (err) {
      console.error("Error saving edited table number:", err);
    }
  };

  const downloadQR = (qr: QRCodeData) => {
    const dataUrl = qrCache[qr.id];
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `table-${qr.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download a single fully designed table card as a PNG image
  const downloadCardAsImage = async (qrId: string, tableNumber: string, isBulk = false) => {
    const element = document.getElementById(`designed-card-${qrId}`);
    if (!element) {
      if (!isBulk) alert("Card element not found!");
      return;
    }
    
    if (!isBulk) setDownloadingCardId(qrId);
    try {
      // Small timeout to guarantee DOM is settled and fully painted
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale creates beautiful crisp print resolution
        useCORS: true, // Crucial for external image sources like logo URLs
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Hotel-QR-Card-Table-${tableNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating card image:", err);
      if (!isBulk) {
        alert("इमेज डाउनलोड करताना एरर आली. (Failed to download designed card image.)");
      }
    } finally {
      if (!isBulk) setDownloadingCardId(null);
    }
  };

  // Download all generated cards in sequence as individual PNG files
  const downloadAllCardsAsImages = async () => {
    if (designerQRs.length === 0) return;
    setDownloadingAll(true);
    try {
      for (const qr of designerQRs) {
        await downloadCardAsImage(qr.id, qr.tableNumber, true);
        // Half-second pause between each download so browser queue isn't throttled
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error("Error exporting all cards:", err);
    } finally {
      setDownloadingAll(false);
    }
  };

  // Trigger browser print screen for custom table cards, with fallback for sandbox iframes
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error("Print call failed:", err);
      alert(
        "प्रिंट एरर (Print Error):\nसुरक्षा निर्बंधांमुळे आयफ्रेममधून प्रिंट करणे ब्लॉक केले आहे. " +
        "कृपया वरील 'नवीन टॅबमध्ये ॲप उघडा' (Open App in New Tab) बटणावर क्लिक करा आणि तिथून प्रिंट करा, " +
        "किंवा खालील 'इमेज म्हणून डाउनलोड करा' (Download Card Image) पर्याय वापरा जो सर्वत्र उत्तम काम करतो!"
      );
    }
  };

  // Theme presets definitions for the card backgrounds
  const themeStyles = {
    saffron: {
      cardBg: 'bg-gradient-to-b from-amber-50 to-orange-50/50',
      border: 'border-orange-200 shadow-md shadow-orange-500/5',
      accentText: 'text-orange-700',
      badgeBg: 'bg-orange-600 text-white',
      badgeBorder: 'border-orange-500',
      ornamentColor: 'text-orange-500/20',
      accentBorder: 'border-t-4 border-t-orange-600',
      secondaryText: 'text-orange-800/80',
      cardStyle: { borderColor: '#f97316' }
    },
    emerald: {
      cardBg: 'bg-gradient-to-b from-emerald-50/40 to-teal-50/30',
      border: 'border-emerald-200 shadow-md shadow-emerald-500/5',
      accentText: 'text-emerald-800',
      badgeBg: 'bg-emerald-800 text-white',
      badgeBorder: 'border-emerald-700',
      ornamentColor: 'text-emerald-700/20',
      accentBorder: 'border-t-4 border-t-emerald-800',
      secondaryText: 'text-emerald-900/80',
      cardStyle: { borderColor: '#064e3b' }
    },
    charcoal: {
      cardBg: 'bg-slate-900',
      border: 'border-slate-800 shadow-lg shadow-black/20',
      accentText: 'text-slate-100',
      badgeBg: 'bg-white text-slate-900',
      badgeBorder: 'border-slate-200',
      ornamentColor: 'text-slate-700/40',
      accentBorder: 'border-t-4 border-t-amber-500',
      secondaryText: 'text-slate-300',
      cardStyle: { borderColor: '#475569', color: '#f8fafc' }
    },
    classic: {
      cardBg: 'bg-stone-50',
      border: 'border-stone-300 shadow-sm',
      accentText: 'text-stone-800',
      badgeBg: 'bg-stone-800 text-white',
      badgeBorder: 'border-stone-700',
      ornamentColor: 'text-stone-400/20',
      accentBorder: 'border-t-4 border-stone-800',
      secondaryText: 'text-stone-600',
      cardStyle: { borderColor: '#78716c' }
    }
  };

  const activeTheme = themeStyles[qrTheme];

  // Filter QRs based on designer selection
  const designerQRs = selectedTableId === 'all' 
    ? qrs 
    : qrs.filter(q => q.id === selectedTableId);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      {/* Dynamic Style Injection for Flawless Printing Layout */}
      <style>{`
        @media print {
          /* Hide all screen dashboard elements */
          body * {
            visibility: hidden !important;
          }
          /* Show print area and its contents exclusively */
          #printable-qr-area, #printable-qr-area * {
            visibility: visible !important;
          }
          /* Explicitly hide any no-print helper elements */
          .no-print, .no-print * {
            visibility: hidden !important;
            display: none !important;
          }
          #printable-qr-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
            background: white !important;
          }
          /* Ensure print page splits properly */
          .print-card-wrapper {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          /* Force color & background prints */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            margin: 1.2cm !important;
            size: auto !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-600" />
            क्यूआर कोड जनरेशन आणि डिझाइन सिस्टीम (QR Generation & Print Studio)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate dining table QR codes and design custom scan-to-order backgrounds, templates & table tent cards dynamically.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-white text-slate-800 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 QR यादी (QR Codes List)
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'designer' 
                ? 'bg-orange-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-orange-600'
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> 🎨 डिझाईन आणि प्रिंट स्टुडिओ
          </button>
        </div>
      </div>

      {/* Active Tab 1: QR Codes List */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Permanent URL Guide & Information banner */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-start">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                क्यूआर कोड कायमस्वरूपी ठेवण्यासाठी मार्गदर्शक (Permanent QR Codes Guide)
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                सध्या तयार होणारे क्यूआर कोड तात्पुरत्या चाचणी पत्त्यावर (Sandbox URL) चालतात. जर तुम्ही छापलेले क्यूआर कोड कधीही बंद न होता कायमस्वरूपी चालू ठेवायचे असतील, तर डावीकडील <strong>Settings Panel</strong> मध्ये जाऊन तुमची स्वतःची कायमची वेबसाईट पत्ता (Custom App URL / Domain, उदा. <code>https://hoteltara.com</code>) सेट करा.
              </p>
              <div className="text-[10px] text-amber-600 font-semibold pt-1">
                {customBaseUrl ? (
                  <span>✅ सध्याचा कायमस्वरूपी पत्ता: <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-800 font-mono">{customBaseUrl}</code></span>
                ) : (
                  <span>⚠️ सध्या तुम्ही तात्पुरता चाचणी पत्ता वापरत आहात.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Generator Form & Quick Actions */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <form onSubmit={handleGenerateQR} className="flex-1 flex flex-col sm:flex-row items-end gap-3">
                <div className="w-full sm:w-1/2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    टेबल नंबर लिहा (Enter Table Number / ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="उदा. Table 1, Table 2, Cabin A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs bg-white font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 h-[36px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> टेबल क्यूआर तयार करा (Generate QR)
                    </>
                  )}
                </button>
              </form>

              <div className="w-full md:w-auto border-t md:border-t-0 border-slate-200/60 pt-3 md:pt-0">
                <button
                  type="button"
                  onClick={handleQuickCreateTables}
                  disabled={loading}
                  className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 h-[36px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-100" /> १ आणि २ नंबर क्यूआर लगेच बनवा (Quick Tables 1 & 2)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* QR Codes Grid */}
          {fetching && qrs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <span className="text-xs text-slate-500">क्यूआर कोड लोड होत आहेत...</span>
            </div>
          ) : qrs.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">अद्याप कोणतेही क्यूआर कोड तयार केलेले नाहीत</p>
              <p className="text-xs text-slate-400 mt-1">आपल्या रेस्टॉरंटचे टेबल जोडण्यासाठी वर टेबल नंबर लिहून कोड तयार करा.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrs.map((qr) => (
                <div 
                  key={qr.id}
                  className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col items-center shadow-xs hover:shadow-md transition-shadow relative group"
                >
                  {/* QR Image Frame */}
                  <div className="w-full aspect-square max-w-[180px] bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center relative">
                    {qrCache[qr.id] ? (
                      <img 
                        src={qrCache[qr.id]} 
                        alt={`Table ${qr.tableNumber} QR`} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                    )}
                  </div>

                  {/* QR Details */}
                  <div className="w-full text-center mt-4">
                    {editingId === qr.id ? (
                      <div className="flex items-center gap-1 justify-center mt-1">
                        <input
                          type="text"
                          value={editTableValue}
                          onChange={(e) => setEditTableValue(e.target.value)}
                          className="px-2 py-1 text-xs border border-orange-500 rounded-lg text-center font-bold w-20 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(qr.id)}
                          className="p-1 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">
                          Table {qr.tableNumber}
                        </h3>
                        <button
                          onClick={() => startEdit(qr)}
                          className="p-1 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Edit Table Number"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-center gap-1 bg-slate-50 py-1 px-2 rounded-lg text-[10px] text-slate-500 border border-slate-100 max-w-full overflow-hidden">
                      <Link className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate" title={qr.url}>{qr.url}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => downloadQR(qr)}
                      className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors cursor-pointer"
                      title="Download PNG QR"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <a
                      href={qr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors text-center"
                      title="Preview Menu App"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                    {deleteConfirmId === qr.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteQR(qr.id)}
                          className="flex-1 py-1.5 text-[9px] font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                        >
                          Sure?
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1 py-1.5 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(qr.id)}
                        className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        title="Delete Table QR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Tab 2: Custom Design & Printing Studio */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Customizer Settings (4 Columns) */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-orange-600" /> डिझाईन पर्याय (Design Customizer)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Customize background colors, hotel branding, text details and stand templates live.</p>
            </div>

            {/* Selector: Table Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">प्रिंट करायचे टेबल (Select Table to Generate)</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all">सर्व टेबल प्रिंट करा (Generate for All Tables)</option>
                {qrs.map((qr) => (
                  <option key={qr.id} value={qr.id}>टेबल {qr.tableNumber} (Table {qr.tableNumber})</option>
                ))}
              </select>
            </div>

            {/* Selector: Theme Template */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">पार्श्वभूमी थीम निवडा (Choose Background Theme)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'saffron', name: 'Saffron Spice', desc: 'सॅफरॉन आणि गोल्ड', color: 'bg-orange-500' },
                  { id: 'emerald', name: 'Royal Emerald', desc: 'शाही हिरवा आणि गोल्ड', color: 'bg-emerald-800' },
                  { id: 'charcoal', name: 'Modern Charcoal', desc: 'मिनिमलिस्ट डार्क स्लेट', color: 'bg-slate-900' },
                  { id: 'classic', name: 'Classic Ivory', desc: 'क्लासिक ऑफ-व्हाइट', color: 'bg-stone-200' },
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setQrTheme(theme.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex gap-2.5 items-center ${
                      qrTheme === theme.id 
                        ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/10' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${theme.color} shrink-0 border border-black/10`} />
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-700">{theme.name}</div>
                      <div className="text-[9px] text-slate-400 font-semibold">{theme.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-4 pt-2 border-t border-slate-200/60">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> मुख्य शीर्षक (Header Welcome Text)
                </label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Welcome / स्वागत आहे!"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> स्कॅन सूचना (Scan Call To Action)
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="स्कॅन करा आणि ऑर्डर करा"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> तळटीप (Footer Subnote)
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="No app installation required"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Element Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">घटक दर्शवा / लपवा (Show/Hide Elements)</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogo(!showLogo)}
                  className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    showLogo ? 'bg-white border-orange-200 text-orange-700' : 'bg-slate-100/50 text-slate-400 border-slate-100'
                  }`}
                >
                  <input type="checkbox" checked={showLogo} readOnly className="pointer-events-none rounded text-orange-600 focus:ring-0" />
                  <span>Branding Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowName(!showName)}
                  className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    showName ? 'bg-white border-orange-200 text-orange-700' : 'bg-slate-100/50 text-slate-400 border-slate-100'
                  }`}
                >
                  <input type="checkbox" checked={showName} readOnly className="pointer-events-none rounded text-orange-600 focus:ring-0" />
                  <span>Hotel Name</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTableBadge(!showTableBadge)}
                  className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    showTableBadge ? 'bg-white border-orange-200 text-orange-700' : 'bg-slate-100/50 text-slate-400 border-slate-100'
                  }`}
                >
                  <input type="checkbox" checked={showTableBadge} readOnly className="pointer-events-none rounded text-orange-600 focus:ring-0" />
                  <span>Table Number Badge</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  className={`p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    showSteps ? 'bg-white border-orange-200 text-orange-700' : 'bg-slate-100/50 text-slate-400 border-slate-100'
                  }`}
                >
                  <input type="checkbox" checked={showSteps} readOnly className="pointer-events-none rounded text-orange-600 focus:ring-0" />
                  <span>How-To Guide</span>
                </button>
              </div>
            </div>

            {/* Quick Print & Export Buttons */}
            <div className="pt-4 border-t border-slate-200/60 space-y-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-md shadow-orange-500/10"
              >
                <Printer className="w-4 h-4" /> टेबल स्टँड कार्ड प्रिंट करा (Print / Save PDF)
              </button>

              <button
                type="button"
                onClick={downloadAllCardsAsImages}
                disabled={downloadingAll || designerQRs.length === 0}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                ) : (
                  <Download className="w-4 h-4 text-orange-600" />
                )}
                <span>सर्व डिझाईन्स इमेज म्हणून डाऊनलोड करा ({designerQRs.length} PNG)</span>
              </button>

              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-2 font-medium justify-center">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>टीप: आयफ्रेममध्ये प्रिंट बंद असल्यास "Download" बटण वापरा किंवा नवीन टॅबमध्ये ॲप उघडा!</span>
              </div>
            </div>

          </div>

          {/* Right panel: Live Card Template Preview (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full mb-3 flex items-center justify-between px-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> लाइव्ह प्रिव्ह्यू (Live Card Preview)
              </span>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {designerQRs.length} Card(s) ready to print
              </span>
            </div>

            {/* Printable Container wrapper */}
            {designerQRs.length === 0 ? (
              <div className="w-full py-20 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 text-center p-4">
                <QrCode className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-600 text-sm">No Tables Generated Yet</h4>
                <p className="text-xs text-slate-400 mt-1">Please add a table in the QR Codes tab first before utilizing the Design Studio.</p>
              </div>
            ) : (
              <div className="w-full max-h-[600px] overflow-y-auto p-4 border border-slate-100 rounded-2xl bg-slate-100/50 shadow-inner flex flex-col items-center gap-8 scrollbar-thin">
                
                {/* Visual Cards Rendered */}
                <div id="printable-qr-area" className="w-full max-w-[340px] space-y-8">
                  {designerQRs.map((qr) => (
                    <div key={qr.id} className="w-full space-y-2">
                      {/* Individual card download bar on preview - hidden in printing */}
                      <div className="no-print flex justify-between items-center bg-white/95 backdrop-blur-xs py-1.5 px-3 rounded-xl border border-slate-200/60 shadow-xs">
                        <span className="text-[10px] font-extrabold text-slate-500">टेबल {qr.tableNumber} डिझाईन (Designed Card)</span>
                        <button
                          type="button"
                          onClick={() => downloadCardAsImage(qr.id, qr.tableNumber)}
                          disabled={downloadingCardId === qr.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                        >
                          {downloadingCardId === qr.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>PNG डाउनलोड</span>
                        </button>
                      </div>

                      {/* Actual Printed/Exported Card */}
                      <div 
                        id={`designed-card-${qr.id}`}
                        style={activeTheme.cardStyle}
                        className={`print-card-wrapper w-full bg-white border rounded-[2rem] p-6 text-center overflow-hidden relative flex flex-col items-center select-none ${activeTheme.cardBg} ${activeTheme.border} ${activeTheme.accentBorder}`}
                      >
                        {/* Indian Ornamental Traditional Graphics (Decorative vectors inside the background) */}
                        <div className="absolute top-2 left-2 flex gap-1 opacity-25">
                          <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.ornamentColor}`} />
                          <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.ornamentColor}`} />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-25">
                          <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.ornamentColor}`} />
                          <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.ornamentColor}`} />
                        </div>

                        {/* Card Content Header */}
                        <div className="space-y-2 mt-2 w-full flex flex-col items-center">
                          {/* Hotel Logo */}
                          {showLogo && (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-white shadow-md flex items-center justify-center">
                              {restaurantBranding.logoUrl ? (
                                <img src={restaurantBranding.logoUrl} className="w-full h-full object-cover" alt="hotel logo" />
                              ) : (
                                <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-black text-lg">
                                  {restaurantBranding.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hotel Name */}
                          {showName && (
                            <h4 className={`text-base font-black tracking-tight ${activeTheme.accentText}`}>
                              {restaurantBranding.name}
                            </h4>
                          )}

                          {/* Custom Header welcome text */}
                          {headerText && (
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${activeTheme.secondaryText}`}>
                              {headerText}
                            </p>
                          )}
                        </div>

                        {/* Middle Frame: Scanner & QR Code */}
                        <div className="my-5 p-4 bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center relative z-10 w-full max-w-[220px]">
                          
                          {/* CTA Text */}
                          <div className="mb-2.5">
                            <span className="text-[10px] font-black text-slate-800 tracking-tight block uppercase">
                              {ctaText}
                            </span>
                          </div>

                          {/* Actual QR Code */}
                          <div className="w-36 h-36 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 flex items-center justify-center">
                            {qrCache[qr.id] ? (
                              <img src={qrCache[qr.id]} alt={`Table ${qr.tableNumber} QR`} className="w-full h-full object-contain" />
                            ) : (
                              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                            )}
                          </div>

                          {/* Scan Instruction Subtext */}
                          <span className="text-[8px] text-slate-400 font-bold mt-2 uppercase tracking-wider">
                            Scan with Mobile Camera to order
                          </span>
                        </div>

                        {/* Table Number Badge */}
                        {showTableBadge && (
                          <div className={`px-5 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${activeTheme.badgeBg} ${activeTheme.badgeBorder} shadow-sm z-10`}>
                            टेबल / TABLE: {qr.tableNumber}
                          </div>
                        )}

                        {/* Footer Instructional Steps */}
                        {showSteps && (
                          <div className="mt-5 pt-4 border-t border-dashed border-slate-200 w-full grid grid-cols-3 gap-1">
                            <div className="text-center">
                              <span className={`block text-xs font-black ${activeTheme.accentText}`}>1</span>
                              <span className="block text-[8px] text-slate-500 font-semibold leading-tight mt-0.5">कॅमेरा उघडा<br/>Open Camera</span>
                            </div>
                            <div className="text-center border-x border-slate-100">
                              <span className={`block text-xs font-black ${activeTheme.accentText}`}>2</span>
                              <span className="block text-[8px] text-slate-500 font-semibold leading-tight mt-0.5">क्यूआर स्कॅन करा<br/>Scan QR Code</span>
                            </div>
                            <div className="text-center">
                              <span className={`block text-xs font-black ${activeTheme.accentText}`}>3</span>
                              <span className="block text-[8px] text-slate-500 font-semibold leading-tight mt-0.5">ऑर्डर द्या<br/>View & Order</span>
                            </div>
                          </div>
                        )}

                        {/* Footer Slogan note */}
                        {footerText && (
                          <p className="text-[8px] text-slate-400 font-bold mt-4 tracking-wider uppercase">
                            {footerText}
                          </p>
                        )}

                        {/* Bottom ornament */}
                        <div className="absolute bottom-1 w-20 h-1 bg-orange-600/10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
