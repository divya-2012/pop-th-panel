import { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, Clock, User, Armchair, StickyNote, Check, ChefHat, Package, Truck, X as XIcon, LayoutList, KanbanSquare } from 'lucide-react';
import api from '../api';
import DashboardLayout from '../layouts/DashboardLayout';
import { getSocket } from '../services/socket';


interface Order {
  id: string; orderNumber: string; customerName: string; mobileNumber: string | null;
  specialNote: string | null; status: string; totalAmount: number; createdAt: string;
  items: Array<{ id: string; quantity: number; priceAtTime: number; item: { name: string } }>;
  seat: { seatCode: string };
  statusLogs?: Array<{ status: string; createdAt: string; notes: string | null }>;
}

const STATUS_TABS = ['ALL', 'PLACED', 'ACKNOWLEDGED', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED'];
const KANBAN_COLUMNS = ['PLACED', 'ACKNOWLEDGED', 'PREPARING', 'READY', 'DELIVERED'];

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700 border-blue-200',
  ACKNOWLEDGED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PREPARING: 'bg-orange-100 text-orange-700 border-orange-200',
  READY: 'bg-green-100 text-green-700 border-green-200',
  DELIVERED: 'bg-gray-100 text-gray-600 border-gray-200',
  CLOSED: 'bg-gray-50 text-gray-400 border-gray-100',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

const NEXT_STATUS: Record<string, { label: string; status: string; icon: any }[]> = {
  PLACED: [{ label: 'Acknowledge', status: 'ACKNOWLEDGED', icon: Check }],
  ACKNOWLEDGED: [{ label: 'Start Preparing', status: 'PREPARING', icon: ChefHat }],
  PREPARING: [{ label: 'Mark Ready', status: 'READY', icon: Package }],
  READY: [{ label: 'Delivered', status: 'DELIVERED', icon: Truck }],
  DELIVERED: [{ label: 'Close Order', status: 'CLOSED', icon: Check }],
};

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 250);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
}

export default function LiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders');
      if (data.success) setOrders(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('new_order', (order: Order) => {
      setOrders(prev => [order, ...prev]);
      setNewOrderAlert(order);
      if (soundEnabled) playNotificationSound();
      setTimeout(() => setNewOrderAlert(null), 5000);
    });
    socket.on('order_status_update', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      if (selectedOrder?.id === updatedOrder.id) setSelectedOrder(updatedOrder);
    });
    return () => {
      socket.off('new_order');
      socket.off('order_status_update');
    };
  }, [soundEnabled, selectedOrder]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status, notes: `Status updated to ${status}` });
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(data.data);
      }
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Drag and drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order && order.status !== status) {
        updateStatus(orderId, status);
      }
    }
  };

  // Shared Order Card Component
  const OrderCard = ({ order, isDraggable = false }: { order: Order, isDraggable?: boolean }) => (
    <div
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && handleDragStart(e, order.id)}
      onClick={() => setSelectedOrder(order)}
      className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'hover:shadow-sm'} ${STATUS_COLORS[order.status] ? STATUS_COLORS[order.status].replace('bg-', 'hover:bg-opacity-50 border-').split(' ')[2] : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">#{order.orderNumber}</span>
          {!isDraggable && (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
              {order.status}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(order.createdAt)}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><User className="h-3 w-3 text-gray-400" /> {order.customerName}</div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Armchair className="h-3 w-3 text-gray-400" /> Seat {order.seat.seatCode}</div>
      </div>
      <div className="border-t border-gray-100 pt-2 mb-3">
        {order.items.slice(0, 3).map(item => (
          <p key={item.id} className="text-xs text-gray-500 py-0.5">{item.quantity}x <span className="font-medium text-gray-700">{item.item.name}</span></p>
        ))}
        {order.items.length > 3 && <p className="text-[10px] font-bold text-gray-400 mt-1">+{order.items.length - 3} MORE ITEMS</p>}
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-bold text-gray-900">₹{order.totalAmount}</span>
        {!isDraggable && NEXT_STATUS[order.status] && (
          <div className="flex gap-1">
            {NEXT_STATUS[order.status].map(action => (
              <button key={action.status} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, action.status); }} className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors shadow-sm">
                <action.icon className="h-3 w-3" /> {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-[60] bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-900/5 p-4 max-w-sm animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">New Order Placed!</p>
              <p className="text-xs font-medium text-gray-500 mt-1">#{newOrderAlert.orderNumber} • Seat {newOrderAlert.seat?.seatCode}</p>
            </div>
            <button onClick={() => setNewOrderAlert(null)} className="p-1 hover:bg-gray-50 rounded-lg transition-colors"><XIcon className="h-4 w-4 text-gray-400" /></button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Orders</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">{orders.length} total orders today</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${soundEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />} Sound
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutList className="h-4 w-4" /> List
            </button>
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <KanbanSquare className="h-4 w-4" /> Kanban
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all ${activeTab === tab ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                {tab === 'ALL' ? `ALL (${orders.length})` : `${tab} (${orders.filter(o => o.status === tab).length})`}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading ? <div className="col-span-full py-12 text-center text-gray-400 font-medium animate-pulse">Loading orders...</div> : filtered.length === 0 ? <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">No orders found</div> : filtered.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
          {KANBAN_COLUMNS.map(column => {
            const columnOrders = orders.filter(o => o.status === column);
            return (
              <div 
                key={column} 
                className="flex-shrink-0 w-80 bg-gray-50/80 rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column)}
              >
                <div className={`px-4 py-3 border-b flex items-center justify-between bg-white/50 backdrop-blur-sm ${STATUS_COLORS[column].split(' ')[2]}`}>
                  <h3 className={`text-xs font-bold tracking-wider ${STATUS_COLORS[column].split(' ')[1]}`}>{column}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-500 shadow-sm border border-gray-100">{columnOrders.length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columnOrders.map(order => <OrderCard key={order.id} order={order} isDraggable={true} />)}
                  {columnOrders.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs font-medium text-gray-400">Drop orders here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#FDFDFD] shadow-2xl flex flex-col transform transition-transform">
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XIcon className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span>
                <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(selectedOrder.createdAt)}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-3"><div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center"><User className="h-4 w-4 text-gray-500" /></div><span className="font-semibold text-gray-900">{selectedOrder.customerName}</span></div>
                <div className="flex items-center gap-3"><div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center"><Armchair className="h-4 w-4 text-gray-500" /></div><span className="font-medium text-gray-600">Seat <strong className="text-gray-900">{selectedOrder.seat.seatCode}</strong></span></div>
                {selectedOrder.mobileNumber && <div className="text-sm font-medium text-gray-600 ml-11">📱 {selectedOrder.mobileNumber}</div>}
                {selectedOrder.specialNote && <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2"><StickyNote className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /><span className="text-sm font-medium text-amber-800">{selectedOrder.specialNote}</span></div>}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 tracking-wide">ORDER SUMMARY</h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="space-y-3 mb-4">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600"><span className="text-gray-900 font-bold">{item.quantity}</span> × {item.item.name}</span>
                        <span className="font-bold text-gray-900">₹{(item.priceAtTime * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Total Amount</span>
                    <span className="text-xl font-black text-gray-900">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>
              {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">TIMELINE</h3>
                  <div className="space-y-4 pl-2">
                    {selectedOrder.statusLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== selectedOrder.statusLogs!.length - 1 && <div className="absolute left-2.5 top-5 bottom-[-16px] w-0.5 bg-gray-100" />}
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 z-10 ${idx === 0 ? 'bg-blue-500 ring-4 ring-blue-50' : 'bg-gray-200'}`} />
                        <div className="-mt-0.5">
                          <p className="text-sm font-bold text-gray-900">{log.status}</p>
                          <p className="text-xs font-medium text-gray-400 mt-0.5">{formatTime(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 bg-white border-t border-gray-100 flex gap-3">
              {NEXT_STATUS[selectedOrder.status]?.map(action => (
                <button key={action.status} onClick={() => updateStatus(selectedOrder.id, action.status)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"><action.icon className="h-4 w-4" /> {action.label}</button>
              ))}
              {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'CLOSED' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')} className="px-5 py-3 border-2 border-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
