import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { addBill, addOrder, generateBillNumber, getAllCustomers } from '../lib/firestore';
import { Customer, BillItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function BillForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  const { appUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', name: '', quantity: 1, price: 0, total: 0 },
  ]);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('pending');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [createOrder, setCreateOrder] = useState(true);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadCustomers();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  // Check if user is blocked
  useEffect(() => {
    if (appUser?.isBlocked) {
      alert('Your account has been blocked. You cannot create bills.');
      navigate('/');
    }
  }, [appUser, navigate]);
  
  const loadCustomers = async () => {
    if (!appUser?.id) return;
    try {
      const data = await getAllCustomers(appUser.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', quantity: 1, price: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'price') {
            updated.total = updated.quantity * updated.price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = (subtotal * taxPercentage) / 100;
  const total = subtotal + tax;
  const amountDue = total - amountPaid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    if (items.some((item) => !item.name || item.price <= 0)) {
      alert('Please fill in all item details');
      return;
    }
    
    if (!appUser?.id) {
      alert('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
      if (!selectedCustomer) {
        throw new Error('Customer not found');
      }

      const billNumber = await generateBillNumber(appUser.id);

      const billData = {
        billNumber,
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items,
        subtotal,
        tax,
        taxPercentage,
        total,
        paymentStatus,
        amountPaid,
        amountDue,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const billId = await addBill(billData, appUser.id);

      if (createOrder) {
        await addOrder({
          billId,
          billNumber,
          customerId: selectedCustomerId,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          status: 'pending',
          dueDate: new Date(dueDate),
          items,
          total,
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        }, appUser.id);
      }

      navigate(`/bills/${billId}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bills')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Bill</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Shirt Stitching"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-semibold">
                    ₹{item.total.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="max-w-xs ml-auto space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">GST:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(parseFloat(e.target.value))}
                    min="0"
                    step="0.1"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm">%</span>
                  <span className="font-semibold ml-2">₹{tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as 'paid' | 'pending' | 'partial')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                min="0"
                max={total}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-semibold text-red-600">
                ₹{amountDue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createOrder"
                checked={createOrder}
                onChange={(e) => setCreateOrder(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="createOrder" className="text-sm font-medium text-gray-700">
                Create order for this bill
              </label>
            </div>
            {createOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required={createOrder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any additional notes or instructions..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating...' : 'Create Bill'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/bills')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
