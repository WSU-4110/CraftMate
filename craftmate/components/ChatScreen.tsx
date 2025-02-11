import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

const MessagesScreen = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const handleAddMessage = () => {
        if (newMessage.trim().length > 0) {
            setMessages([...messages, { id: Date.now().toString(), text: newMessage }]);
            setNewMessage('');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
                style={styles.list}
            />
            <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
            />
            <Button
                title="Send"
                onPress={handleAddMessage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff'
    },
    list: {
        flex: 1,
        marginBottom: 10,
    },
    message: {
        fontSize: 18,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
    }
});

export default MessagesScreen;
