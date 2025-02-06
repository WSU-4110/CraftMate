import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyAQm45HnWtTVVmBvVTtegSpDdUVKt-0P0c",
authDomain: "craftmate-aacfe.firebaseapp.com",
projectId: "craftmate-aacfe",
storageBucket: "craftmate-aacfe.firebasestorage.app",
messagingSenderId: "95683048337",
appId: "1:95683048337:android:48334c1aa6b1d7004c2030"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
