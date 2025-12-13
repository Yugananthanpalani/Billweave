import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDiRSpi7bd8Iyl6hvoH-v56YApBsFeWOOk",
  authDomain: "bill-weave.firebaseapp.com",
  databaseURL: "https://bill-weave-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bill-weave",
  storageBucket: "bill-weave.firebasestorage.app",
  messagingSenderId: "190307109934",
  appId: "1:190307109934:web:815b6491867da8d32ea3bf",
  measurementId: "G-EPDD00VGEQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
