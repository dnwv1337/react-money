import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB18cwBK6M7EqSjZECRQ3tb8bSbtuIaOV4",
  authDomain: "money-app-ba8b2.firebaseapp.com",
  projectId: "money-app-ba8b2",
  storageBucket: "money-app-ba8b2.firebasestorage.app",
  messagingSenderId: "347102739898",
  appId: "1:347102739898:web:42eea90bdf8b659841f183",
  measurementId: "G-HVX74G7K6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const ai = getAI(app, { backend: new GoogleAIBackend() });

const aiModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite",
});
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const login = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Вход выполнен:", result.user); // Отладка
  } catch (error) {
    alert(error);
  }
};
const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(error);
  }
};
export {
  db,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  increment,
  serverTimestamp,
  auth,
  login,
  logout,
  aiModel,
};