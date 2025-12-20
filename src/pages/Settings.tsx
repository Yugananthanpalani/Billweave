import { useState } from 'react';
import { updateUser } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import { User, CreditCard as Edit, Save, X } from 'lucide-react';

export default function Settings() {
  const { user, appUser } = useAuth();
  const [isEditingShopName, setIsEditingShopName] = useState(false);
  const [editShopName, setEditShopName] = useState(appUser?.shopName || '');
  const [saving, setSaving] = useState(false);

  const handleEditShopName = () => {
    setEditShopName(appUser?.shopName || '');
    setIsEditingShopName(true);
  };

  const handleSaveShopName = async () => {
    if (!appUser?.id || !editShopName.trim()) return;
    
    setSaving(true);
    try {
      await updateUser(appUser.id, { shopName: editShopName.trim() });
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating shop name:', error);
      alert('Failed to update shop name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingShopName(false);
    setEditShopName(appUser?.shopName || '');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Shop Name</div>
              {isEditingShopName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter shop name"
                  />
                  <button
                    onClick={handleSaveShopName}
                    disabled={saving || !editShopName.trim()}
                    className="p-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="p-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-gray-900">{appUser?.shopName || 'Not Set'}</div>
                  <button
                    onClick={handleEditShopName}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit shop name"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-semibold text-gray-900">{user?.email}</div>
              <div className="text-sm text-gray-600 mt-2">Role</div>
              <div className="font-semibold text-gray-900">{appUser?.role || 'User'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About BillWeave</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Version:</strong> 1.0.1
          </p>
          <p>
            <strong>Description:</strong> A comprehensive tailor shop billing system for managing
            customers, bills, orders, and inventory.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Customer management with detailed measurements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Bill creation with automatic GST calculation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>PDF invoice generation and printing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Order tracking with status management</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Payment tracking with partial payment support</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Inventory management for fabrics and accessories</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Dashboard with business insights</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
