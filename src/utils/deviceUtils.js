import { Platform } from 'react-native';

// Server configurations
const SERVER_PORT = 8080; // Ensure this matches your actual server port
const SERVER_API_PATH = '/api';

// DEBUG OPTIONS - set to true to test different connection scenarios
const DEBUG = {
  // Force a specific connection type regardless of actual device
  FORCE_CONNECTION_TYPE: null, // Set to 'emulator', 'simulator', or 'physical' to override detection
  // Log extra connection info
  VERBOSE_LOGGING: true
};

/**
 * Gets IP address for physical device testing
 * You should update this value with your actual local network IP address
 * 
 * @returns {string} IP address for physical device testing
 */
export const getLocalNetworkIp = () => {
  // Replace with your computer's local network IP
  // Example: return '192.168.1.100';
  return '';
};

/**
 * Checks if the app is running on a physical device rather than an emulator
 * This is a simple implementation - for a more reliable check, consider
 * using a library like 'react-native-device-info'
 * 
 * @returns {boolean} True if likely running on a physical device
 */
export const isPhysicalDevice = () => {
  // Override detection if debug option is set
  if (DEBUG.FORCE_CONNECTION_TYPE === 'physical') return true;
  if (DEBUG.FORCE_CONNECTION_TYPE === 'emulator' || DEBUG.FORCE_CONNECTION_TYPE === 'simulator') return false;
  
  // This is a simple heuristic, not 100% reliable
  // For more reliable detection, use react-native-device-info
  
  // In dev mode, assume we're on an emulator unless explicitly set otherwise
  if (__DEV__) {
    // You can force physical device mode by uncommenting this line:
    // return true;
    return false;
  }
  
  // In release mode, assume we're on a physical device
  return true;
};

/**
 * Tests if a URL is reachable by making a fetch request
 * 
 * @param {string} url - The URL to test
 * @returns {Promise<boolean>} - True if the URL is reachable
 */
export const testUrl = async (url) => {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      timeout: 3000 // 3 second timeout
    });
    console.log(`URL Test (${url}): Status ${response.status}`);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error(`URL Test (${url}) failed: ${error.message}`);
    return false;
  }
};

/**
 * Logs the current device and connection configuration
 */
export const logDeviceInfo = async () => {
  console.log('Device Type:', isPhysicalDevice() ? 'Physical Device' : 'Emulator/Simulator');
  console.log('Platform:', Platform.OS);
  
  const apiUrl = getApiBaseUrl();
  const socketUrl = getSocketBaseUrl();
  
  console.log('API URL:', apiUrl);
  console.log('Socket URL:', socketUrl);
  
  if (DEBUG.VERBOSE_LOGGING) {
    console.log('DEBUG MODE ACTIVE');
    if (DEBUG.FORCE_CONNECTION_TYPE) {
      console.log(`FORCED CONNECTION TYPE: ${DEBUG.FORCE_CONNECTION_TYPE}`);
    }
    
    // Test server root URL
    const rootUrl = apiUrl.replace(SERVER_API_PATH, '');
    console.log('Testing server root URL:', rootUrl);
    const rootReachable = await testUrl(rootUrl);
    console.log('Server root reachable:', rootReachable);
    
    // Test API URL
    console.log('Testing API URL:', apiUrl);
    const apiReachable = await testUrl(apiUrl);
    console.log('API URL reachable:', apiReachable);
  }
};

/**
 * Determines the correct base URL for socket connections based on platform
 * 
 * @returns {string} The appropriate socket URL for the current platform
 */
export const getSocketBaseUrl = () => {
  // For physical devices, use the actual local network IP of your dev machine
  const localIp = getLocalNetworkIp();
  if (localIp && isPhysicalDevice()) {
    return `http://${localIp}:${SERVER_PORT}`;
  }
  
  // For emulators
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${SERVER_PORT}`;
  }
  
  // For iOS simulators
  return `http://localhost:${SERVER_PORT}`;
};

/**
 * Determines the correct base URL for API calls based on platform
 * 
 * @returns {string} The appropriate API URL for the current platform
 */
export const getApiBaseUrl = () => {
  // For physical devices, use the actual local network IP of your dev machine
  const localIp = getLocalNetworkIp();
  if (localIp && isPhysicalDevice()) {
    return `http://${localIp}:${SERVER_PORT}${SERVER_API_PATH}`;
  }
  
  // For emulators
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${SERVER_PORT}${SERVER_API_PATH}`;
  }
  
  // For iOS simulators
  return `http://localhost:${SERVER_PORT}${SERVER_API_PATH}`;
}; 