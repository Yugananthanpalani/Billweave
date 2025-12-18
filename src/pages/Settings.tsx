import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

export default function Settings() {
  const { user, appUser } = useAuth();

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
              <div className="font-semibold text-gray-900 mb-2">{appUser?.shopName || 'Not Set'}</div>
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
            <strong>Version:</strong> 1.0.0
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Firebase Configuration</h2>
        <p className="text-sm text-gray-600 mb-2">
          To configure Firebase for this application, update the environment variables in your{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:
        </p>
        <div className="bg-gray-50 p-4 rounded-md text-sm font-mono text-gray-700 space-y-1">
          <div>VITE_FIREBASE_API_KEY=your_api_key</div>
          <div>VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain</div>
          <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
          <div>VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket</div>
          <div>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</div>
          <div>VITE_FIREBASE_APP_ID=your_app_id</div>
        </div>
      </div>
    </div>
  );
}
