import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure user record in Firestore
    if (result.user) {
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "User",
          role: "caregiver", // default role
          createdAt: new Date().toISOString()
        });
      }
    }
    return result.user;
  } catch (error: any) {
    if (error?.code === "auth/unauthorized-domain" || String(error).includes("unauthorized-domain")) {
      console.warn("Google Sign-In notice: Current domain is not in Firebase Authorized Domains.");
    } else {
      console.error("Error signing in with Google:", error);
    }
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string, name: string, role: "caregiver" | "elderly") {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      if (name) {
        await updateProfile(res.user, { displayName: name });
      }
      // Save user record to Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: res.user.email,
        displayName: name || email.split("@")[0],
        role,
        createdAt: new Date().toISOString()
      });

      // If elderly, save to olderAdults collection
      if (role === "elderly") {
        await setDoc(doc(db, "olderAdults", res.user.uid), {
          id: res.user.uid,
          name: name || email.split("@")[0],
          avatar: "👴",
          age: 75,
          status: "online",
          lastActivity: "Active now",
          connectedCaregiverId: null,
          connectedCode: null,
          conditions: "General Wellness"
        });
      }
    }
    return res.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

