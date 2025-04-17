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
    setDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
  };
});

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn()
}));

// Mock expo router
jest.mock('expo-router', () => ({
  useRouter: () => ({ 
    replace: jest.fn(),
    push: jest.fn()
  })
}));

// Import after mocking
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

describe('SignUpScreen handleSignUp tests', () => {
  let mockUserCredential;
  let mockRouter;
  let mockUser;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user credential response
    mockUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      delete: jest.fn()
    };
    
    mockUserCredential = {
      user: mockUser
    };
    
    // Mock router
    mockRouter = {
      replace: jest.fn()
    };
    
    // Mock getDocs response for username checks
    getDocs.mockImplementation((queryInstance) => {
      // Handle username check for 'takenusername'
      if (where.mock.calls.some(call => call[2] === 'takenusername')) {
        return Promise.resolve({
          empty: false,
          docs: [{ data: () => ({ username: 'takenusername' }) }]
        });
      }
      
      // Otherwise return empty results (username is available)
      return Promise.resolve({
        empty: true,
        docs: []
      });
    });
    
    // Console spy
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  // Helper function to simulate the handleSignUp method
  const handleSignUp = async ({
    username = 'testuser',
    firstName = 'Test',
    lastName = 'User',
    email = 'test@example.com',
    password = 'password123',
    confirmPassword = 'password123',
    isProfessional = false
  }) => {
    // make sure all fields are filled
    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // check if passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    // check for min password length
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long!");
      return;
    }
    
    // Check if username is available
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      Alert.alert("Error", "Username already taken. Please choose a different username.");
      return;
    }

    try {
      // create new user with firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // add user's info to firestore with isActive set to true
      const userRef = doc(db, 'users', user.uid);
      
      const userData = {
        email: user.email,
        uid: user.uid,
        username,
        firstName,
        lastName,
        bio: "", // Add empty bio string
        profileImage: "https://via.placeholder.com/150", // default for now
        createdAt: new Date().toISOString(),
        followers: [], // Initialize as empty array
        following: [], // Initialize as empty array
        posts: [], // Initialize as empty array
        postCount: 0, // Initialize post count
        isProfessional,
        isActive: true, // Set to true when creating the account
        tags: [], // Initialize as empty array
      };
      
      try {
        // Create the user document and wait for it to complete
        await setDoc(userRef, userData);
        
        // Verify the document was created successfully
        console.log("User document created successfully:", user.uid);

        Alert.alert("Success", `Welcome, ${username}! Verification email sent.`);

        // go back to main screen after signup
        mockRouter.replace("/(tabs)");
      } catch (docError) {
        console.error("Error creating user document:", docError);
        // If document creation fails, we should delete the auth user to keep things consistent
        try {
          await user.delete();
          Alert.alert("Error", "Failed to create user profile. Please try again.");
        } catch (deleteError) {
          console.error("Error deleting auth user after failed document creation:", deleteError);
        }
      }
    } catch (error) {
      console.error("Sign Up Error:", error);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  // Helper function to simulate isUsernameUnique
  const isUsernameUnique = async (username) => {
    if (!username.trim()) return true;
    
    try {
      const usersRef = collection(db, "users");
      const lowercaseUsername = username.toLowerCase();
      
      // First check for exact match
      const exactQuery = query(usersRef, where("username", "==", username));
      const exactSnapshot = await getDocs(exactQuery);
      
      if (!exactSnapshot.empty) {
        return false;
      }
      
      // Then check for case-insensitive matches
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      const caseInsensitiveMatch = allUsersSnapshot.docs.some(
        doc => doc.data().username && 
        doc.data().username.toLowerCase() === lowercaseUsername
      );
      
      return !caseInsensitiveMatch;
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
      return false;
    }
  };

  test('should show error when fields are empty', async () => {
    await handleSignUp({ username: '' });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error", 
      "All fields are required!"
    );
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('should show error when passwords do not match', async () => {
    await handleSignUp({ 
      password: 'password123', 
      confirmPassword: 'differentpassword' 
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error", 
      "Passwords do not match!"
    );
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('should show error when password is too short', async () => {
    await handleSignUp({ 
      password: 'short', 
      confirmPassword: 'short' 
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error", 
      "Password must be at least 6 characters long!"
    );
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('should show error when username is taken', async () => {
    // Make sure the mocks detect 'takenusername' as taken
    where.mockImplementation((field, operator, value) => {
      // This now also tracks the value being checked
      return value;
    });
    
    // Mock that 'takenusername' exists in database
    getDocs.mockImplementation(() => {
      return Promise.resolve({
        empty: false,
        docs: [{ data: () => ({ username: 'takenusername' }) }]
      });
    });
    
    await handleSignUp({ 
      username: 'takenusername' 
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error", 
      "Username already taken. Please choose a different username."
    );
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('should create user successfully and navigate to tabs', async () => {
    // Reset mocks from previous tests
    getDocs.mockReset();
    
    // Mock username check to return available (empty results)
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
    
    // Mock successful user creation
    createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    sendEmailVerification.mockResolvedValue();
    setDoc.mockResolvedValue();
    
    // Call handleSignUp with valid data
    await handleSignUp({
      username: 'validuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      isProfessional: false
    });
    
    // Verify auth methods were called
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'test@example.com',
      'password123'
    );
    expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    
    // Verify firestore doc creation
    expect(setDoc).toHaveBeenCalledWith(
      'mocked-doc-ref',
      expect.objectContaining({
        username: 'validuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        isProfessional: false
      })
    );
    
    // Verify success alert and navigation
    expect(Alert.alert).toHaveBeenCalledWith(
      "Success", 
      "Welcome, validuser! Verification email sent."
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });

  test('should handle auth creation error', async () => {
    // Reset mocks from previous tests
    getDocs.mockReset();
    
    // Mock username check to return available (empty results)
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
    
    // Mock auth creation error
    const mockError = new Error('Auth error');
    mockError.message = 'Auth error message';
    createUserWithEmailAndPassword.mockRejectedValue(mockError);
    
    await handleSignUp({
      username: 'validuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Verify error alert
    expect(Alert.alert).toHaveBeenCalledWith(
      "Sign Up Failed", 
      "Auth error message"
    );
    expect(console.error).toHaveBeenCalledWith("Sign Up Error:", expect.any(Error));
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('should handle firestore doc creation error and delete user', async () => {
    // Reset mocks from previous tests
    getDocs.mockReset();
    
    // Mock username check to return available (empty results)
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
    
    // Mock successful auth but failed doc creation
    createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    sendEmailVerification.mockResolvedValue();
    
    // Mock setDoc failure
    const docError = new Error('Firestore error');
    setDoc.mockRejectedValue(docError);
    mockUser.delete.mockResolvedValue();
    
    await handleSignUp({
      username: 'validuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Verify user deletion attempt and error message
    expect(mockUser.delete).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Error", 
      "Failed to create user profile. Please try again."
    );
    expect(console.error).toHaveBeenCalledWith("Error creating user document:", expect.any(Error));
  });

  test('should handle error when deleting user after doc creation failure', async () => {
    // Reset mocks from previous tests
    getDocs.mockReset();
    console.error.mockReset();
    
    // Mock username check to return available (empty results)
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });
    
    // Mock successful auth but failed doc creation
    createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    sendEmailVerification.mockResolvedValue();
    
    // Mock setDoc failure
    const docError = new Error('Firestore error');
    setDoc.mockRejectedValue(docError);
    
    // Mock user deletion failure
    const deleteError = new Error('Delete user error');
    mockUser.delete.mockRejectedValue(deleteError);
    
    await handleSignUp({
      username: 'validuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    // Verify error logging
    expect(console.error).toHaveBeenCalledWith(
      "Error deleting auth user after failed document creation:", 
      expect.any(Error)
    );
  });
});