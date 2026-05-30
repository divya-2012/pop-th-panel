import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import api from '../api';
import DashboardLayout from '../layouts/DashboardLayout';
import { getUser } from '../store/authStore';

interface User {
  id: string; name: string; email: string; role: string;
  createdAt: string;
}

export default function Staff() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'COUNTER_STAFF' });
  const [saving, setSaving] = useState(false);
  const currentUser = getUser();

  const fetchUsers = async () => {
    try { 
      const { data } = await api.get('/users'); 
      if (data.success) {
        // Filter out Super Admins, and only show users belonging to this theatre
        // Ideally backend should filter, but we filter here for prototype
        const filtered = data.data.filter((u: any) => u.theatreId === currentUser?.theatreId && u.role !== 'SUPER_ADMIN');
        setUsers(filtered);
      }
    }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/users', { ...form, theatreId: currentUser?.theatreId });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'COUNTER_STAFF' });
      fetchUsers();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    try { await api.delete(`/users/${id}`); fetchUsers(); }
    catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Counter Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff accounts for {currentUser?.theatreName || 'this theatre'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm">
          <Plus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
            <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
            <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
            <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">Loading staff...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">No staff found. Add one above.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4"><span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700">{u.role.replace('_', ' ')}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id} className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed group">
                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="john@theatre.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="••••••••" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
