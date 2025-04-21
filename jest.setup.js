// Mock the react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {});

// Mock expo modules if needed
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/chat'
}));

// Mock react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.UIManager.measureInWindow = jest.fn((node, callback) => callback(0, 0, 0, 0));
  return RN;
});

// Set up necessary global variables
global.window = {};
global.window = global;
