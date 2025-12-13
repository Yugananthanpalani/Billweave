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

export const addCustomer = async (customer: Omit<Customer, 'id'>) => {
  // Ensure measurements is always an object
  const customerData = {
    ...customer,
    measurements: customer.measurements || {},
  };
  
  const docRef = await addDoc(customersCollection, {
    ...customerData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCustomer = async (id: string, customer: Partial<Customer>) => {
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

export const deleteCustomer = async (id: string) => {
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

export const getAllCustomers = async (): Promise<Customer[]> => {
  const q = query(customersCollection, orderBy('createdAt', 'desc'));
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

export const addBill = async (bill: Omit<Bill, 'id'>) => {
  const docRef = await addDoc(billsCollection, {
    ...bill,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBill = async (id: string, bill: Partial<Bill>) => {
  const docRef = doc(db, 'bills', id);
  await updateDoc(docRef, {
    ...bill,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBill = async (id: string) => {
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

export const getAllBills = async (): Promise<Bill[]> => {
  const q = query(billsCollection, orderBy('createdAt', 'desc'));
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

export const getCustomerBills = async (customerId: string): Promise<Bill[]> => {
  const q = query(billsCollection, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
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

export const addOrder = async (order: Omit<Order, 'id'>) => {
  const docRef = await addDoc(ordersCollection, {
    ...order,
    dueDate: Timestamp.fromDate(order.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateOrder = async (id: string, order: Partial<Order>) => {
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

export const deleteOrder = async (id: string) => {
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

export const getAllOrders = async (): Promise<Order[]> => {
  const q = query(ordersCollection, orderBy('createdAt', 'desc'));
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

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
  const docRef = await addDoc(inventoryCollection, {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
  const docRef = doc(db, 'inventory', id);
  await updateDoc(docRef, {
    ...item,
    updatedAt: Timestamp.now(),
  });
};

export const deleteInventoryItem = async (id: string) => {
  const docRef = doc(db, 'inventory', id);
  await deleteDoc(docRef);
};

export const getAllInventory = async (): Promise<InventoryItem[]> => {
  const q = query(inventoryCollection, orderBy('name', 'asc'));
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

export const generateBillNumber = async (): Promise<string> => {
  const q = query(billsCollection, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  const lastBillNumber = querySnapshot.docs[0]?.data().billNumber || 'BW-0000';
  const lastNumber = parseInt(lastBillNumber.split('-')[1]);
  const newNumber = lastNumber + 1;

  return `BW-${newNumber.toString().padStart(4, '0')}`;
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
  return email === 'yugananthanpalani@gmail.com';
};

export const createUserIfNotExists = async (email: string) => {
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    await addUser({
      email,
      role: isAdmin(email) ? 'admin' : 'user',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
};
