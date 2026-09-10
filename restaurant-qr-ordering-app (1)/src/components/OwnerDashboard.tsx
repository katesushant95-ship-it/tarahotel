import React, { useState, useEffect, useRef } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  auth, 
  signOut, 
  doc, 
  updateDoc, 
  OperationType, 
  handleFirestoreError 
} from '../lib/firebase';
import { Order, Language } from '../types';
import { soundManager, playNotificationSound } from '../lib/soundNotification';
import DashboardStats from './DashboardStats';
import OrderLive from './OrderLive';
import MenuManager from './MenuManager';
import QRManager from './QRManager';
import OrderHistory from './OrderHistory';
import SettingsPanel from './SettingsPanel';
import { 
  ShoppingBag, 
  Clock, 
  QrCode, 
  Calendar, 
  Settings, 
  LogOut, 
  User, 
  UtensilsCrossed,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  Eye,
  X,
  Sparkles,
  Menu,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OwnerDashboardProps {
  ownerId: string;
  onLogout: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface OrderAlert {
  id: string;
  tableNumber: string;
  totalPrice: number;
  itemsSummary: string;
  time: string;
}

export default function OwnerDashboard({ ownerId, onLogout, darkMode = false, toggleDarkMode }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'menu' | 'qr' | 'history' | 'settings'>('live');
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantName, setRestaurantName] = useState('हॉटेल तारा');
  const [logoUrl, setLogoUrl] = useState('');
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.isSoundEnabled());
  const [isScreenFlashing, setIsScreenFlashing] = useState(false);
  const [desktopNotifGranted, setDesktopNotifGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  
  // Refs to track first load
  const isFirstLoad = useRef(true);
  const existingOrderIds = useRef<Set<string>>(new Set());

  // Listen to owner profile changes
  useEffect(() => {
    const docRef = doc(db, 'users', ownerId);
    
    const unsubscribe = onSnapshot(
      docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRestaurantName(data.restaurantName || 'हॉटेल तारा');
          setLogoUrl(data.logoUrl || '');
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${ownerId}`);
      }
    );

    return () => unsubscribe();
  }, [ownerId]);

  // Real-time listener for incoming orders
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('ownerId', '==', ownerId));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        setOrders(fetchedOrders);

        // Check for truly NEW incoming orders via docChanges
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const orderId = change.doc.id;
            const orderData = change.doc.data() as Order;

            // Only trigger alert if it's NOT the first initial bulk load
            // AND it's a pending order, AND we haven't seen it in this session
            if (!isFirstLoad.current && orderData.status === 'pending' && !existingOrderIds.current.has(orderId)) {
              existingOrderIds.current.add(orderId);
              
              // 1. Play realistic multi-tone restaurant service bell chime
              soundManager.playChime();

              // 2. Start tab title alert so owner sees notification if on another tab
              soundManager.startTabTitleAlert(orderData.tableNumber);

              // 3. Trigger screen ambient glow flash
              setIsScreenFlashing(true);
              setTimeout(() => {
                setIsScreenFlashing(false);
              }, 4000);

              // 4. Trigger desktop OS notification if permitted
              const itemsList = orderData.items 
                ? orderData.items.map(i => `${i.quantity}x ${i.name}`).join(', ') 
                : '';
              soundManager.showDesktopNotification(
                `🔔 नवीन ऑर्डर! टेबल #${orderData.tableNumber}`,
                `एकूण: ₹${orderData.totalPrice} • ${itemsList || 'Order Details'}`
              );

              // 5. Push to visual alerts stack
              const newAlert: OrderAlert = {
                id: orderId,
                tableNumber: orderData.tableNumber,
                totalPrice: orderData.totalPrice,
                itemsSummary: itemsList,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== orderId)]);
            } else {
              // Track existing IDs on load
              existingOrderIds.current.add(orderId);
            }
          }
        });

        // Clear first load blocker after initial data is synced
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubscribe();
      soundManager.stopTabTitleAlert();
    };
  }, [ownerId]);

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.unlockAudioContext();
    soundManager.playChime();
    setIsScreenFlashing(true);
    setTimeout(() => setIsScreenFlashing(false), 2000);
  };

  const handleRequestDesktopNotification = async () => {
    const granted = await soundManager.requestNotificationPermission();
    setDesktopNotifGranted(granted);
    if (granted) {
      soundManager.showDesktopNotification('हॉटेल तारा सूचना सक्षम', 'नवीन ऑर्डर आल्यावर तुम्हाला अशी सूचना मिळेल.');
    }
  };

  const handleAcceptOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      });
      removeAlert(orderId);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleViewOrder = (orderId: string) => {
    setActiveTab('live');
    removeAlert(orderId);
    soundManager.stopTabTitleAlert();
  };

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      onLogout();
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => {
      const remaining = prev.filter(alert => alert.id !== id);
      if (remaining.length === 0) {
        soundManager.stopTabTitleAlert();
      }
      return remaining;
    });
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div 
      id="dashboard-layout" 
      onClick={() => soundManager.stopTabTitleAlert()}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 relative"
    >
      
      {/* Real-time Visual Alert: Ambient Screen Flash / Edge Glow */}
      {isScreenFlashing && (
        <div 
          id="screen-alert-flash"
          className="fixed inset-0 pointer-events-none z-50 border-4 border-amber-500/80 shadow-[inset_0_0_80px_rgba(245,158,11,0.35)] animate-pulse transition-opacity duration-300"
        />
      )}

      {/* Slide-in Alerts List */}
      <div 
        id="order-alerts-stack"
        className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none px-2 sm:px-0"
      >
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.92, y: -10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-slate-900 border-l-4 border-amber-500 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 pointer-events-auto relative border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-start gap-3">
                <div className="relative p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <BellRing className="w-6 h-6 animate-bounce" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs">
                      नवीन ऑर्डर!
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">{alert.time}</span>
                  </div>
                  
                  <div className="mt-1 flex items-baseline gap-2">
                    <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                      टेबल #{alert.tableNumber}
                    </h4>
                    <span className="font-extrabold text-sm text-orange-600 dark:text-orange-400">
                      ₹{alert.totalPrice}
                    </span>
                  </div>

                  {alert.itemsSummary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                      {alert.itemsSummary}
                    </p>
                  )}
                </div>

                <button 
                  id={`dismiss-alert-${alert.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAlert(alert.id);
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Dismiss Alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons on Alert */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  id={`quick-accept-${alert.id}`}
                  onClick={(e) => handleAcceptOrder(e, alert.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>स्वीकारा (Accept)</span>
                </button>
                <button
                  id={`quick-view-${alert.id}`}
                  onClick={() => handleViewOrder(alert.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>तपशील (View)</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar Panel */}
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 text-slate-800 dark:text-slate-100 relative z-10">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 mb-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm" />
          ) : (
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-100 shrink-0">
              तारा
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-base tracking-tight truncate text-slate-900 dark:text-slate-100">
              {restaurantName}
            </h1>
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" /> Live Kitchen
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {[
            { id: 'live', name: 'Live Orders', icon: Clock, count: pendingOrdersCount },
            { id: 'menu', name: 'Menu Manager', icon: ShoppingBag },
            { id: 'qr', name: 'QR Tables', icon: QrCode },
            { id: 'history', name: 'Order History', icon: Calendar },
            { id: 'settings', name: 'Settings Panel', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tab.count !== undefined && tab.count > 0 && (
                    <span 
                      id="live-orders-badge"
                      className="px-2 py-0.5 text-[11px] font-black bg-amber-500 text-white rounded-full flex items-center gap-1 shadow-xs animate-pulse"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      {tab.count}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-orange-500" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Audio Alert Status & Controls Card in Sidebar */}
        <div className="mx-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ध्वनी सूचना (Alert Sound)
            </span>
            <button
              id="sidebar-toggle-sound"
              onClick={handleToggleSound}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                soundEnabled 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
              title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="sidebar-test-sound"
              onClick={handleTestSound}
              className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>बेल तपासा (Test)</span>
            </button>

            {!desktopNotifGranted && typeof window !== 'undefined' && 'Notification' in window && (
              <button
                id="sidebar-enable-desktop-notif"
                onClick={handleRequestDesktopNotification}
                className="py-1.5 px-2 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                title="Enable browser desktop notifications"
              >
                डेस्कटॉप
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2.5">
          <a
            href="?table=1&restaurantId=hotel_tara_owner"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 transition-colors shadow-2xs"
            title="Open customer QR menu for Table 1 in a new tab"
          >
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>ग्राहक मेनू (Table 1 Menu)</span>
            </span>
            <span className="text-[10px] font-black bg-orange-200/70 dark:bg-orange-900/60 px-1.5 py-0.5 rounded">
              नवीन टॅब
            </span>
          </a>

          <button
            id="sidebar-logout-button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Nav Rail) */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
              तारा
            </div>
          )}
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[130px]">{restaurantName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Customer View Link */}
          <a
            href="?table=1&restaurantId=hotel_tara_owner"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-all"
            title="Open customer QR menu for Table 1"
          >
            <UtensilsCrossed className="w-4 h-4" />
          </a>

          {/* Mobile Sound Controls */}
          <button
            id="mobile-toggle-sound"
            onClick={handleToggleSound}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled 
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' 
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
            title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="mobile-test-sound"
            onClick={handleTestSound}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Test Bell Sound"
          >
            <Bell className="w-4 h-4 text-amber-500" />
          </button>

          {toggleDarkMode && (
            <button
              id="mobile-toggle-darkmode"
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <button
            id="mobile-logout-button"
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Panel Frame */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        
        {/* Top Sound & Notification Quick Bar (Visible on desktop & mobile) */}
        <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Firestore Real-Time Sync सक्रिय (Live Orders Active)
            </span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                {pendingOrdersCount} नवीन ऑर्डर्स
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              id="header-toggle-sound"
              onClick={handleToggleSound}
              className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:text-amber-600 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>आवाज चालू (Sound ON)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">आवाज बंद (Muted)</span>
                </>
              )}
            </button>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <button
              id="header-test-sound"
              onClick={handleTestSound}
              className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>बेल तपासा (Test Chime)</span>
            </button>
          </div>
        </div>

        {/* Banner/Statistics bar (Shown on top of sub-tabs) */}
        <div className="p-4 md:p-6 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DashboardStats orders={orders} />
        </div>

        {/* Modular Screen Render */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'live' && <OrderLive orders={orders} />}
              {activeTab === 'menu' && <MenuManager ownerId={ownerId} />}
              {activeTab === 'qr' && <QRManager ownerId={ownerId} />}
              {activeTab === 'history' && <OrderHistory orders={orders} />}
              {activeTab === 'settings' && (
                <SettingsPanel 
                  ownerId={ownerId} 
                  onLanguageChanged={(lang) => {
                    // Update global state if language changes
                  }} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Android style, smooth, persistent) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2.5 px-3 flex justify-around items-center z-40 shadow-xl rounded-t-2xl">
        {[
          { id: 'live', name: 'Live Orders', icon: Clock, count: pendingOrdersCount },
          { id: 'menu', name: 'Menu Manager', icon: ShoppingBag },
          { id: 'qr', name: 'QR Tables', icon: QrCode },
          { id: 'history', name: 'History', icon: Calendar },
          { id: 'settings', name: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 font-semibold text-[10px] transition-colors cursor-pointer relative ${
                isActive ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.count !== undefined && tab.count > 0 && (
                  <span 
                    id="mobile-pending-badge"
                    className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] text-[9px] font-black bg-amber-500 text-white rounded-full flex items-center justify-center animate-pulse"
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <span>{tab.name.split(' ')[0]}</span>
              {isActive && (
                <motion.span 
                  layoutId="activeIndicator" 
                  className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-orange-600"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Sign Out?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Are you sure you want to log out of your restaurant administration panel?</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  id="confirm-logout-button"
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Log Out
                </button>
                <button
                  id="cancel-logout-button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
export { playNotificationSound };
