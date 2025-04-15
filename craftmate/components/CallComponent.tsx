// CallComponent.tsx
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type CallScreenRouteProp = RouteProp<{ params: { meetingId: string } }, 'params'>;

const CallComponent: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<CallScreenRouteProp>();
  
  // Use the meetingId passed via navigation; if not provided, fallback to "testmeeting"
  const meetingId = route.params?.meetingId || 'testmeeting';
  const jitsiURL = `https://meet.jit.si/${meetingId}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: jitsiURL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      {/* Floating End Call Button */}
      <TouchableOpacity 
        style={styles.endCallButton}
        onPress={() => navigation.navigate("video")}
      >
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  endCallButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
  endCallText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CallComponent;
