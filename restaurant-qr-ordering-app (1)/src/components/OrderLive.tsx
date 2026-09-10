import React from 'react';
import { db, doc, updateDoc, deleteDoc } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { Clock, Play, CheckCircle, CookingPot, UtensilsCrossed, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderLiveProps {
  orders: Order[];
  onOrderUpdated?: () => void;
}

export default function OrderLive({ orders, onOrderUpdated }: OrderLiveProps) {
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // We only show active (incomplete) orders in the live queue
  const activeOrders = orders.filter(o => o.status !== 'completed').sort((a, b) => {
    // Sort pending first, then by date (oldest first so kitchen works in order)
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'accepted';
    if (currentStatus === 'pending') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'completed';

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (onOrderUpdated) onOrderUpdated();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  const getStatusBadgeStyles = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusActionButtonLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Accept Order';
      case 'accepted':
        return 'Start Preparing';
      case 'preparing':
        return 'Complete Order';
      case 'completed':
        return 'Completed';
    }
  };

  const getStatusActionIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return Play;
      case 'accepted':
        return CookingPot;
      case 'preparing':
        return CheckCircle;
      default:
        return CheckCircle;
    }
  };

  const formatElapsedTime = (dateString: string) => {
    try {
      const differenceMs = new Date().getTime() - new Date(dateString).getTime();
      const mins = Math.floor(differenceMs / 60000);
      if (mins < 1) return 'Just now';
      return `${mins}m ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          Live Kitchen Order Queue ({activeOrders.length})
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor customer requests in real-time. Accept, prepare, and complete orders as they come in.
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
          <CookingPot className="w-16 h-16 text-slate-300 mb-2 animate-bounce" />
          <p className="text-slate-500 font-bold text-base">No Active Orders Right Now</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            When customers scan table QR codes and place orders, they will instantly chime and appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {activeOrders.map((order) => {
              const ActionIcon = getStatusActionIcon(order.status);
              return (
                <motion.div
                  key={order.id}
                  layoutId={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`border rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between ${
                    order.status === 'pending' ? 'border-amber-300 ring-2 ring-amber-500/10' :
                    order.status === 'accepted' ? 'border-blue-200' : 'border-orange-200'
                  }`}
                >
                  {/* Order Card Header */}
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">TABLE</span>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
                        {order.tableNumber}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${getStatusBadgeStyles(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatElapsedTime(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div className="p-4 flex-1 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Ordered</span>
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex gap-2">
                            <span className="font-bold text-slate-700 bg-slate-100 w-5 h-5 rounded-md flex items-center justify-center text-xs">
                              {item.quantity}
                            </span>
                            <span className="font-semibold text-slate-800 line-clamp-1">{item.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-bold">₹{item.price * item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Order Card Footer */}
                  <div className="p-4 border-t border-slate-50 bg-slate-50/20 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Total Price:</span>
                      <span className="text-lg font-black text-orange-600">₹{order.totalPrice}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                          order.status === 'pending' ? 'bg-amber-500 hover:bg-amber-600' :
                          order.status === 'accepted' ? 'bg-blue-600 hover:bg-blue-700' :
                          'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        <ActionIcon className="w-4 h-4 shrink-0" />
                        <span>{getStatusActionButtonLabel(order.status)}</span>
                      </button>

                      {deleteConfirmId === order.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="py-2 px-2 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                            title="Confirm delete"
                          >
                            Sure?
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="py-2 px-2 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(order.id)}
                          className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Cancel/Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
export { playNotificationSound } from '../lib/soundNotification';

