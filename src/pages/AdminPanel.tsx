import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Shield, 
  Ban, 
  Trash2, 
  Eye,
  Search,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { 
  getAllUsers, 
  getAllCustomers, 
  getAllBills, 
  getAllOrders, 
  getAllInventory,
  updateUser,
  deleteUser,
  deleteBill,
  deleteOrder,
  deleteCustomer,
  deleteInventoryItem
} from '../lib/firestore';
import { User, Customer, Bill, Order, InventoryItem, AdminStats } from '../types';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'customers' | 'bills' | 'orders' | 'inventory'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalBills: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    blockedUsers: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [usersData, customersData, billsData, ordersData, inventoryData] = await Promise.all([
        getAllUsers(),
        getAllCustomers(),
        getAllBills(),
        getAllOrders(),
        getAllInventory(),
      ]);

      setUsers(usersData);
      setCustomers(customersData);
      setBills(billsData);
      setOrders(ordersData);
      setInventory(inventoryData);

      // Calculate stats
      const totalRevenue = billsData.reduce((sum, bill) => sum + bill.total, 0);
      const activeUsers = usersData.filter(user => !user.isBlocked).length;
      const blockedUsers = usersData.filter(user => user.isBlocked).length;

      setStats({
        totalUsers: usersData.length,
        totalCustomers: customersData.length,
        totalBills: billsData.length,
        totalOrders: ordersData.length,
        totalRevenue,
        activeUsers,
        blockedUsers,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await updateUser(userId, { isBlocked });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isBlocked } : user
      ));
      setStats(prev => ({
        ...prev,
        activeUsers: isBlocked ? prev.activeUsers - 1 : prev.activeUsers + 1,
        blockedUsers: isBlocked ? prev.blockedUsers + 1 : prev.blockedUsers - 1,
      }));
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === 'yugananthanpalani@gmail.com') {
      alert('Cannot delete admin user');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleDeleteBill = async (billId: string, billNumber: string) => {
    if (window.confirm(`Are you sure you want to delete bill ${billNumber}?`)) {
      try {
        await deleteBill(billId);
        setBills(bills.filter(bill => bill.id !== billId));
        setStats(prev => ({ ...prev, totalBills: prev.totalBills - 1 }));
      } catch (error) {
        console.error('Error deleting bill:', error);
        alert('Failed to delete bill');
      }
    }
  };

  const handleDeleteOrder = async (orderId: string, billNumber: string) => {
    if (window.confirm(`Are you sure you want to delete order ${billNumber}?`)) {
      try {
        await deleteOrder(orderId);
        setOrders(orders.filter(order => order.id !== orderId));
        setStats(prev => ({ ...prev, totalOrders: prev.totalOrders - 1 }));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete customer ${customerName}?`)) {
      try {
        await deleteCustomer(customerId);
        setCustomers(customers.filter(customer => customer.id !== customerId));
        setStats(prev => ({ ...prev, totalCustomers: prev.totalCustomers - 1 }));
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const handleDeleteInventoryItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete inventory item ${itemName}?`)) {
      try {
        await deleteInventoryItem(itemId);
        setInventory(inventory.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        alert('Failed to delete inventory item');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBills = bills.filter(bill =>
    bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
    { id: 'bills', label: 'Bills', icon: FileText, count: bills.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'inventory', label: 'Inventory', icon: Package, count: inventory.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, data, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-red-500' : 'bg-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-600 p-2 md:p-3 rounded-xl">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-base md:text-2xl font-bold text-black">{stats.totalUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-600 p-2 md:p-3 rounded-xl">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-base md:text-2xl font-bold text-black">₹{stats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-600 p-2 md:p-3 rounded-xl">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Bills</p>
                <p className="text-base md:text-2xl font-bold text-black">{stats.totalBills}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-600 p-2 md:p-3 rounded-xl">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-base md:text-2xl font-bold text-black">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Blocked Users</span>
                  <span className="font-semibold text-red-600">{stats.blockedUsers}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => setActiveTab('bills')}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  View All Bills
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Manage Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar for other tabs */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-red-600" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{user.email}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`status-badge ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                        <span className={`status-badge ${
                          user.isBlocked ? 'status-pending' : 'status-paid'
                        }`}>
                          {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    {user.lastLogin && (
                      <p>Last Login: {new Date(user.lastLogin).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {user.email !== 'yugananthanpalani@gmail.com' && (
                    <>
                      <button
                        onClick={() => handleBlockUser(user.id, !user.isBlocked)}
                        className={`p-2 rounded-xl transition-colors ${
                          user.isBlocked
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        }`}
                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                      >
                        {user.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                  {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Added: {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                    title="View Customer"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bills Tab */}
      {activeTab === 'bills' && (
        <div className="space-y-3">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-blue-600">{bill.billNumber}</h3>
                    <span className={`status-badge ${
                      bill.paymentStatus === 'paid' ? 'status-paid' :
                      bill.paymentStatus === 'pending' ? 'status-pending' : 'status-partial'
                    }`}>
                      {bill.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{bill.customerName}</p>
                  <p className="text-sm text-gray-600">₹{bill.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(bill.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/bills/${bill.id}`}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                    title="View Bill"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteBill(bill.id, bill.billNumber)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-blue-600">{order.billNumber}</h3>
                    <span className={`status-badge ${
                      order.status === 'pending' ? 'status-pending' :
                      order.status === 'in_progress' ? 'status-in-progress' :
                      order.status === 'completed' ? 'status-completed' : 'status-delivered'
                    }`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600">₹{order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(order.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/bills/${order.billId}`}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                    title="View Order"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteOrder(order.id, order.billNumber)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-3">
          {filteredInventory.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <span className={`status-badge ${
                      item.type === 'fabric' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'service' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity} {item.unit}
                  </p>
                  <p className="text-sm text-gray-600">Price: ₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleDeleteInventoryItem(item.id, item.name)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}