# CraftMate Installation Guide

This guide provides detailed instructions for setting up the CraftMate development environment on your local machine.

## Prerequisites

Make sure you have the following installed before proceeding:
- Node.js (v16 or later) – [Download here](https://nodejs.org/)
- npm (comes with Node.js)
- Expo CLI (for React Native development)
- Expo Go App (install from the App Store or Google Play)
- Firebase CLI (for backend setup)
- Twilio Account (for video and chat functionality)

To install these, run:

```sh
# Install Expo CLI
npm install -g expo-cli

# Install Firebase CLI
npm install -g firebase-tools

# Check installations
node -v
npm -v
firebase --version
expo --version
```

## Getting Started

Clone the repository and navigate into the project directory:

```sh
# Clone the repository
git clone https://github.com/WSU-4110/CraftMate.git

# Go to CraftMate folder
cd CraftMate
```

## Frontend Setup (React Native with Expo)

Install dependencies:

```sh
cd craftmate
npm install
```

Start the development server:

```sh
npx expo start
```

In the output, you'll find options to open the app on:
- iOS simulator
- Android emulator
- Your physical device using the Expo Go app