
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLYFYrwWnbhC6Qt1fHkTbRmkP3d7wuV7g",
  authDomain: "lynhuatuyhoa.firebaseapp.com",
  projectId: "lynhuatuyhoa",
  storageBucket: "lynhuatuyhoa.firebasestorage.app",
  messagingSenderId: "767281007173",
  appId: "1:767281007173:web:37f3dffa4c97a10c74712c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
