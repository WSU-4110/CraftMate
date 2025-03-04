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


export const googleConfig = {
    androidClientId: "95683048337-gar616c8ab5s0ct0svl5nd4fisgpqs41.apps.googleusercontent.com",
    iosClientId: "95683048337-jr9b4n2mtl02fmhflav5ip17k6ggq46l.apps.googleusercontent.com",

  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
