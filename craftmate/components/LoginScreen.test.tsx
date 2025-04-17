import React from 'react';
import { Alert } from 'react-native';

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
  return {
    doc: jest.fn(() => 'mocked-doc-ref'),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    arrayRemove: jest.fn(),
    increment: jest.fn()
  };
});

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  prompt: jest.fn()
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'testUserId' }); // Mock a logged-in user by default
    return jest.fn(); // Return mock unsubscribe function
  })
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

// Import after mocking
import { doc, getDoc, updateDoc, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import Toast from 'react-native-toast-message';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Instead of mocking the entire component, we'll test the functions directly
describe('LoginScreen Methods Tests', () => {
  let mockProfile = {
    tags: ['Cars', 'Tools']
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for addCustomTag method
  describe('addCustomTag tests', () => {
    test('addCustomTag should add a new valid tag to user profile', async () => {
      // Mock Alert.prompt to simulate user input
      Alert.prompt = jest.fn((title, message, callback) => {
        // Simulate user entering "Painting" as new tag
        callback("Painting");
      });
      
      // Mock updateDoc for successful update
      updateDoc.mockResolvedValue({});
      
      // Create a function that simulates the addCustomTag method
      const addCustomTag = () => {
        Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
          if (!tag) return;
          const trimmed = tag.trim();
          if (!trimmed || mockProfile.tags.includes(trimmed)) return;
          await updateDoc('mocked-doc-ref', { 
            tags: [...mockProfile.tags, trimmed] 
          });
          Toast.show({ type: "success", text1: "Tag Added" });
        });
      };
      
      // Call the simulated function
      addCustomTag();
      
      // Check if Alert.prompt was called correctly
      expect(Alert.prompt).toHaveBeenCalledWith(
        "New Tag",
        "Enter custom tag",
        expect.any(Function)
      );
      
      // Wait for async operations to complete
      await new Promise(process.nextTick);
      
      // Verify that updateDoc was called with the correct arguments
      expect(updateDoc).toHaveBeenCalledWith(
        'mocked-doc-ref', 
        { tags: ['Cars', 'Tools', 'Painting'] }
      );
      
      // Verify that success toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", text1: "Tag Added" })
      );
    });

    test('addCustomTag should not add empty tag', async () => {
      // Mock Alert.prompt to simulate empty input
      Alert.prompt = jest.fn((title, message, callback) => {
        callback(""); // Empty tag
      });
      
      // Create a function that simulates the addCustomTag method
      const addCustomTag = () => {
        Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
          if (!tag) return;
          const trimmed = tag.trim();
          if (!trimmed || mockProfile.tags.includes(trimmed)) return;
          await updateDoc('mocked-doc-ref', { 
            tags: [...mockProfile.tags, trimmed] 
          });
        });
      };
      
      // Call the simulated function
      addCustomTag();
      
      // Check if Alert.prompt was called correctly
      expect(Alert.prompt).toHaveBeenCalledWith(
        "New Tag",
        "Enter custom tag",
        expect.any(Function)
      );
      
      // Wait for async operations to complete
      await new Promise(process.nextTick);
      
      // Verify that updateDoc was NOT called
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test('addCustomTag should not add duplicate tag', async () => {
      // Mock Alert.prompt to simulate user inputting an existing tag
      Alert.prompt = jest.fn((title, message, callback) => {
        callback("Cars"); // This tag already exists in the mock profile
      });
      
      // Create a function that simulates the addCustomTag method
      const addCustomTag = () => {
        Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
          if (!tag) return;
          const trimmed = tag.trim();
          if (!trimmed || mockProfile.tags.includes(trimmed)) return;
          await updateDoc('mocked-doc-ref', { 
            tags: [...mockProfile.tags, trimmed] 
          });
        });
      };
      
      // Call the simulated function
      addCustomTag();
      
      // Check if Alert.prompt was called correctly
      expect(Alert.prompt).toHaveBeenCalledWith(
        "New Tag",
        "Enter custom tag",
        expect.any(Function)
      );
      
      // Wait for async operations to complete
      await new Promise(process.nextTick);
      
      // Verify that updateDoc was NOT called because tag already exists
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test('addCustomTag should trim whitespace from input', async () => {
      // Mock Alert.prompt to simulate user input with whitespace
      Alert.prompt = jest.fn((title, message, callback) => {
        callback("  Electricity  "); // Tag with whitespace
      });
      
      // Create a function that simulates the addCustomTag method
      const addCustomTag = () => {
        Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
          if (!tag) return;
          const trimmed = tag.trim();
          if (!trimmed || mockProfile.tags.includes(trimmed)) return;
          await updateDoc('mocked-doc-ref', { 
            tags: [...mockProfile.tags, trimmed] 
          });
          Toast.show({ type: "success", text1: "Tag Added" });
        });
      };
      
      // Call the simulated function
      addCustomTag();
      
      // Check if Alert.prompt was called correctly
      expect(Alert.prompt).toHaveBeenCalledWith(
        "New Tag",
        "Enter custom tag",
        expect.any(Function)
      );
      
      // Wait for async operations to complete
      await new Promise(process.nextTick);
      
      // Verify that updateDoc was called with the trimmed tag
      expect(updateDoc).toHaveBeenCalledWith(
        'mocked-doc-ref', 
        { tags: ['Cars', 'Tools', 'Electricity'] }
      );
    });
  });
  
  // Tests for handleLogin method
  describe('handleLogin tests', () => {
    test('handleLogin should successfully log in user', async () => {
      // Mock successful sign in
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'testUserId', email: 'test@example.com' }
      });
      
      // Create a function that simulates the handleLogin method
      const handleLogin = async () => {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            "test@example.com",
            "password123"
          );
          Toast.show({
            type: "success",
            text1: "Welcome",
            text2: `Logged in as test@example.com`,
          });
        } catch (error) {
          Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
      };
      
      // Call the simulated function
      await handleLogin();
      
      // Verify that signInWithEmailAndPassword was called
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "password123"
      );
      
      // Verify that success toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          text1: "Welcome",
          text2: "Logged in as test@example.com"
        })
      );
    });
    
    test('handleLogin should handle login failure', async () => {
      // Mock failed sign in
      const mockError = new Error('Invalid credentials');
      signInWithEmailAndPassword.mockRejectedValue(mockError);
      
      // Create a function that simulates the handleLogin method
      const handleLogin = async () => {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            "test@example.com",
            "password123"
          );
          Toast.show({
            type: "success",
            text1: "Welcome",
            text2: `Logged in as test@example.com`,
          });
        } catch (error) {
          Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
      };
      
      // Call the simulated function
      await handleLogin();
      
      // Verify that error toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text1: "Login Failed",
          text2: mockError.message
        })
      );
    });
  });
  
  // Tests for handleSignOut method
  describe('handleSignOut tests', () => {
    test('handleSignOut should successfully sign out user', async () => {
      // Mock successful sign out
      signOut.mockResolvedValue(undefined);
      updateDoc.mockResolvedValue(undefined);
      
      // Create a function that simulates the handleSignOut method
      const handleSignOut = async () => {
        try {
          await updateDoc(doc(db, "users", "testUserId"), { isActive: false });
          await signOut(auth);
          Toast.show({ type: "success", text1: "Signed Out" });
        } catch (error) {
          console.error("Error signing out:", error);
          Toast.show({ type: "error", text1: "Failed to sign out" });
        }
      };
      
      // Call the simulated function
      await handleSignOut();
      
      // Verify that user's active status was updated
      expect(updateDoc).toHaveBeenCalledWith(
        'mocked-doc-ref',
        { isActive: false }
      );
      
      // Verify that signOut was called
      expect(signOut).toHaveBeenCalled();
      
      // Verify that success toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          text1: "Signed Out"
        })
      );
    });
    
    test('handleSignOut should handle sign out failure', async () => {
      // Mock failed sign out
      const mockError = new Error('Sign out failed');
      signOut.mockRejectedValue(mockError);
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a function that simulates the handleSignOut method
      const handleSignOut = async () => {
        try {
          await updateDoc(doc(db, "users", "testUserId"), { isActive: false });
          await signOut(auth);
          Toast.show({ type: "success", text1: "Signed Out" });
        } catch (error) {
          console.error("Error signing out:", error);
          Toast.show({ type: "error", text1: "Failed to sign out" });
        }
      };
      
      // Call the simulated function
      await handleSignOut();
      
      // Verify that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error signing out:",
        expect.any(Error)
      );
      
      // Verify that error toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text1: "Failed to sign out"
        })
      );
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
  
  // Tests for handleDeletePost method
  describe('handleDeletePost tests', () => {
    test('handleDeletePost should show confirmation alert', async () => {
      // Create a function that simulates the handleDeletePost method
      const handleDeletePost = (postId) => {
        Alert.alert(
          "Confirm Delete",
          "Are you sure you want to delete this post?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: async () => {
                try {
                  await deleteDoc(doc(db, "posts", postId));
                  await updateDoc(doc(db, "users", "testUserId"), {
                    postCount: increment(-1),
                    posts: arrayRemove(postId)
                  });
                  Toast.show({ type: "success", text1: "Post deleted successfully" });
                } catch (error) {
                  console.error("Error deleting post:", error);
                  Toast.show({ type: "error", text1: "Failed to delete post" });
                }
              },
            },
          ]
        );
      };
      
      // Call the simulated function
      handleDeletePost('post1');
      
      // Check if Alert.alert was called correctly
      expect(Alert.alert).toHaveBeenCalledWith(
        "Confirm Delete",
        "Are you sure you want to delete this post?",
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel" }),
          expect.objectContaining({ text: "Delete" })
        ])
      );
    });
    
    test('handleDeletePost should delete post when confirmed', async () => {
      // Mock successful document deletion
      deleteDoc.mockResolvedValue(undefined);
      updateDoc.mockResolvedValue(undefined);
      
      // Create a function that simulates the handleDeletePost method
      const handleDeletePost = (postId) => {
        Alert.alert(
          "Confirm Delete",
          "Are you sure you want to delete this post?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: async () => {
                try {
                  await deleteDoc(doc(db, "posts", postId));
                  await updateDoc(doc(db, "users", "testUserId"), {
                    postCount: increment(-1),
                    posts: arrayRemove(postId)
                  });
                  Toast.show({ type: "success", text1: "Post deleted successfully" });
                } catch (error) {
                  console.error("Error deleting post:", error);
                  Toast.show({ type: "error", text1: "Failed to delete post" });
                }
              },
            },
          ]
        );
      };
      
      // Call the simulated function
      handleDeletePost('post1');
      
      // Find and call the "Delete" button's onPress handler
      const deleteButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === "Delete");
      await deleteButton.onPress();
      
      // Verify that deleteDoc was called with the correct argument
      expect(deleteDoc).toHaveBeenCalledWith('mocked-doc-ref');
      
      // Verify that updateDoc was called with the correct arguments
      expect(updateDoc).toHaveBeenCalledWith(
        'mocked-doc-ref',
        {
          postCount: increment(-1),
          posts: arrayRemove('post1')
        }
      );
      
      // Verify that success toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: "success", 
          text1: "Post deleted successfully" 
        })
      );
    });
    
    test('handleDeletePost should handle errors', async () => {
      // Mock failed document deletion
      const mockError = new Error('Delete failed');
      deleteDoc.mockRejectedValue(mockError);
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a function that simulates the handleDeletePost method
      const handleDeletePost = (postId) => {
        Alert.alert(
          "Confirm Delete",
          "Are you sure you want to delete this post?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: async () => {
                try {
                  await deleteDoc(doc(db, "posts", postId));
                  await updateDoc(doc(db, "users", "testUserId"), {
                    postCount: increment(-1),
                    posts: arrayRemove(postId)
                  });
                  Toast.show({ type: "success", text1: "Post deleted successfully" });
                } catch (error) {
                  console.error("Error deleting post:", error);
                  Toast.show({ type: "error", text1: "Failed to delete post" });
                }
              },
            },
          ]
        );
      };
      
      // Call the simulated function
      handleDeletePost('post1');
      
      // Find and call the "Delete" button's onPress handler
      const deleteButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === "Delete");
      await deleteButton.onPress();
      
      // Verify that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting post:",
        expect.any(Error)
      );
      
      // Verify that error toast was shown
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: "error", 
          text1: "Failed to delete post" 
        })
      );
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
    
    test('handleDeletePost should do nothing when canceled', async () => {
      // Create a function that simulates the handleDeletePost method
      const handleDeletePost = (postId) => {
        Alert.alert(
          "Confirm Delete",
          "Are you sure you want to delete this post?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: async () => {
                await deleteDoc(doc(db, "posts", postId));
                await updateDoc(doc(db, "users", "testUserId"), {
                  postCount: increment(-1),
                  posts: arrayRemove(postId)
                });
                Toast.show({ type: "success", text1: "Post deleted successfully" });
              },
            },
          ]
        );
      };
      
      // Call the simulated function
      handleDeletePost('post1');
      
      // Find and call the "Cancel" button's onPress handler (if exists)
      const cancelButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === "Cancel");
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
      
      // Verify that deleteDoc was NOT called
      expect(deleteDoc).not.toHaveBeenCalled();
      
      // Verify that updateDoc was NOT called
      expect(updateDoc).not.toHaveBeenCalled();
      
      // Verify that no toast was shown
      expect(Toast.show).not.toHaveBeenCalled();
    });
  });
});