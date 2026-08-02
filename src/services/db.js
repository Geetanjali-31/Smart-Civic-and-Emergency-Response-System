import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { app } from '../firebase';

export const db = getFirestore(app);

// --- USER PROFILES ---
export const createUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// --- REPORTS (Civic & Emergency) ---
export const createReport = async (reportData) => {
  try {
    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, {
      ...reportData,
      createdAt: serverTimestamp(),
      status: 'pending' // Default status
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

export const updateReportStatus = async (reportId, newStatus) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
};

// Real-time listener for all Live Requests (For Authority Dashboard)
export const subscribeToAllActiveReports = (callback) => {
  const q = query(
    collection(db, 'reports'), 
    where('status', 'in', ['pending', 'accepted']),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(reports);
  });
};

// Real-time listener for reports by a specific citizen
export const subscribeToCitizenReports = (uid, callback) => {
  const q = query(
    collection(db, 'reports'), 
    where('reporterId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(reports);
  });
};

// --- NOTIFICATIONS ---
export const createNotification = async (notificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const subscribeToUserNotifications = (uid, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(notifications);
  });
};
