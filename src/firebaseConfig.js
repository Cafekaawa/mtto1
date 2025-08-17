// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCslm6UfXWDB7A34EBaWyUAa30HwY1ac80",
  authDomain: "mtto-29893.firebaseapp.com",
  projectId: "mtto-29893",
  storageBucket: "mtto-29893.firebasestorage.app",
  messagingSenderId: "103549229284",
  appId: "1:103549229284:web:fdd469280d64362677f4f1",
  measurementId: "G-9B6CZK3K1B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db }; // Export db so you can use it in other files