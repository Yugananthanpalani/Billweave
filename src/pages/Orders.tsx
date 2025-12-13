import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter, ShoppingBag, MessageCircle } from 'lucide-react';
import { getAllOrders, updateOrder } from '../lib/firestore';
import { Order } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      setOrders(
        orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleShareWhatsApp = (order: Order, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const message = `Hi ${order.customerName}! 

Order Update:
📋 Order: ${order.billNumber}
📅 Due Date: ${new Date(order.dueDate).toLocaleDateString()}
📊 Status: ${order.status.replace('_', ' ').toUpperCase()}
💰 Total: ₹${order.total.toFixed(2)}

${order.notes ? `📝 Notes: ${order.notes}` : ''}

Thank you for choosing BillWeave Tailors!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const statusFilters = [
    { value: 'all', label: 'All', count: orders.length },
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'in_progress', label: 'In Progress', count: orders.filter(o => o.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filterStatus === filter.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center card-shadow">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here when bills are created'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Link
                        to={`/bills/${order.billId}`}
                        className="text-base md:text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {order.billNumber}
                      </Link>
                      <span className={`status-badge ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {isOverdue(order.dueDate) && order.status !== 'completed' && order.status !== 'delivered' && (
                        <span className="status-badge bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/customers/${order.customerId}`}
                      className="text-gray-900 font-medium hover:text-blue-600 transition-colors block"
                    >
                      {order.customerName}
                    </Link>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg md:text-xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {item.name} (x{item.quantity})
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <p className="text-sm text-gray-600 mb-4 italic bg-gray-50 p-3 rounded-xl">
                    {order.notes}
                  </p>
                )}

                {/* Status Update */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <label className="text-sm font-medium text-gray-700">Update Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as Order['status'])
                    }
                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end">
                  <button
                    onClick={(e) => handleShareWhatsApp(order, e)}
                    className="touch-target p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors md:flex md:items-center md:gap-1 md:px-3 md:py-1 md:rounded-md"
                    title="Share Update on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 md:w-3 md:h-3" />
                    <span className="hidden md:inline text-xs">Share Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}