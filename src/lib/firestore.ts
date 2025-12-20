import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Customer, Bill, Order, InventoryItem, User } from '../types';

const convertTimestamp = (date: Date | Timestamp) => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  return date;
};

export const customersCollection = collection(db, 'customers');
export const billsCollection = collection(db, 'bills');
export const ordersCollection = collection(db, 'orders');
export const inventoryCollection = collection(db, 'inventory');
export const usersCollection = collection(db, 'users');

export const addCustomer = async (customer: Omit<Customer, 'id'>, userId: string) => {
  // Ensure measurements is always an object
  const customerData = {
    ...customer,
    measurements: customer.measurements || {},
    createdBy: userId,
  };
  
  const docRef = await addDoc(customersCollection, {
    ...customerData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCustomer = async (id: string, customer: Partial<Customer>, userId: string) => {
  // First check if user owns this customer or is admin
  const existingCustomer = await getCustomer(id);
  if (!existingCustomer) {
    throw new Error('Customer not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingCustomer.createdBy !== userId) {
    throw new Error('Unauthorized: You can only edit your own customers');
  }

  // Ensure measurements is always an object
  const customerData = {
    ...customer,
    measurements: customer.measurements || {},
  };
  
  const docRef = doc(db, 'customers', id);
  await updateDoc(docRef, {
    ...customerData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCustomer = async (id: string, userId: string) => {
  // First check if user owns this customer or is admin
  const existingCustomer = await getCustomer(id);
  if (!existingCustomer) {
    throw new Error('Customer not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingCustomer.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own customers');
  }

  const docRef = doc(db, 'customers', id);
  await deleteDoc(docRef);
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const docRef = doc(db, 'customers', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      measurements: data.measurements || {},
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Customer;
  }
  return null;
};

export const getAllCustomers = async (userId: string): Promise<Customer[]> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin can see all customers
    q = query(customersCollection, orderBy('createdAt', 'desc'));
  } else {
    // Regular users can only see their own customers
    q = query(customersCollection, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      measurements: data.measurements || {},
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Customer;
  });
};

export const addBill = async (bill: Omit<Bill, 'id'>, userId: string) => {
  const docRef = await addDoc(billsCollection, {
    ...bill,
    createdBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBill = async (id: string, bill: Partial<Bill>, userId: string) => {
  // First check if user owns this bill or is admin
  const existingBill = await getBill(id);
  if (!existingBill) {
    throw new Error('Bill not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingBill.createdBy !== userId) {
    throw new Error('Unauthorized: You can only edit your own bills');
  }

  const docRef = doc(db, 'bills', id);
  await updateDoc(docRef, {
    ...bill,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBill = async (id: string, userId: string) => {
  // First check if user owns this bill or is admin
  const existingBill = await getBill(id);
  if (!existingBill) {
    throw new Error('Bill not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingBill.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own bills');
  }

  const docRef = doc(db, 'bills', id);
  await deleteDoc(docRef);
};

export const getBill = async (id: string): Promise<Bill | null> => {
  const docRef = doc(db, 'bills', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Bill;
  }
  return null;
};

export const getAllBills = async (userId: string): Promise<Bill[]> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin can see all bills
    q = query(billsCollection, orderBy('createdAt', 'desc'));
  } else {
    // Regular users can only see their own bills
    q = query(billsCollection, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Bill;
  });
};

export const getCustomerBills = async (customerId: string, userId: string): Promise<Bill[]> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin can see all bills for any customer
    q = query(billsCollection, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  } else {
    // Regular users can only see their own bills for their own customers
    q = query(billsCollection, 
      where('customerId', '==', customerId), 
      where('createdBy', '==', userId), 
      orderBy('createdAt', 'desc')
    );
  }
  
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Bill;
  });
};

export const addOrder = async (order: Omit<Order, 'id'>, userId: string) => {
  const docRef = await addDoc(ordersCollection, {
    ...order,
    createdBy: userId,
    dueDate: Timestamp.fromDate(order.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateOrder = async (id: string, order: Partial<Order>, userId: string) => {
  // First check if user owns this order or is admin
  const existingOrder = await getOrder(id);
  if (!existingOrder) {
    throw new Error('Order not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingOrder.createdBy !== userId) {
    throw new Error('Unauthorized: You can only edit your own orders');
  }

  const updateData: any = {
    ...order,
    updatedAt: Timestamp.now(),
  };

  if (order.dueDate) {
    updateData.dueDate = Timestamp.fromDate(order.dueDate);
  }

  const docRef = doc(db, 'orders', id);
  await updateDoc(docRef, updateData);
};

export const deleteOrder = async (id: string, userId: string) => {
  // First check if user owns this order or is admin
  const existingOrder = await getOrder(id);
  if (!existingOrder) {
    throw new Error('Order not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingOrder.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own orders');
  }

  const docRef = doc(db, 'orders', id);
  await deleteDoc(docRef);
};

export const getOrder = async (id: string): Promise<Order | null> => {
  const docRef = doc(db, 'orders', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dueDate: convertTimestamp(data.dueDate),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Order;
  }
  return null;
};

export const getAllOrders = async (userId: string): Promise<Order[]> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin can see all orders
    q = query(ordersCollection, orderBy('createdAt', 'desc'));
  } else {
    // Regular users can only see their own orders
    q = query(ordersCollection, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: convertTimestamp(data.dueDate),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Order;
  });
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>, userId: string) => {
  const docRef = await addDoc(inventoryCollection, {
    ...item,
    createdBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>, userId: string) => {
  // First check if user owns this item or is admin
  const existingItem = await getInventoryItem(id);
  if (!existingItem) {
    throw new Error('Inventory item not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingItem.createdBy !== userId) {
    throw new Error('Unauthorized: You can only edit your own inventory items');
  }

  const docRef = doc(db, 'inventory', id);
  await updateDoc(docRef, {
    ...item,
    updatedAt: Timestamp.now(),
  });
};

export const deleteInventoryItem = async (id: string, userId: string) => {
  // First check if user owns this item or is admin
  const existingItem = await getInventoryItem(id);
  if (!existingItem) {
    throw new Error('Inventory item not found');
  }
  
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin && existingItem.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own inventory items');
  }

  const docRef = doc(db, 'inventory', id);
  await deleteDoc(docRef);
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  const docRef = doc(db, 'inventory', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as InventoryItem;
  }
  return null;
};

export const getAllInventory = async (userId: string): Promise<InventoryItem[]> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin can see all inventory items
    q = query(inventoryCollection, orderBy('name', 'asc'));
  } else {
    // Regular users can only see their own inventory items
    q = query(inventoryCollection, where('createdBy', '==', userId), orderBy('name', 'asc'));
  }
  
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as InventoryItem;
  });
};

export const generateBillNumber = async (userId: string): Promise<string> => {
  const isAdmin = await checkIsAdmin(userId);
  
  let q;
  if (isAdmin) {
    // Admin generates from all bills
    q = query(billsCollection, orderBy('createdAt', 'desc'));
  } else {
    // Regular users generate from their own bills
    q = query(billsCollection, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);

  let lastNumber = 0;
  if (!querySnapshot.empty) {
    const lastBillNumber = querySnapshot.docs[0]?.data().billNumber || 'BW-0000';
    lastNumber = parseInt(lastBillNumber.split('-')[1]);
  }
  
  const newNumber = lastNumber + 1;

  return `BW-${newNumber.toString().padStart(4, '0')}`;
};

// Helper function to check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const user = await getUser(userId);
  return user?.role === 'admin' || false;
};

// User Management Functions
export const addUser = async (user: Omit<User, 'id'>) => {
  const docRef = await addDoc(usersCollection, {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateUser = async (id: string, user: Partial<User>) => {
  const docRef = doc(db, 'users', id);
  await updateDoc(docRef, {
    ...user,
    updatedAt: Timestamp.now(),
  });
};

export const deleteUser = async (id: string) => {
  const docRef = doc(db, 'users', id);
  await deleteDoc(docRef);
};

export const getUser = async (id: string): Promise<User | null> => {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      lastLogin: data.lastLogin ? convertTimestamp(data.lastLogin) : undefined,
    } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(usersCollection, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      lastLogin: data.lastLogin ? convertTimestamp(data.lastLogin) : undefined,
    } as User;
  }
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(usersCollection, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      lastLogin: data.lastLogin ? convertTimestamp(data.lastLogin) : undefined,
    } as User;
  });
};

export const updateUserLastLogin = async (email: string) => {
  const user = await getUserByEmail(email);
  if (user) {
    await updateUser(user.id, { lastLogin: new Date() });
  }
};

// Admin Functions
export const isAdmin = (email: string): boolean => {
  return email === 'admin@billweave.com';
};

export const createUserIfNotExists = async (email: string, shopName?: string) => {
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    await addUser({
      email,
      shopName: shopName || (isAdmin(email) ? 'Admin Panel' : 'My Tailor Shop'),
      role: isAdmin(email) ? 'admin' : 'user',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
};
