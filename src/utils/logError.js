import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const logError = async (error, componentInfo = 'Unknown Component', user = null) => {
  try {
    await addDoc(collection(db, "errorLogs"), {
      message: error.message || 'An unknown error occurred',
      stack: error.stack || 'No stack trace available',
      component: componentInfo,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
      userAgent: navigator.userAgent,
      url: window.location.href,
      user: user ? { uid: user.uid, fullName: user.fullName, role: user.role } : null,
    });
    console.error("Error logged to Firestore:", error);
  } catch (firestoreError) {
    console.error("Failed to log error to Firestore:", firestoreError);
  }
};

export default logError;