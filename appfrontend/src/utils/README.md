# Utils Directory

This directory contains utility functions and helpers that are used throughout the application.

## deviceUtils.js

The `deviceUtils.js` file provides utility functions for handling device-specific configurations, particularly for network connections that need different URLs based on the platform (Android/iOS) and environment (emulator/physical device).

### Available Functions:

1. **getSocketBaseUrl()** - Returns the appropriate base URL for Socket.IO connections based on the current platform:
   - Android Emulator: `http://10.0.2.2:8080`
   - iOS Simulator: `http://localhost:8080`

2. **getApiBaseUrl()** - Returns the appropriate base URL for API requests based on the current platform:
   - Android Emulator: `http://10.0.2.2:8080/api`
   - iOS Simulator: `http://localhost:8080/api`

3. **getLocalNetworkIp()** - Placeholder function for specifying your local network IP address when testing on physical devices.

### Physical Device Testing

When testing on physical devices, you need to modify the `getLocalNetworkIp()` function to return your computer's local network IP address. Then update the socket and API URL utility functions to use this IP when the app is running on a physical device.

Example modification for physical device support:

```javascript
export const getLocalNetworkIp = () => {
  return '192.168.1.100'; // Replace with your actual local network IP
};

export const getSocketBaseUrl = () => {
  // For physical devices, use the local network IP
  if (Platform.OS !== 'web' && !__DEV__) {
    return `http://${getLocalNetworkIp()}:${SERVER_PORT}`;
  }
  
  // For emulators
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${SERVER_PORT}`;
  }
  return `http://localhost:${SERVER_PORT}`;
};
```

### Why We Need Different URLs

- **Android Emulator**: Android emulators use the special IP `10.0.2.2` to reference the host machine's localhost.
- **iOS Simulator**: iOS simulators can directly use `localhost` since they share the networking namespace with the host.
- **Physical Devices**: Physical devices need the actual IP address of the computer running the server on the local network. 