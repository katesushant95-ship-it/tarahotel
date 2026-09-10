import React, { useState, useEffect } from 'react';
import OwnerAuth from './components/OwnerAuth';
import OwnerDashboard from './components/OwnerDashboard';
import CustomerMenu from './components/CustomerMenu';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [userUid, setUserUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCustomerView, setIsCustomerView] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Check query parameters or pathname to decide router view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isMenuPath = window.location.pathname === '/menu';
    const hasTableQuery = params.has('table') || params.has('t');
    const hasRestaurantQuery = params.has('restaurantId') || params.has('r');
    
    // Also support hash route fallback e.g. #/menu
    const isHashMenu = window.location.hash.includes('/menu');

    if (isMenuPath || hasTableQuery || hasRestaurantQuery || isHashMenu) {
      setIsCustomerView(true);
    } else {
      setIsCustomerView(false);
    }
  }, []);

  // Listen to local session for Hotel Tara owner dashboard
  useEffect(() => {
    if (isCustomerView) {
      setAuthLoading(false);
      return;
    }

    const isLoggedIn = localStorage.getItem('hotel_tara_logged_in') === 'true';
    if (isLoggedIn) {
      setUserUid('hotel_tara_owner');
    } else {
      setUserUid(null);
    }
    setAuthLoading(false);
  }, [isCustomerView]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600 mb-2" />
        <p className="text-slate-600 font-bold text-base">हॉटेल तारा ॲप सुरू होत आहे...</p>
        <p className="text-xs text-slate-400 mt-1">Please wait while the dashboard is initialized.</p>
      </div>
    );
  }

  // Router dispatcher
  if (isCustomerView) {
    return <CustomerMenu darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }

  return userUid ? (
    <OwnerDashboard 
      ownerId={userUid} 
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
      onLogout={() => {
        localStorage.removeItem('hotel_tara_logged_in');
        setUserUid(null);
      }} 
    />
  ) : (
    <OwnerAuth onAuthSuccess={(uid) => setUserUid(uid)} />
  );
}

