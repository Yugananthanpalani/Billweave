import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard as Edit, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { getCustomer, getCustomerBills, deleteCustomer } from '../lib/firestore';
import { Customer, Bill } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    if (!id || !appUser?.id) return;
    try {
      const [customerData, billsData] = await Promise.all([
        getCustomer(id),
        getCustomerBills(id, appUser.id),
      ]);
      setCustomer(customerData);
      setBills(billsData);
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !customer || !appUser?.id) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${customer.name}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteCustomer(id, appUser.id);
        navigate('/customers');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Link to="/customers" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  const totalSpent = bills.reduce((sum, bill) => sum + bill.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/customers/${id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Measurements</h2>
            {!customer.measurements || Object.values(customer.measurements).every(val => val === undefined) ? (
              <p className="text-gray-500">No measurements recorded</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(customer.measurements).map(([key, value]) => {
                  if (value === undefined) return null;
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase());
                  return (
                    <div key={key} className="border border-gray-200 rounded-md p-3">
                      <div className="text-sm text-gray-600">{label}</div>
                      <div className="text-lg font-semibold text-gray-900">{value}"</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill History</h2>
            {bills.length === 0 ? (
              <p className="text-gray-500">No bills yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bills.map((bill) => (
                  <Link
                    key={bill.id}
                    to={`/bills/${bill.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{bill.billNumber}</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                              bill.paymentStatus
                            )}`}
                          >
                            {bill.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{bill.total.toFixed(2)}</p>
                        {bill.paymentStatus !== 'paid' && (
                          <p className="text-sm text-red-600">Due: ₹{bill.amountDue.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Total Bills</div>
                <div className="text-2xl font-bold text-gray-900">{bills.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Spent</div>
                <div className="text-2xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Customer Since</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <Link
            to={`/bills/new?customerId=${id}`}
            className="block bg-blue-600 text-white text-center px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Bill
          </Link>
        </div>
      </div>
    </div>
  );
}
