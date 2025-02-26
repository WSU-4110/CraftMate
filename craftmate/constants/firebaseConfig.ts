import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import * as AuthSession from "expo-auth-session";

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
export const googleConfig = {
    androidClientId: "95683048337-ue165ncdgure4n0gmrpjivfcaej4vpbe.apps.googleusercontent.com",
    iosClientId: "95683048337-m4pnb4up44s9al2706pkale26ukr6qer.apps.googleusercontent.com",
    webClientId: "95683048337-rvh0lkfppvf4st2e4o9dpu9khnc4hr9g.apps.googleusercontent.com",
    expoClientId: "95683048337-gar616c8ab5s0ct0svl5nd4fisgpqs41.apps.googleusercontent.com",
    redirectUri: "com.CSC4110.craftmate:/oauthredirect",// Add this line
};

export { auth, db };
