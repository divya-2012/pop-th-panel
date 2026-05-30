import { useEffect, useState } from 'react';
import { Plus, Pencil, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api';
import DashboardLayout from '../layouts/DashboardLayout';

interface MenuItem {
  id: string; name: string; description: string | null; price: number;
  isVeg: boolean; isAvailable: boolean; categoryId: string;
}
interface Category { id: string; name: string; sortOrder: number; isActive: boolean; items: MenuItem[]; }

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [catForm, setCatForm] = useState({ name: '', sortOrder: '0' });
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', isVeg: true, categoryId: '' });
  const [saving, setSaving] = useState(false);

  const fetchMenu = async () => {
    try {
      const { data } = await api.get('/menu/admin');
      if (data.success) setCategories(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  // Category handlers
  const openCreateCat = () => { setEditingCat(null); setCatForm({ name: '', sortOrder: '0' }); setShowCatModal(true); };
  const openEditCat = (c: Category) => { setEditingCat(c); setCatForm({ name: c.name, sortOrder: c.sortOrder.toString() }); setShowCatModal(true); };
  const saveCat = async () => {
    setSaving(true);
    try {
      const payload = { name: catForm.name, sortOrder: parseInt(catForm.sortOrder) };
      if (editingCat) await api.put(`/menu/categories/${editingCat.id}`, payload);
      else await api.post('/menu/categories', payload);
      setShowCatModal(false); fetchMenu();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  // Item handlers
  const openCreateItem = (categoryId: string) => {
    setEditingItem(null);
    setItemForm({ name: '', description: '', price: '', isVeg: true, categoryId });
    setShowItemModal(true);
  };
  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description || '', price: item.price.toString(), isVeg: item.isVeg, categoryId: item.categoryId });
    setShowItemModal(true);
  };
  const saveItem = async () => {
    setSaving(true);
    try {
      const payload = { name: itemForm.name, description: itemForm.description || null, price: parseFloat(itemForm.price), isVeg: itemForm.isVeg, categoryId: itemForm.categoryId };
      if (editingItem) await api.put(`/menu/items/${editingItem.id}`, payload);
      else await api.post('/menu/items', payload);
      setShowItemModal(false); fetchMenu();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleAvailability = async (itemId: string) => {
    try { await api.patch(`/menu/items/${itemId}/toggle-availability`); fetchMenu(); }
    catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories and items</p>
        </div>
        <button onClick={openCreateCat} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-center text-gray-400 py-8">Loading menu...</div>
      ) : categories.length === 0 ? (
        <div className="mt-6 text-center text-gray-400 py-8">No categories. Create your first category.</div>
      ) : (
        <div className="mt-6 space-y-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200">
              {/* Category Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                  <span className="text-xs text-gray-400">{cat.items.length} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditCat(cat)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="h-3.5 w-3.5 text-gray-400" /></button>
                  <button onClick={() => openCreateItem(cat.id)} className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800">
                    <Plus className="h-3 w-3" /> Item
                  </button>
                </div>
              </div>

              {/* Items */}
              {cat.items.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No items in this category</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cat.items.map(item => (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50">
                      {/* Veg indicator */}
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">₹{item.price}</p>

                      {/* Availability Toggle */}
                      <button onClick={() => toggleAvailability(item.id)} className="flex-shrink-0" title={item.isAvailable ? 'Available' : 'Unavailable'}>
                        {item.isAvailable ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-300" />
                        )}
                      </button>

                      <button onClick={() => openEditItem(item)} className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowCatModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(p => ({ ...p, sortOrder: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCatModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveCat} disabled={saving} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowItemModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                <input type="number" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">Type:</label>
                <button onClick={() => setItemForm(p => ({ ...p, isVeg: true }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${itemForm.isVeg ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>🟢 Veg</button>
                <button onClick={() => setItemForm(p => ({ ...p, isVeg: false }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!itemForm.isVeg ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}>🔴 Non-Veg</button>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowItemModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={saveItem} disabled={saving} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
