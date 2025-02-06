import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../constants/firebaseConfig";
import styles from "./LoginScreen.styles";

export default function LoginScreen(){
    const [email, setEmail] = useState("");
    const [password, setPassword] =useState("");
    
    const handleLogin = async () => {
        try {
            console.log("Test1")
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(user.displayName)
            
        } catch (error: any) {
            console.log("Login Failed", error.message);
        }
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}></Text>
            <TextInput 
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            />
            <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />
            <Button title="Login" onPress={handleLogin} />
        </View>
    )
};