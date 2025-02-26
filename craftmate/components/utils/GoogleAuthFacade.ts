// utils/GoogleAuthFacade.ts
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, googleConfig } from "../../constants/firebaseConfig";
import Toast from "react-native-toast-message";
import * as AuthSession from "expo-auth-session";

class GoogleAuthFacade {
  private static instance: GoogleAuthFacade;
  private request: any;
  private response: any;
  private promptAsync: any;
  private redirectUri: string;

  private constructor() {
    this.redirectUri = AuthSession.makeRedirectUri({
      native: "com.CSC4110.craftmate:/oauthredirect",
    });

    // Initialize Gooogle Sign-In request
    [this.request, this.response, this.promptAsync] = Google.useAuthRequest({
      androidClientId: googleConfig.androidClientId,
      iosClientId: googleConfig.iosClientId,
      webClientId: googleConfig.webClientId,
      redirectUri: this.redirectUri,
    });
  }

  // Singleton: Ensuere only one instance
  public static getInstance(): GoogleAuthFacade {
    if (!GoogleAuthFacade.instance) {
      GoogleAuthFacade.instance = new GoogleAuthFacade();
    }
    return GoogleAuthFacade.instance;
  }

  // Function to trfigger Google Sign-In
  public async signIn() {
    try {
      const response = await this.promptAsync();
      if (response?.type === "success") {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      } else {
        throw new Error("Google Sign-In Canceled");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Google Sign-In Failed",
        text2: error.message,
      });
      return null;
    }
  }
}

export default GoogleAuthFacade;
