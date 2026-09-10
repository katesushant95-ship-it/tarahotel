import React from 'react';
import { ShoppingBag, Clock, CheckCircle2, TrendingUp, IndianRupee } from 'lucide-react';
import { Order } from '../types';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  orders: Order[];
}

export default function DashboardStats({ orders }: DashboardStatsProps) {
  // Calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const stats = [
    {
      id: "stat-total",
      title: 'Total Orders',
      value: totalOrders,
      icon: ShoppingBag,
      color: 'from-slate-500 to-slate-600',
      bgLight: 'bg-slate-100 text-slate-700',
      description: 'All received orders'
    },
    {
      id: "stat-pending",
      title: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgLight: 'bg-yellow-50 text-yellow-600',
      description: 'Waiting for action'
    },
    {
      id: "stat-preparing",
      title: 'Active Prep',
      value: preparingOrders,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50 text-orange-600',
      description: 'Preparing in kitchen'
    },
    {
      id: "stat-completed",
      title: 'Completed',
      value: completedOrders,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50 text-emerald-600',
      description: 'Served successfully'
    },
    {
      id: "stat-revenue",
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'from-orange-500 to-yellow-500',
      bgLight: 'bg-orange-500 text-white shadow-lg shadow-orange-100',
      description: 'From completed orders'
    }
  ];

  return (
    <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {stat.title}
            </span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {stat.value}
            </h3>
            <span className="text-[10px] text-slate-400 block font-medium">
              {stat.description}
            </span>
          </div>
          <div className={`p-3.5 rounded-2xl ${stat.bgLight} shrink-0`}>
            <stat.icon className="w-6 h-6" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
