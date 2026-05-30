import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, Clock } from 'lucide-react';
import api from '../api';
import DashboardLayout from '../layouts/DashboardLayout';
import { getUser } from '../store/authStore';

interface Stats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  popularItems: Array<{ name: string; totalQuantity: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/theatre-admin');
        if (data.success) setStats(data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const metrics = stats ? [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
  ] : [];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{m.label}</p>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${m.color}`}>
                    <m.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Popular Items */}
          {stats && stats.popularItems.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900">Popular Items Today</h3>
              </div>
              <div className="space-y-3">
                {stats.popularItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-5">#{idx + 1}</span>
                      <span className="text-sm text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{item.totalQuantity} sold</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
