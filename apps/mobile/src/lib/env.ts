import {Platform} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Edit this file to point the app at your backend.
//
// Pick ONE of the API_URL values below, based on how you're running the app:
//
//   1. Android emulator (the default in Android Studio AVD):
//        http://10.0.2.2:3000
//      `10.0.2.2` is the emulator's alias for the host machine's localhost.
//
//   2. Physical Android device connected via USB:
//        First run once in PowerShell:  adb reverse tcp:3000 tcp:3000
//        Then use:                       http://localhost:3000
//      `adb reverse` makes the device's localhost forward to your PC's localhost.
//
//   3. Physical device on the same WiFi as your PC (no USB):
//        http://<your PC's LAN IP>:3000      e.g. http://192.168.1.42:3000
//      Find your PC's IP with `ipconfig` in PowerShell — look for IPv4 Address
//      under your active WiFi/Ethernet adapter. Also make sure Windows Firewall
//      allows inbound TCP on port 3000.
//
//   4. iOS simulator:
//        http://localhost:3000
//
// After editing, restart Metro with cache reset:
//    cd apps/mobile && pnpm start --reset-cache
// No native rebuild needed — this is plain JS.
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Set to true to use canned data without talking to the backend.
// Useful for screen-by-screen UI development with no API running.
const USE_MOCKS = false;

export const env = {
  API_URL,
  USE_MOCKS,
};
