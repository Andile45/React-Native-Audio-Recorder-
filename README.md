# React Native Audio Recorder App

A modern and professional digital journal application for voice recording, built with React Native and Expo. This app allows users to easily record, manage, play back, and search their voice notes with a clean and intuitive user interface.

## Features

*   **Recording Functionality**: Record high-quality audio notes using the device's microphone.
*   **Live Recording Timer**: Displays live elapsed time (MM:SS) during recording.
*   **Voice Notes List**: View a scrollable list of all recorded voice notes, displaying title, creation date, and duration.
*   **Playback Functionality**: Play back recorded voice notes with live elapsed time and total duration display (MM:SS / MM:SS).
*   **Pause/Play Toggle**: Control playback for individual voice notes.
*   **Delete Functionality**: Easily delete unwanted voice notes.
*   **Create New Voice Note**: Simple input field to title your voice note before recording.
*   **Persistent Storage**: Voice notes are saved locally and persist even after the app is closed or restarted. Audio data is stored as Base64 strings.
*   **User-Friendly Interface**: A redesigned, clean, modern, and mobile-first black-and-white UI with card-based layouts, soft shadows, and professional typography.
*   **Permissions Handling**: Handles microphone access permissions.
*   **Search Functionality**: Search for specific voice notes by their title.
*   **Splash Screen**: A custom splash screen displaying on app launch for a polished user experience.

## Technical Requirements & Concepts Covered

*   **React Native UI Components**: Extensive use of `View`, `Text`, `TextInput`, `Pressable`, `FlatList`, `Animated`.
*   **User Interactions**: Capturing user input and gestures for recording and playback.
*   **Expo-AV**: Robust audio management for recording and playback.
*   **@react-native-async-storage/async-storage**: For persistent local storage of voice notes.
*   **@expo/vector-icons**: For scalable and customizable icons throughout the UI.
*   **React Hooks**: `useState`, `useEffect`, `useRef` for efficient state management and side effects.
*   **Animated API**: For subtle animations like the recording waveform.
*   **Expo Router**: For defining app layouts and navigation.
*   **UI/UX Principles**: Implementation of visual consistency, clarity, hierarchy, and a professional aesthetic (card-based layout, soft shadows, consistent padding, responsive press states).

## Installation & Setup

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <Your-Github-Repo-Link-Here>
    cd React-Native-Task-3---Audio-Recorder-main
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Start the Expo development server:**
    It's recommended to clear the cache on the first run or if you encounter issues:
    ```bash
    npx expo start --clear
    ```
    (You can typically just use `npx expo start` for subsequent runs.)

## Running the App

After starting the development server with `npx expo start`:

*   **iOS/Android Emulator or Physical Device**:
    1.  Download the **Expo Go** app from the App Store (iOS) or Google Play Store (Android).
    2.  Open the Expo Go app and scan the QR code displayed in your terminal or web browser (usually at `http://localhost:8081`).
    3.  The app should load automatically on your device/emulator.

*   **Web Browser**:
    1.  In your terminal, while the Expo server is running, press the `w` key.
    2.  This will open the app in your default web browser.

## Usage

*   **Record**: Enter a title in the input field and press the microphone icon to start recording. Press the stop icon to finish.
*   **Play/Pause**: Tap the play icon next to a voice note to start playback. Tap it again to pause.
*   **Delete**: Tap the trash icon next to a voice note to delete it.
*   **Search**: Use the search bar to filter voice notes by title.

## Evaluation Criteria

The application will be evaluated based on the following:

*   Can audio be recorded?
*   Can audio be played with the duration of the audio displayed?
*   Can the user control audio playback (play/pause)?
*   Is audio persistent when the app is closed or restarted?
*   Can audio be renamed? (Handled by deleting and re-recording with a new title, or editing title manually if implemented.)
*   Is saved audio searchable by name?

## Submission

Please submit your work by posting the GitHub link on the online platform and filling out the form below:

[https://docs.google.com/forms/d/e/1FAIpQLScs_5eJZJg5fDDAngStIVKTi7ZY4sUX7VNERTtzOlJNh5Hmkw/viewform?usp=publish-editor](https://docs.google.com/forms/d/e/1FAIpQLScs_5eJZJg5fDDAngStIVKTi7ZY4sUX7VNERTtzOlJNh5Hmkw/viewform?usp=publish-editor)
