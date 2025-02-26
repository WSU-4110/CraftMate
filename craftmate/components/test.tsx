import React, { useState, useEffect } from "react";
import { View, Text, Button, StatusBar } from "react-native";
import { GoogleSignin, GoogleSigninButton, User as GoogleUser } from "@react-native-google-signin/google-signin";
import styles from "./LoginScreen.styles";

export default function TestPage() {
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<GoogleUser | null>(null);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "95683048337-gar616c8ab5s0ct0svl5nd4fisgpqs41.apps.googleusercontent.com",
        });
    }, []);

    const signin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const user1 = await GoogleSignin.signIn();
            
            console.log("Sign-in Response:", user1); // Debugging: Check the structure of user1
            
            setUserInfo(user1 as unknown as GoogleUser); // Type Assertion to match expected type
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const logout = async () => {
        try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            setUserInfo(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text>{JSON.stringify(error)}</Text>
            {userInfo && <Text>{JSON.stringify(userInfo)}</Text>}
            {userInfo ? (
                <Button title="Logout" onPress={logout} />
            ) : (
                <GoogleSigninButton
                    size={GoogleSigninButton.Size.Standard}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={signin}
                />
            )}
            <StatusBar barStyle="default" />
        </View>
    );
}
