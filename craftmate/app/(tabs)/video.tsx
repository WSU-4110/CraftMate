import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { auth, db } from "../../constants/firebaseConfig";
import { RTCView } from 'react-native-webrtc';
import { FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function VideoScreen() {
  const colorScheme = useColorScheme();
  const [callStatus, setCallStatus] = useState('Waiting for user...');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callerUser, setCallerUser] = useState(null);
  const [calleeUser, setCalleeUser] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Set up user ID for both caller and callee (Firebase logic will fill in)
      setCallerUser(user.uid); // Caller is the currently authenticated user
    }
  }, []);

  // Placeholder for fetching other user from Firebase (callee)
  const fetchCalleeUser = async (calleeId: string) => {
    const userDocRef = doc(db, 'users', calleeId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const calleeData = userDocSnap.data();
      setCalleeUser(calleeData); // Set callee data
    } else {
      console.error('Callee not found!');
    }
  };

  const startCall = () => {
    if (!calleeUser) {
      setCallStatus('No callee available!');
      return;
    }

    // Begin call logic (replace with actual WebRTC implementation)
    setCallStatus('Calling...');

    // Example of setting call data to Firestore (Firebase Realtime Database can also be used)
    const callDocRef = doc(db, 'calls', `${callerUser}_${calleeUser.uid}`);
    setDoc(callDocRef, {
      caller: callerUser,
      callee: calleeUser.uid,
      status: 'calling',
      timestamp: new Date(),
    }).then(() => {
      // Simulate WebRTC or signaling setup
      console.log('Call started');
    });
  };

  const endCall = () => {
    // End call logic
    setCallStatus('Call Ended');
    setLocalStream(null);
    setRemoteStream(null);

    // Example of updating the call status in Firestore
    const callDocRef = doc(db, 'calls', `${callerUser}_${calleeUser.uid}`);
    updateDoc(callDocRef, { status: 'ended' }).then(() => {
      console.log('Call ended');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
        Video Call
      </Text>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        {/* Local Video (User's own video) */}
        <View style={[styles.videoBox, { borderColor: Colors[colorScheme ?? 'light'].text }]}>
          <Text style={[styles.videoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Local</Text>
          {localStream ? (
            <Text>Local Video Stream</Text> // Placeholder for local video stream
          ) : (
            <Text>No Local Stream</Text>
          )}
        </View>

        {/* Remote Video (Other user's video) */}
        <View style={[styles.videoBox, { borderColor: Colors[colorScheme ?? 'light'].text }]}>
          <Text style={[styles.videoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Remote</Text>
          {remoteStream ? (
            <Text>Remote Video Stream</Text> // Placeholder for remote video stream
          ) : (
            <Text>No Remote Stream</Text>
          )}
        </View>
      </View>

      {/* Buttons for actions */}
      <View style={styles.buttonsContainer}>
        <Button title="Start Call" onPress={startCall} />
        <Button title="End Call" onPress={endCall} />
      </View>

      {/* Status Message */}
      <Text style={[styles.status, { color: Colors[colorScheme ?? 'light'].text }]}>
        {callStatus}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  videoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  videoBox: {
    width: 150,
    height: 150,
    borderWidth: 2,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  videoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: '500',
  },
});