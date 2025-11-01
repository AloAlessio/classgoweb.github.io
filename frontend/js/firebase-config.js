// Firebase Client SDK Configuration
// Este archivo contiene la configuración del cliente Firebase para el frontend

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5D1UCIQ2nzNwVPHFoub46uflwM4PKzmo",
  authDomain: "classgo-324dd.firebaseapp.com",
  projectId: "classgo-324dd",
  storageBucket: "classgo-324dd.firebasestorage.app",
  messagingSenderId: "1079859024722",
  appId: "1:1079859024722:web:13b56092cc678063c6e08b",
  measurementId: "G-H5QE3QHPTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics (opcional - comentado por defecto para evitar problemas CSP)
// const analytics = getAnalytics(app);

// Export services for use in other modules
export { app, auth, db, firebaseConfig };

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseConfig = firebaseConfig;
}
