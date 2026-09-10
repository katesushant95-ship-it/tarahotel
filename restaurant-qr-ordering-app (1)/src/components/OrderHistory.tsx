import React, { useState } from 'react';
import { db, doc, deleteDoc } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { Calendar, Search, Trash2, CheckCircle2, AlertCircle, ShoppingBag, ArrowDownAz, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderHistoryProps {
  orders: Order[];
  onOrderDeleted?: () => void;
}

export default function OrderHistory({ orders, onOrderDeleted }: OrderHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this historical order record? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      if (onOrderDeleted) onOrderDeleted();
    } catch (err) {
      console.error("Error deleting order from history:", err);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    // Status match
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Table match
    const matchesSearch = order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date match (order.createdAt format: ISO string, e.g., 2026-07-11T...)
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = order.createdAt ? order.createdAt.split('T')[0] : '';
      matchesDate = orderDate === dateFilter;
    }

    return matchesStatus && matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString || 'N/A';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-600" />
            Complete Order History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and review all previous and current food orders placed in your restaurant.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-50 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border border-slate-100">
        {/* Text Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Table or Food</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Table # or Dish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Status</label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs focus:ring-1 focus:ring-orange-500 appearance-none font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs focus:ring-1 focus:ring-orange-500 text-slate-600 font-medium"
          />
        </div>

        {/* Quick Clear */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDateFilter('');
            }}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">No Matching Orders Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Table</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ordered items</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Bill Total</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                  {/* Table */}
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-black">
                    Table {order.tableNumber}
                  </td>
                  {/* Items */}
                  <td className="px-6 py-4 text-slate-700 max-w-xs">
                    <div className="flex flex-col gap-0.5">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="truncate text-xs">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* Total */}
                  <td className="px-6 py-4 whitespace-nowrap text-right font-black text-orange-600">
                    ₹{order.totalPrice}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleDeleteHistory(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
