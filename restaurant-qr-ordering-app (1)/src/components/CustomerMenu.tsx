import React, { useState, useEffect } from 'react';
import { getHotelTaraMenu } from '../lib/hotelTaraMenu';
import { db, collection, query, where, getDocs, addDoc, doc, onSnapshot, getDoc } from '../lib/firebase';
import { MenuItem, Order, OrderItem, Language, Category } from '../types';
import { translations, DEFAULT_CATEGORIES } from '../lib/translations';
import CustomerVoiceGuide from './CustomerVoiceGuide';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Loader2, 
  QrCode, 
  Download, 
  FileText, 
  Clock, 
  Utensils, 
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  MapPin,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerMenuProps {
  restaurantId?: string; // Optional query override
  tableNumber?: string;  // Optional query override
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function CustomerMenu({ restaurantId: propsRestId, tableNumber: propsTable, darkMode = false, toggleDarkMode }: CustomerMenuProps) {
  // Read params from window.location or props
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [table, setTable] = useState<string>('General');
  
  // App configs
  const [restaurantName, setRestaurantName] = useState('हॉटेल तारा');
  const [logoUrl, setLogoUrl] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  
  // App states
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [language, setLanguage] = useState<Language>('mr');
  
  // Cart state
  const [cart, setCart] = useState<{ [key: string]: OrderItem }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Order tracking
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [minimizeActiveTracker, setMinimizeActiveTracker] = useState(false);

  // Sound generator on customer screen for confirmation
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  };

  // Parse table and restaurant ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRestId = propsRestId || params.get('restaurantId') || params.get('r');
    const queryTable = propsTable || params.get('table') || params.get('t') || 'General';
    
    setTable(queryTable);

    const resolveRestaurant = async () => {
      setLoading(true);
      try {
        let finalRestId = queryRestId || '';
        
        // If there is no restaurantId query param, first try to find the first owner in the DB,
        // and if empty or not found, fallback to 'hotel_tara_owner'
        if (!finalRestId) {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          if (!usersSnapshot.empty) {
            finalRestId = usersSnapshot.docs[0].id;
          } else {
            finalRestId = 'hotel_tara_owner';
          }
        }

        if (finalRestId) {
          setRestaurantId(finalRestId);
          
          // Fetch Owner profile
          const userDoc = await getDoc(doc(db, 'users', finalRestId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setRestaurantName(data.restaurantName && data.restaurantName !== 'QuickBite Eatery' ? data.restaurantName : 'हॉटेल तारा');
            setLogoUrl(data.logoUrl || '');
            setLanguage(data.language || 'mr');
            if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
              setCategories(data.categories);
            } else {
              setCategories(DEFAULT_CATEGORIES);
            }
          }

          // Fetch Menu Items
          const menuQuery = query(collection(db, 'menuItems'), where('ownerId', '==', finalRestId));
          const menuSnapshot = await getDocs(menuQuery);
          let items = menuSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MenuItem[];
          
          if (items.length === 0) {
            const sampleDishes = getHotelTaraMenu(finalRestId);
            for (const dish of sampleDishes) {
              await addDoc(collection(db, 'menuItems'), dish);
            }
            const menuSnapshot2 = await getDocs(menuQuery);
            items = menuSnapshot2.docs.map(d => ({ id: d.id, ...d.data() })) as MenuItem[];
          }

          setMenuItems(items);
          setFilteredItems(items);
        }
      } catch (err) {
        console.error("Error resolving restaurant:", err);
      } finally {
        setLoading(false);
      }
    };

    resolveRestaurant();

    // Load current order and history from localStorage
    const savedOrderId = localStorage.getItem('qb_current_order_id');
    if (savedOrderId) {
      setCurrentOrderId(savedOrderId);
    }

    const savedHistory = localStorage.getItem('qb_orders_history');
    if (savedHistory) {
      try {
        setPastOrders(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, [propsRestId, propsTable]);

  // Listen to the active order status in real-time
  useEffect(() => {
    if (!currentOrderId) {
      setCurrentOrder(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'orders', currentOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const orderData = { id: snapshot.id, ...snapshot.data() } as Order;
        setCurrentOrder(orderData);
        
        // If order completed, update history
        if (orderData.status === 'completed') {
          // Add to past orders list
          setPastOrders(prev => {
            const exists = prev.some(o => o.id === orderData.id);
            if (exists) {
              return prev.map(o => o.id === orderData.id ? orderData : o);
            }
            const updated = [orderData, ...prev];
            localStorage.setItem('qb_orders_history', JSON.stringify(updated));
            return updated;
          });
        }
      } else {
        // Order deleted or cancelled by kitchen
        setCurrentOrder(null);
        setCurrentOrderId(null);
        localStorage.removeItem('qb_current_order_id');
      }
    });

    return () => unsub();
  }, [currentOrderId]);

  // Filter menu items on search and category
  useEffect(() => {
    let result = menuItems;
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredItems(result);
  }, [searchQuery, selectedCategory, menuItems]);

  const t = translations[language] || translations.en;

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.inStock) return;
    playChime();
    setCart(prev => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      } else {
        return {
          ...prev,
          [item.id]: {
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            quantity: 1
          }
        };
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      } else {
        return {
          ...prev,
          [itemId]: { ...existing, quantity: existing.quantity - 1 }
        };
      }
    });
  };

  const getCartTotal = () => {
    return (Object.values(cart) as OrderItem[]).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return (Object.values(cart) as OrderItem[]).reduce((sum, item) => sum + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    const itemsList = Object.values(cart) as OrderItem[];
    if (itemsList.length === 0 || !restaurantId) return;
    setSubmittingOrder(true);

    const totalPrice = getCartTotal();
    const orderData = {
      ownerId: restaurantId,
      tableNumber: table,
      items: itemsList,
      totalPrice,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Save order details locally
      setCurrentOrderId(docRef.id);
      setMinimizeActiveTracker(false);
      localStorage.setItem('qb_current_order_id', docRef.id);
      
      // Clear cart
      setCart({});
      setIsCartOpen(false);
      playChime();
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Something went wrong. Please request the waiter.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleDownloadReceipt = () => {
    const activeReceipt = currentOrder || (pastOrders.length > 0 ? pastOrders[0] : null);
    if (!activeReceipt) return;

    // Create dynamic canvas element to render high fidelity receipt bill and download as image
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw receipt styling
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Brand Header
    ctx.fillStyle = '#ea580c'; // orange-600
    ctx.textAlign = 'center';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(restaurantName.toUpperCase(), canvas.width / 2, 60);

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`TABLE NUMBER: ${activeReceipt.tableNumber}`, canvas.width / 2, 90);
    ctx.fillText(`ORDER ID: ${activeReceipt.id.substring(0, 8).toUpperCase()}`, canvas.width / 2, 110);
    ctx.fillText(new Date(activeReceipt.createdAt).toLocaleString(), canvas.width / 2, 130);

    // Decorative receipt line
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 150, canvas.width - 80, 2);

    // Column Headers
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ITEM NAME', 40, 180);
    ctx.textAlign = 'center';
    ctx.fillText('QTY', 260, 180);
    ctx.textAlign = 'right';
    ctx.fillText('PRICE', 410, 180);

    // Items list
    ctx.font = 'bold 13px sans-serif';
    let yPos = 210;
    activeReceipt.items.forEach((item) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#334155';
      ctx.fillText(item.name.substring(0, 25), 40, yPos);
      ctx.textAlign = 'center';
      ctx.fillText(item.quantity.toString(), 260, yPos);
      ctx.textAlign = 'right';
      ctx.fillText(`₹${item.price * item.quantity}`, 410, yPos);
      yPos += 30;
    });

    // Decorative line
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, yPos + 10, canvas.width - 80, 2);

    // Total bill
    ctx.fillStyle = '#ea580c';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BILL TOTAL:', 40, yPos + 40);
    ctx.textAlign = 'right';
    ctx.fillText(`₹${activeReceipt.totalPrice}`, 410, yPos + 40);

    // Footer note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px italic sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for dining with us! Come back soon.', canvas.width / 2, yPos + 100);

    // Trigger download of receipt PNG
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `bill-table-${activeReceipt.tableNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Reopen menu for secondary additions
  const handleReopenMenu = () => {
    setCurrentOrderId(null);
    localStorage.removeItem('qb_current_order_id');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-2" />
        <p className="text-slate-600 font-bold text-base">Loading Restaurant Menu...</p>
        <p className="text-xs text-slate-400 mt-1">Checking available food items and configuration.</p>
      </div>
    );
  }

  // Active tracking view when customer has placed an order
  if (currentOrder && !minimizeActiveTracker) {
    const trackingSteps = [
      { id: 'pending', label: t.pending, desc: 'Waiting for waiter acceptance' },
      { id: 'accepted', label: t.accepted, desc: 'Kitchen accepted the order' },
      { id: 'preparing', label: t.preparing, desc: 'Chef is cooking your dish' },
      { id: 'completed', label: t.completed, desc: 'Dishes served! Enjoy your meal' }
    ];

    const currentStepIndex = trackingSteps.findIndex(s => s.id === currentOrder.status);

    return (
      <div className="min-h-screen bg-orange-50/20 py-8 px-4 font-sans max-w-md mx-auto flex flex-col justify-between">
        
        {/* Tracker Block */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-orange-500/20 mb-3">
              <Utensils className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.orderSuccess}</h2>
            <p className="text-xs text-slate-500 mt-1 px-4 leading-relaxed">{t.orderSuccessDesc}</p>
            <div className="mt-3.5 bg-slate-50 border border-slate-100 py-2 px-4 rounded-xl inline-flex items-center gap-1.5 text-xs font-black text-slate-700">
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>{t.table} {currentOrder.tableNumber}</span>
            </div>
          </div>

          {/* Stepper tracking */}
          <div className="space-y-4 pt-2">
            {trackingSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;

              return (
                <div key={step.id} className="flex gap-4 relative">
                  {idx < trackingSteps.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-10 -ml-[1px] ${
                      idx < currentStepIndex ? 'bg-orange-600' : 'bg-slate-200'
                    }`} />
                  )}

                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isPast ? 'bg-orange-600 border-orange-600 text-white' :
                    isCurrent ? 'border-orange-500 text-orange-600 bg-orange-50 font-black scale-110 shadow-sm' :
                    'border-slate-200 bg-white text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-extrabold ${isCurrent ? 'text-orange-600 text-base' : isFuture ? 'text-slate-400' : 'text-slate-700'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Digital Bill Block */}
        <div id="print-area" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl mt-6 space-y-4 relative overflow-hidden receipt-card">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
          
          <div className="text-center pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.bill}</span>
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mt-1">{restaurantName}</h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase">ORDER ID: {currentOrder.id.substring(0, 8)}</span>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2.5 pt-2">
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <div className="flex gap-1.5">
                  <span className="text-slate-400">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">{t.total}:</span>
            <span className="text-lg font-black text-orange-600">₹{currentOrder.totalPrice}</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Bill
            </button>
            <button
              onClick={handlePrintReceipt}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Print Bill
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setMinimizeActiveTracker(true)}
          className="w-full mt-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-orange-500/10 cursor-pointer transition-colors"
        >
          {t.backToMenu}
        </button>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans max-w-md mx-auto flex flex-col justify-between relative pb-20 text-slate-800 dark:text-slate-100">
      
      {/* App Header */}
      <header className="bg-white dark:bg-slate-900 px-4 py-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-xs" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center">
              <Utensils className="w-5 h-5 animate-pulse" />
            </div>
          )}
          <div>
            <h1 className="font-black text-base text-slate-800 dark:text-slate-100 leading-none">{restaurantName}</h1>
            <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">
              {t.table} {table}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language dropdown */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिन्दी</option>
          </select>

          {/* Dark Mode toggle */}
          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
          )}

          {/* My Orders / History Button */}
          <button
            onClick={() => {
              setIsHistoryOpen(true);
              setMinimizeActiveTracker(true);
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 relative cursor-pointer"
            title={t.myOrders}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold hidden xs:inline">{t.myOrders}</span>
            {currentOrder && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-600 animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Google Maps Location & Welcoming Banner */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg shadow-orange-600/15 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -left-4 -top-4 w-16 h-16 bg-amber-400/20 rounded-full blur-lg" />
          
          <div className="relative z-10 flex flex-col items-start">
            <span className="bg-white/20 text-white text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase">
              📍 शुद्ध शाकाहारी • Pure Veg
            </span>
            <h2 className="text-xl font-black mt-2">हॉटेल तारा (Hotel Tara)</h2>
            <p className="text-xs text-amber-50 mt-1 font-medium leading-relaxed">
              उत्कृष्ट गावरान आणि पंजाबी चव! आमचा संपूर्ण मराठी मेनू खाली पहा आणि तुमच्या आवडत्या खाद्यपदार्थांची ऑर्डर द्या.
            </p>
            
            <a 
              href="https://maps.app.goo.gl/eXjZ1XpTiLkQhWeJ9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 bg-white text-orange-600 hover:bg-orange-50 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-950/20 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              गुगल मॅप्सवर लोकेशन पहा (Google Maps)
            </a>
          </div>
        </div>

        {/* Interactive Marathi Voiceover Welcome & Audio Guide */}
        <CustomerVoiceGuide 
          restaurantName={restaurantName}
          tableNumber={table}
          darkMode={darkMode}
        />
        
        {/* Banner option: Reopen previous order if one exists */}
        {pastOrders.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex gap-2">
              <Clock className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">{t.reopenPrevious}</h4>
                <p className="text-[10px] text-slate-500 font-medium">Reopen status of your last food order.</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentOrderId(pastOrders[0].id)}
              className="text-[10px] font-black text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-xs"
            >
              Track
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchFood}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none text-sm focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 shadow-xs"
          />
        </div>

        {/* Horizontal Category List scroller */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin select-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedCategory === 'All' 
                ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/10 scale-95' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.all}
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedCategory === cat.id 
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/10 scale-95' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'mr' ? cat.labelMr : language === 'hi' ? cat.labelHi : cat.name}
            </button>
          ))}
        </div>

        {/* Menu Food Grid list */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-white border border-slate-100 rounded-2xl">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold">{t.emptyCart}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => {
              const cartItem = cart[item.id];
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-2xl p-3 flex gap-3.5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Photo */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-extrabold text-slate-800 text-sm line-clamp-1 leading-tight">{item.name}</h3>
                        <span className="text-sm font-black text-orange-600">₹{item.price}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${item.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {item.inStock ? t.inStock : t.outOfStock}
                      </span>

                      {item.inStock ? (
                        cartItem ? (
                          <div className="flex items-center bg-orange-50 border border-orange-200 rounded-xl px-1 py-0.5">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-orange-600 hover:bg-orange-100 rounded-lg shrink-0 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-black text-orange-600">{cartItem.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="p-1 text-orange-600 hover:bg-orange-100 rounded-lg shrink-0 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-xl">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Restaurant Info & Staff Login Footer */}
        <div className="mt-10 pt-6 pb-4 border-t border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Utensils className="w-3.5 h-3.5 text-orange-600" />
            <span>हॉटेल तारा • शुद्ध शाकाहारी व खानदेशी चव</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto">
            ऑर्डर दिल्यानंतर स्वयंपाकघरात थेट तयार होण्यास सुरुवात होते. कोणतीही अडचण असल्यास कृपया आमच्या कर्मचाऱ्यांशी संपर्क साधा.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/30 px-3 py-1.5 rounded-xl transition-all"
            >
              <span>🔐 मालक / कर्मचारी डॅशबोर्ड लॉगिन</span>
            </a>
          </div>
        </div>

      </div>

      {/* Floating Bottom Sticky Cart Summary bar */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent max-w-md mx-auto pointer-events-none z-30">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl pointer-events-auto cursor-pointer"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white relative">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
                  {getCartCount()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">{t.cart}</span>
                <span className="text-sm font-black text-slate-100 leading-none mt-1 inline-block">₹{getCartTotal()}</span>
              </div>
            </div>
            
            <button
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1 active:scale-95"
            >
              View Cart <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Slide-Up Cart drawer modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center max-w-md mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl border-t border-slate-100"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600 animate-pulse" />
                  <span>{t.cart} ({getCartCount()} {t.items})</span>
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {(Object.values(cart) as OrderItem[]).map((item) => (
                  <div key={item.id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.name}</h4>
                      <span className="text-xs text-orange-600 font-bold block mt-0.5">₹{item.price} each</span>
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-xl px-1 py-0.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg shrink-0 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-black text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const originalItem = menuItems.find(i => i.id === item.id);
                          if (originalItem) addToCart(originalItem);
                        }}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg shrink-0 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Billing Block */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{t.total}:</span>
                  <span className="text-2xl font-black text-orange-600">₹{getCartTotal()}</span>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex gap-2">
                  <HeartHandshake className="w-5 h-5 text-orange-600 shrink-0" />
                  <p className="text-[10px] text-orange-800 font-medium leading-relaxed">
                    By placing your order, dishes will be sent directly to the chef's screen and prepared for Table <span className="font-bold text-slate-900">{table}</span>.
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-black shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t.placingOrder}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.placeOrder}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Active Tracker Minimap Badge */}
      {currentOrder && minimizeActiveTracker && (
        <div className="fixed bottom-20 left-4 z-30 pointer-events-auto">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setMinimizeActiveTracker(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full text-xs font-black shadow-lg shadow-orange-500/20 border border-orange-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>{t.trackOrder}: {t[currentOrder.status as keyof typeof t] || currentOrder.status}</span>
          </motion.button>
        </div>
      )}

      {/* My Orders & Past History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center max-w-md mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl border-t border-slate-100"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>{t.myOrders} / {t.history}</span>
                </h3>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                
                {/* Active Order Tracker if exists */}
                {currentOrder ? (
                  <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-orange-100">
                      <div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">{t.trackOrder}</span>
                        <h4 className="text-xs font-black text-slate-700 uppercase">ID: {currentOrder.id.substring(0, 8)}</h4>
                      </div>
                      <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black rounded-lg uppercase">
                        {t[currentOrder.status as keyof typeof t] || currentOrder.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-orange-200">
                      <span className="text-xs font-bold text-slate-500">{t.total}:</span>
                      <span className="text-sm font-black text-orange-600">₹{currentOrder.totalPrice}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setMinimizeActiveTracker(false);
                          setIsHistoryOpen(false);
                        }}
                        className="col-span-1 text-[10px] font-black py-2 bg-orange-600 text-white rounded-xl text-center shadow-xs cursor-pointer hover:bg-orange-700 transition-colors"
                      >
                        Track Live
                      </button>
                      <button
                        onClick={handleDownloadReceipt}
                        className="col-span-1 text-[10px] font-black py-2 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        onClick={handlePrintReceipt}
                        className="col-span-1 text-[10px] font-black py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Print
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Past Orders History List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{t.history}</span>
                  </h4>

                  {pastOrders.length === 0 && !currentOrder ? (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-400 font-bold">{t.noHistory}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pastOrders.map((order, index) => (
                        <div key={order.id || index} className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3 shadow-xs hover:border-orange-200 transition-colors">
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                            <div>
                              <span className="font-extrabold text-slate-800 uppercase block">Order #{order.id?.substring(0, 8) || (index + 1)}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-extrabold rounded-lg">
                              Table {order.tableNumber}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-slate-600 font-medium">
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-400">Total:</span>
                              <span className="text-sm font-black text-slate-800">₹{order.totalPrice}</span>
                            </div>
                            <button
                              onClick={() => {
                                // Create dynamic receipt specifically for this past order
                                const savedCurrentOrder = currentOrder;
                                // Temporarily swap active order to print/download
                                setCurrentOrder(order);
                                setTimeout(() => {
                                  handleDownloadReceipt();
                                  setCurrentOrder(savedCurrentOrder);
                                }, 100);
                              }}
                              className="text-[10px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Receipt
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom bar */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Utensils className="w-4 h-4" /> Close & Browse Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
