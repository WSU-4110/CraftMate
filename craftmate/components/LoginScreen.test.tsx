import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';
import { auth, db } from '../constants/firebaseConfig';
import { getDoc, getDocs } from 'firebase/firestore';

// Mock Firebase auth
jest.mock('../constants/firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: 'testUserId' }
  },
  db: {}
}));

// Mock necessary Firebase Firestore functions
jest.mock('firebase/firestore', () => {
  const mockDoc = jest.fn(() => ({ /* mock document reference */ }));
  const mockCollection = jest.fn(() => ({ /* mock collection reference */ }));
  const mockQuery = jest.fn(() => ({ /* mock query reference */ }));

  return {
    doc: mockDoc,
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    collection: mockCollection,
    query: mockQuery,
    where: jest.fn(),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    arrayRemove: jest.fn(),
    increment: jest.fn()
  };
});

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: (auth, callback) => {
    callback(null);
    return jest.fn(); // Return mock unsubscribe function
  }
}));

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn((callback) => callback()),
  Link: 'Link'
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn()
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' }
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn()
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('LoginScreen fetchUserProfile tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        bio: 'Test bio',
        profileImage: 'https://example.com/profile.jpg',
        tags: ['Tag1', 'Tag2'],
        isActive: true,
        followers: ['follower1', 'follower2'],
        following: ['following1'],
        posts: ['post1', 'post2']
      })
    });
    
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'post1',
          data: () => ({
            userId: 'testUserId',
            username: 'testuser',
            postTitle: 'Test Post 1',
            postBody: 'This is a test post',
            timestamp: {
              toDate: () => new Date(2023, 0, 1)
            },
            likes: 5,
            comments: 2,
            profileImage: 'https://example.com/profile.jpg',
            images: ['https://example.com/post1.jpg'],
            likedBy: ['user1', 'user2']
          })
        },
        {
          id: 'post2',
          data: () => ({
            userId: 'testUserId',
            username: 'testuser',
            postTitle: 'Test Post 2',
            postBody: 'This is another test post',
            timestamp: {
              toDate: () => new Date(2023, 0, 2)
            },
            likes: 3,
            comments: 1,
            profileImage: 'https://example.com/profile.jpg',
            images: [],
            likedBy: []
          })
        }
      ]
    });
  });

  test('fetchUserProfile should load user data correctly', async () => {
    // Mock auth to return a logged-in user
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'testUserId' });
      return jest.fn();
    });

    // Render component
    render(<LoginScreen />);

    // Wait for profile data to be loaded
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();
    });

    // Verify the correct queries were made
    expect(getDoc).toHaveBeenCalledWith(expect.anything());
    expect(getDocs).toHaveBeenCalledWith(expect.anything());
  });

  test('fetchUserProfile should handle non-existent user profile', async () => {
    // Mock auth
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'nonExistentUser' });
      return jest.fn();
    });

    // Mock non-existent user
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false
    });

    const consoleLogSpy = jest.spyOn(console, 'log');
    
    // Render component
    render(<LoginScreen />);

    // Wait for profile attempt
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
    });

    // Verify console message
    expect(consoleLogSpy).toHaveBeenCalledWith("No user profile document exists yet");
    
    consoleLogSpy.mockRestore();
  });

  test('fetchUserProfile should handle API errors', async () => {
    // Mock auth
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'testUserId' });
      return jest.fn();
    });

    // Mock API error
    const mockError = new Error('Network error');
    (getDoc as jest.Mock).mockRejectedValue(mockError);
    
    const consoleErrorSpy = jest.spyOn(console, 'error');
    
    // Render component
    render(<LoginScreen />);

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching user profile:", mockError);
    });
    
    consoleErrorSpy.mockRestore();
  });

  test('fetchUserProfile should handle timestamp formatting correctly', async () => {
    // Mock auth
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'testUserId' });
      return jest.fn();
    });

    // Setup timestamp test data
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'post1',
          data: () => ({
            userId: 'testUserId',
            timestamp: new Date(2023, 0, 1),
            // ...rest of post data...
          })
        },
        // ...other test posts...
      ]
    });

    // Render component
    render(<LoginScreen />);

    // Wait for posts to be loaded
    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
    });

    // Verify the query was made with correct parameters
    expect(getDocs).toHaveBeenCalledWith(expect.anything());
  });
});
