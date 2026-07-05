import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWnexgszM3JxKKj1yrcWQffBpOV1WXzkk",
  authDomain: "gen-lang-client-0416236551.firebaseapp.com",
  projectId: "gen-lang-client-0416236551",
  storageBucket: "gen-lang-client-0416236551.firebasestorage.app",
  messagingSenderId: "81105980899",
  appId: "1:81105980899:web:c06b428d6abedfd430e4d6"
};

// Lazy initialization of Firebase to prevent startup crashes if config isn't ready
let app: any;
let db: any;

function getFirebaseDb() {
  if (!db) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, "ai-studio-hthngqunlbnhngph-7f9d19f2-0108-42aa-b07e-06b90222946d");
  }
  return db;
}

// Generates a random 6-digit code
export function generateSyncCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export interface SyncPayload {
  products: any[];
  categories: any[];
  customers: any[];
  suppliers: any[];
  orders: any[];
  purchaseOrders: any[];
  debtTransactions: any[];
  logs: any[];
  storeConfig: any;
}

/**
 * Uploads current data payload to Firestore with the given sync code.
 * If no sync code is provided, a new one is generated and returned.
 */
export async function uploadToFirebaseSync(code: string | null, payload: SyncPayload): Promise<{ success: boolean; code: string; updatedAt: string; message?: string }> {
  try {
    const firestore = getFirebaseDb();
    let targetCode = code?.trim() || "";
    
    if (!targetCode) {
      // Loop to guarantee unique code
      let attempts = 0;
      let exists = true;
      while (exists && attempts < 5) {
        targetCode = generateSyncCode();
        const docRef = doc(firestore, "sync_rooms", targetCode);
        const docSnap = await getDoc(docRef);
        exists = docSnap.exists();
        attempts++;
      }
    }

    const updatedAt = new Date().toISOString();
    const docRef = doc(firestore, "sync_rooms", targetCode);
    
    await setDoc(docRef, {
      data: payload,
      updatedAt
    }, { merge: true });

    return {
      success: true,
      code: targetCode,
      updatedAt
    };
  } catch (error: any) {
    console.error("Firebase Sync Upload Error:", error);
    return {
      success: false,
      code: "",
      updatedAt: "",
      message: error.message || "Không thể tải dữ liệu lên Firebase Firestore."
    };
  }
}

/**
 * Downloads data payload from Firestore for the given sync code.
 */
export async function downloadFromFirebaseSync(code: string): Promise<{ success: boolean; data?: SyncPayload; updatedAt?: string; message?: string }> {
  try {
    const firestore = getFirebaseDb();
    const targetCode = code.trim();
    if (!targetCode) {
      return { success: false, message: "Mã đồng bộ không hợp lệ!" };
    }

    const docRef = doc(firestore, "sync_rooms", targetCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        message: "Mã đồng bộ không tồn tại hoặc dữ liệu đã bị xóa khỏi hệ thống Cloud Firestore!"
      };
    }

    const docData = docSnap.data();
    return {
      success: true,
      data: docData.data,
      updatedAt: docData.updatedAt
    };
  } catch (error: any) {
    console.error("Firebase Sync Download Error:", error);
    return {
      success: false,
      message: error.message || "Không thể kết nối hoặc tải dữ liệu từ Firebase."
    };
  }
}
