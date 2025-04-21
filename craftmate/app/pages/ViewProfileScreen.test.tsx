import React from 'react';
import { Alert } from 'react-native';

// Mock Firebase auth
jest.mock('../../constants/firebaseConfig', () => ({
  db: {}
}));

// Mock Firebase auth's getAuth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'currentUserId' }
  }))
}));

// Mock necessary Firebase Firestore functions
jest.mock('firebase/firestore', () => {
  return {
    doc: jest.fn(() => 'mocked-doc-ref'),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    arrayUnion: jest.fn(data => data),
    arrayRemove: jest.fn(data => data)
  };
});

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock expo router
jest.mock('expo-router', () => ({
  useRouter: () => ({ 
    push: jest.fn(),
    back: jest.fn()
  }),
  useLocalSearchParams: jest.fn(() => ({
    userId: 'viewedUserId'
  }))
}));

// Import after mocking
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

describe('ViewProfileScreen handleFollowToggle tests', () => {
  // Create console spy
  let consoleErrorSpy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  // Helper function to simulate the handleFollowToggle method
  const handleFollowToggle = async (isFollowing, setIsFollowing, setProfile) => {
    const currentUserId = getAuth().currentUser?.uid;
    const userId = 'viewedUserId';

    if (!currentUserId || typeof userId !== "string") return;

    const viewerRef = doc(null, "users", currentUserId);
    const viewedRef = doc(null, "users", userId);

    try {
      if (isFollowing) {
        await updateDoc(viewerRef, {
          following: arrayRemove(userId),
        });
        await updateDoc(viewedRef, {
          followers: arrayRemove(currentUserId),
        });
        setIsFollowing(false);
        setProfile((prev) => ({
          ...prev,
          followers: prev.followers?.filter((id) => id !== currentUserId),
        }));
      } else {
        await updateDoc(viewerRef, {
          following: arrayUnion(userId),
        });
        await updateDoc(viewedRef, {
          followers: arrayUnion(currentUserId),
        });
        setIsFollowing(true);
        setProfile((prev) => ({
          ...prev,
          followers: [...(prev.followers || []), currentUserId],
        }));
      }
    } catch (error) {
      console.error("Follow toggle failed", error);
      Alert.alert("Error", "Could not update follow status.");
    }
  };

  test('should follow user successfully when not following', async () => {
    // Mock state
    const mockSetIsFollowing = jest.fn();
    const mockSetProfile = jest.fn();
    const isFollowing = false;
    const mockProfile = {
      followers: ['user1', 'user2']
    };
    
    // Mock successful updateDoc
    updateDoc.mockResolvedValue();
    
    // Call handleFollowToggle
    await handleFollowToggle(isFollowing, mockSetIsFollowing, mockSetProfile);
    
    // Verify updateDoc was called correctly for both users
    expect(doc).toHaveBeenCalledWith(null, "users", "currentUserId");
    expect(doc).toHaveBeenCalledWith(null, "users", "viewedUserId");
    
    // Verify follow operations
    expect(updateDoc).toHaveBeenCalledWith(
      'mocked-doc-ref', 
      { following: 'viewedUserId' }
    );
    expect(updateDoc).toHaveBeenCalledWith(
      'mocked-doc-ref', 
      { followers: 'currentUserId' }
    );
    
    // Verify state was updated
    expect(mockSetIsFollowing).toHaveBeenCalledWith(true);
    
    // Call the profile updater function with mock data
    const profileUpdater = mockSetProfile.mock.calls[0][0];
    const updatedProfile = profileUpdater(mockProfile);
    
    // Verify profile state was updated correctly
    expect(updatedProfile.followers).toContain('currentUserId');
    expect(updatedProfile.followers.length).toBe(3);
  });

  test('should unfollow user successfully when following', async () => {
    // Mock state
    const mockSetIsFollowing = jest.fn();
    const mockSetProfile = jest.fn();
    const isFollowing = true;
    const mockProfile = {
      followers: ['user1', 'user2', 'currentUserId']
    };
    
    // Mock successful updateDoc
    updateDoc.mockResolvedValue();
    
    // Call handleFollowToggle
    await handleFollowToggle(isFollowing, mockSetIsFollowing, mockSetProfile);
    
    // Verify updateDoc was called correctly for both users
    expect(doc).toHaveBeenCalledWith(null, "users", "currentUserId");
    expect(doc).toHaveBeenCalledWith(null, "users", "viewedUserId");
    
    // Verify unfollow operations
    expect(updateDoc).toHaveBeenCalledWith(
      'mocked-doc-ref', 
      { following: 'viewedUserId' }
    );
    expect(updateDoc).toHaveBeenCalledWith(
      'mocked-doc-ref', 
      { followers: 'currentUserId' }
    );
    
    // Verify state was updated
    expect(mockSetIsFollowing).toHaveBeenCalledWith(false);
    
    // Call the profile updater function with mock data
    const profileUpdater = mockSetProfile.mock.calls[0][0];
    const updatedProfile = profileUpdater(mockProfile);
    
    // Verify profile state was updated correctly
    expect(updatedProfile.followers).not.toContain('currentUserId');
    expect(updatedProfile.followers.length).toBe(2);
  });

  test('should handle error when updateDoc fails', async () => {
    // Mock state
    const mockSetIsFollowing = jest.fn();
    const mockSetProfile = jest.fn();
    const isFollowing = false;
    
    // Mock updateDoc to fail
    const mockError = new Error('Firestore error');
    updateDoc.mockRejectedValue(mockError);
    
    // Call handleFollowToggle
    await handleFollowToggle(isFollowing, mockSetIsFollowing, mockSetProfile);
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith("Follow toggle failed", mockError);
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Could not update follow status.");
    
    // Verify state was not updated
    expect(mockSetIsFollowing).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });

  test('should do nothing when currentUserId is null', async () => {
    // Mock state
    const mockSetIsFollowing = jest.fn();
    const mockSetProfile = jest.fn();
    const isFollowing = false;
    
    // Mock getAuth to return null current user
    getAuth.mockImplementationOnce(() => ({ currentUser: null }));
    
    // Call handleFollowToggle
    await handleFollowToggle(isFollowing, mockSetIsFollowing, mockSetProfile);
    
    // Verify no actions were taken
    expect(doc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
    expect(mockSetIsFollowing).not.toHaveBeenCalled();
    expect(mockSetProfile).not.toHaveBeenCalled();
  });
});