import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from "../constants/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, DocumentData, serverTimestamp, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';





interface Reply {
    id: string;
    content: string;
    timestamp: Date; // Ensure this aligns with how you're handling dates
    authorId: string;
}

interface RepliesComponentProps {
    postId: string;
}

function RepliesComponent({ postId }: RepliesComponentProps) {
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newReply, setNewReply] = useState('');
    const [currentUser, setCurrentUser] = useState<DocumentData | null>(null);

    useEffect(() => {
        const auth = getAuth();
        setCurrentUser(auth.currentUser); // Set the current user

        const repliesRef = collection(db, "posts", postId, "replies");
        const q = query(repliesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const repliesData: Reply[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                repliesData.push({
                    id: doc.id,
                    content: data.content,
                    timestamp: data.timestamp?.toDate?.() || new Date(), // Convert Firestore timestamp to Date
                    authorId: data.authorID || data.authorId || '',
                });
            });
            setReplies(repliesData);
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, [postId]);

    const handleAddReply = async (replyContent: string) => {
        if (!replyContent.trim()) {
          Alert.alert("Cannot send", "Your reply cannot be empty.");
          return;
        }
      
        const repliesRef = collection(db, 'posts', postId, 'replies');
        try {
          await addDoc(repliesRef, {
            content: replyContent,
            authorId: currentUser?.uid,
            timestamp: serverTimestamp(),
          });
      
          // 🔥 Increment the comments count on the parent post
          const postRef = doc(db, 'posts', postId);
          await updateDoc(postRef, {
            comments: increment(1),
          });
      
          setNewReply('');
          Alert.alert("Success", "Reply posted successfully.");
        } catch (error) {
          console.error('Error adding reply:', error);
          Alert.alert("Error", "Failed to post reply.");
        }
      };
      

    const handleDeleteReply = async (replyId: string) => {
        try {
          // Delete the reply
          const replyRef = doc(db, "posts", postId, "replies", replyId);
          await deleteDoc(replyRef);
      
          // Decrement the comments count
          const postRef = doc(db, "posts", postId);
          await updateDoc(postRef, {
            comments: increment(-1),
          });
      
          Alert.alert("Deleted", "Reply deleted successfully.");
        } catch (error) {
          console.error("Error deleting reply:", error);
          Alert.alert("Error", "Failed to delete reply.");
        }
      };
      
    
    

      return (
        <View>
          <FlatList
            data={replies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.replyCard}>
                <Text style={styles.replyAuthor}>User: {item.authorId}</Text>
                <Text style={styles.replyText}>{item.content}</Text>
      
                {item.authorId === currentUser?.uid && (
                  <TouchableOpacity onPress={() => handleDeleteReply(item.id)}>
                    <View style={styles.deleteButton}>
                      <Ionicons name="trash" size={16} color="white" />
                      <Text style={styles.deleteText}>Delete</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
      
          <View style={styles.replyBox}>
            <TextInput
              style={styles.input}
              placeholder="Write a reply..."
              value={newReply}
              onChangeText={setNewReply}
            />
            <TouchableOpacity onPress={() => handleAddReply(newReply)}>
              <Ionicons name="send" size={24} color="blue" />
            </TouchableOpacity>
          </View>
        </View>
      );
      
}

const styles = StyleSheet.create({
    reply: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    replyBox: {
        flexDirection: 'row',
        padding: 10
    },
    input: {
        flex: 1,
        borderWidth: 1,
        marginRight: 10,
        padding: 8
    }, 

    replyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
      
      replyText: {
        fontSize: 14,
        color: 'white',
        marginBottom: 8,
      },
      replyCard: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginHorizontal: 10,
        marginVertical: 6,
        padding: 10,
        backgroundColor: '#1e1e1e',
      },
      replyAuthor: {
        fontSize: 12,
        color: 'gray',
        marginBottom: 4,
      },
      deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'red',
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
      },
      
      deleteText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 4,
      },


      
    
});

export default RepliesComponent;
