import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, AlertCircle, TrendingUp, Plus, Calendar, Eye, Sparkles } from 'lucide-react';
import { getAllBills, getAllOrders, updateOrder } from '../lib/firestore';
import { Bill, Order } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      setRecentOrders(
        recentOrders.map((order) => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      // Reload dashboard data to update active orders count
      loadDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [bills, orders] = await Promise.all([getAllBills(), getAllOrders()]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayBills = bills.filter((bill) => {
        const billDate = new Date(bill.createdAt);
        billDate.setHours(0, 0, 0, 0);
        return billDate.getTime() === today.getTime();
      });

      setTodayOrders(todayBills.length);

      const total = bills.reduce((sum, bill) => sum + bill.total, 0);
      setTotalSales(total);

      const pending = bills
        .filter((bill) => bill.paymentStatus === 'pending' || bill.paymentStatus === 'partial')
        .reduce((sum, bill) => sum + bill.amountDue, 0);
      setPendingPayments(pending);

      const active = orders.filter(
        (order) => order.status === 'pending' || order.status === 'in_progress'
      ).length;
      setActiveOrders(active);

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Today's Orders",
      value: todayOrders,
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Sales',
      value: `₹${totalSales.toFixed(0)}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Pending Payments',
      value: `₹${pendingPayments.toFixed(0)}`,
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Active Orders',
      value: activeOrders,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      case 'delivered':
        return 'status-delivered';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Welcome Message */}
        <div className="bg-white rounded-3xl p-4 md:p-6 text-black card-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-lg md:text-2xl font-bold">Welcome back!</h1>
          </div>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            {user?.email ? `Hello ${user.email.split('@')[0]}` : 'Ready to manage your tailor shop?'}
          </p>
          <Link
            to="/bills/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Bill
          </Link>
        </div>
        
        {/* Quick Stats Header */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-black">Today's Overview</h2>
          <p className="text-gray-600 mt-1">Here's what's happening in your business today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-black p-2 md:p-3 rounded-xl">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-base md:text-2xl font-bold text-black">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-black">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-black hover:text-gray-700 text-sm font-medium flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View All
            </Link>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentOrders.length === 0 ? (
            <div className="p-6 md:p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet</p>
              <Link
                to="/bills/new"
                className="text-black hover:text-gray-700 font-medium mt-2 inline-block"
              >
                Create your first bill
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 md:p-6 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        to={`/bills/${order.billId}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 text-sm md:text-base transition-colors"
                      >
                        {order.billNumber}
                      </Link>
                      <span className={`status-badge ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <Link
                      to={`/customers/${order.customerId}`}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors block truncate"
                    >
                      {order.customerName}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-black text-sm md:text-base">
                      ₹{order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Status Update Dropdown */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700">Update Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/customers/new"
          className="bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200 text-center group touch-target"
        >
          <div className="bg-black p-3 rounded-xl inline-flex mb-3 group-hover:bg-gray-800 transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <p className="font-medium text-black text-xs md:text-sm">Add Customer</p>
        </Link>
        
        <Link
          to="/bills/new"
          className="bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200 text-center group touch-target"
        >
          <div className="bg-black p-3 rounded-xl inline-flex mb-3 group-hover:bg-gray-800 transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <p className="font-medium text-black text-xs md:text-sm">Create Bill</p>
        </Link>
        
        <Link
          to="/inventory"
          className="bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200 text-center group touch-target"
        >
          <div className="bg-black p-3 rounded-xl inline-flex mb-3 group-hover:bg-gray-800 transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <p className="font-medium text-black text-xs md:text-sm">Add Item</p>
        </Link>
        
        <Link
          to="/orders"
          className="bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200 text-center group touch-target"
        >
          <div className="bg-black p-3 rounded-xl inline-flex mb-3 group-hover:bg-gray-800 transition-colors">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <p className="font-medium text-black text-xs md:text-sm">View Orders</p>
        </Link>
      </div>

      {/* Floating Action Button for Mobile */}
      <Link to="/bills/new" className="floating-action-btn md:hidden">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}