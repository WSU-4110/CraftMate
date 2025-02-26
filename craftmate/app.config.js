export default {
  "expo": {
    "name": "craftmate",
    "slug": "Craftmate",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.CSC4110.craftmate",
      "googleServicesFile": process.env.GOOGLE_SERVICES_INFOPLIST,
      
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.CSC4110.craftmate",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      "expo-router",
      
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
      
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "40c65938-2126-4813-9de6-266942c0711d"
      }
    },
    "owner": "waroof"
  }
}
