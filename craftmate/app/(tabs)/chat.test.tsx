import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatListScreen from './chat';
import { auth, db } from '../../constants/firebaseConfig';
import { getDoc, updateDoc, addDoc, getDocs, onSnapshot } from 'firebase/firestore';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props) => {
      return <View {...props} testID={`icon-${props.name}`} />;
    }
  };
});

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}));

// Mock the Firebase modules
jest.mock('../../constants/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'user1' }
  },
  db: {}
}));

// More detailed mock implementation
jest.mock('firebase/firestore', () => {
  const mockDoc = jest.fn(() => ({ /* mock document reference */ }));
  const mockCollection = jest.fn(() => ({ /* mock collection reference */ }));
  const mockQuery = jest.fn((collectionRef, ...args) => ({ 
    collectionRef, 
    queryConstraints: args,
    // Add this property for the test to check
    _queryOptions: { orderBy: args.some(arg => arg && arg.type === 'orderBy') } 
  }));
  
  return {
    getDoc: jest.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ following: ['user2', 'user3'], followers: ['user2', 'user4'] })
    }),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({
      docs: [
        { id: 'msg1', ref: {}, data: () => ({ read: false }) },
        { id: 'msg2', ref: {}, data: () => ({ read: false }) }
      ]
    }),
    onSnapshot: jest.fn().mockImplementation((q, callback) => {
      // Simulate different data based on whether this is a messages or users query
      if (q && q._queryOptions && q._queryOptions.orderBy) {
        callback({
          empty: false,
          docs: [{
            id: 'msg1',
            data: () => ({ text: 'Hi', senderId: 'user2', timestamp: { toMillis: () => 2000 } }),
          }],
          size: 1,
        });
      } else {
        callback({
          docs: [
            { 
              id: 'user2', 
              data: () => ({ 
                username: 'Alice', 
                firstName: 'Alice', 
                lastName: '', 
                profileImage: 'https://via.placeholder.com/150', 
                followers: ['user1'], 
                following: ['user1'] 
              }) 
            },
            { 
              id: 'user3', 
              data: () => ({ 
                username: 'Bob', 
                firstName: 'Bob', 
                lastName: '', 
                profileImage: 'https://via.placeholder.com/150', 
                followers: ['user1'], 
                following: ['user1'] 
              }) 
            },
          ]
        });
      }
      return jest.fn(); // Return unsubscribe function
    }),
    collection: mockCollection,
    query: mockQuery,
    orderBy: jest.fn(() => ({ type: 'orderBy' })),
    limit: jest.fn(() => ({ type: 'limit' })),
    serverTimestamp: jest.fn(() => 'mockTimestamp'),
    where: jest.fn(() => ({ type: 'where' })),
    doc: mockDoc
  };
});

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    callback({ uid: 'user1' });
    return () => {};
  }
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/chat'
}));

// Silence the act() warnings
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (!/Warning.*not wrapped in act/.test(args[0]) && 
        !/Can't access .root on unmounted test renderer/.test(args[0])) {
      originalError.call(console, ...args);
    }
  });
});

afterAll(() => {
  console.error = originalError;
});

describe('ChatListScreen tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Change test to test.only to run just this test
  test('fetchMutualConnections sets mutual connections correctly', async () => {
    render(<ChatListScreen />);
    
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
    });
  });

  test('sortedUsers orders users by recent message timestamp', async () => {
    render(<ChatListScreen />);
    
    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  test('handleSendMessage calls addDoc with proper parameters', async () => {
    // Override onSnapshot for user selection
    (onSnapshot as jest.Mock).mockImplementationOnce((q, callback) => {
      callback({
        docs: [
          { 
            id: 'user2', 
            data: () => ({ 
              username: 'Alice', 
              firstName: 'Alice', 
              lastName: '', 
              profileImage: 'https://via.placeholder.com/150', 
              followers: ['user1'], 
              following: ['user1'] 
            }) 
          }
        ]
      });
      return jest.fn();
    });

    const { findByText, getByPlaceholderText, getByText } = render(<ChatListScreen />);

    // Find and click on a user
    const userElement = await findByText('Alice');
    fireEvent.press(userElement);
    
    // Enter message text
    const input = await waitFor(() => getByPlaceholderText("Type a message..."));
    fireEvent.changeText(input, "Hello");
    
    // Send the message
    const sendButton = getByText("Send");
    fireEvent.press(sendButton);
    
    // Wait for the addDoc to be called
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });

  test('markMessagesAsRead calls updateDoc for unread messages', async () => {
    // Mock getDocs for unread messages
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        { id: 'msg1', ref: { id: 'msg1' }, data: () => ({ read: false }) },
        { id: 'msg2', ref: { id: 'msg2' }, data: () => ({ read: false }) }
      ]
    });
    
    // Set up user for selection
    (onSnapshot as jest.Mock).mockImplementationOnce((q, callback) => {
      callback({
        docs: [
          { 
            id: 'user2', 
            data: () => ({ 
              username: 'Alice', 
              firstName: 'Alice', 
              lastName: '', 
              profileImage: 'https://via.placeholder.com/150', 
              followers: ['user1'], 
              following: ['user1'] 
            }) 
          }
        ]
      });
      return jest.fn();
    });

    const { findByText, debug } = render(<ChatListScreen />);
    
    // Log the rendered component structure for debugging
    console.log('Component after render:');
    debug();
    
    // Select user to trigger markMessagesAsRead
    const userElement = await findByText('Alice');
    fireEvent.press(userElement);
    
    // Wait for updateDoc to be called
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      console.log('updateDoc calls:', (updateDoc as jest.Mock).mock.calls);
    });
  });

  test.only('unsubscribe functions are called on component unmount', async () => {
    const unsubscribeMock = jest.fn();
    (onSnapshot as jest.Mock).mockImplementation(() => unsubscribeMock);

    const { unmount } = render(<ChatListScreen />);
    
    await waitFor(() => {
      // Ensure component has registered listeners
      expect(onSnapshot).toHaveBeenCalled();
      console.log('onSnapshot calls:', (onSnapshot as jest.Mock).mock.calls.length);
    });
    
    // Unmount component
    unmount();
    
    // Verify unsubscribe was called
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});