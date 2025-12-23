export interface Measurements {
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeveLengthh?: number;
  shirtLength?: number;
  neck?: number;
  inseam?: number;
  outseam?: number;
  [key: string]: number | undefined;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  measurements: Measurements;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  taxPercentage: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountPaid: number;
  amountDue: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id?: string;
  billId: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;

  status: 'pending' | 'in_progress' | 'completed' | 'delivered';

  dueDate: Date;
  items: any[];
  total: number;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}


export interface InventoryItem {
  id: string;
  name: string;
  type: 'fabric' | 'service' | 'accessory';
  quantity: number;
  unit: string;
  price: number;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  todayOrders: number;
  totalSales: number;
  pendingPayments: number;
  activeOrders: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopName: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalBills: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  blockedUsers: number;
}
