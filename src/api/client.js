import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../utils/deviceUtils';

// API'nin temel URL'sini platform'a göre belirle
// Emülatör kullanıyorsanız:
// - Android için: http://10.0.2.2:8080/api
// - iOS için: http://localhost:8080/api
// Fiziksel cihaz kullanıyorsanız local IP adresinizi kullanın
const baseURL = getApiBaseUrl();
console.log(`API çağrıları için kullanılacak URL: ${baseURL}`);

// Axios istemcisi oluştur
const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte Authorization header'ına token ekler
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // AsyncStorage'dan token'ı al
      const token = await AsyncStorage.getItem('token');
      
      // Token varsa, header'a ekle
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Axios interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatası durumunda token yenileme/logout işlemleri için
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 (Unauthorized) hatası ve bu istek daha önce yeniden denenmediyse
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Burada token yenileme işlemi yapılabilir
        // Şimdilik sadece kullanıcıyı logout yapıyoruz
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        // Uygulamayı yeniden başlatma veya login ekranına yönlendirme işlemi burada yapılabilir
        // Bu işlemi daha sonra dispatch ile Redux üzerinden yapacağız
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
