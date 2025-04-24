import apiClient from '../client';
import { AUTH_ENDPOINTS } from '../endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simülasyon modu artık KAPALI - gerçek backend kullanılacak
const SIMULATION_MODE = false;

// Kullanıcı verilerini ve token'ı AsyncStorage'a kaydet
const saveUserData = async (userData, token) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Kullanıcı verilerini AsyncStorage'dan sil
const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

const authService = {
  // Kullanıcı girişi
  login: async (email, password) => {
    try {
      // Gerçek API isteği
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      
      // API'den dönen yanıt şu yapıda olmalı:
      // { _id, name, email, avatar, isOnline, token }
      const userData = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isOnline: response.data.isOnline
      };
      
      const token = response.data.token;
      
      // Kullanıcı verilerini ve token'ı kaydet
      await saveUserData(userData, token);
      
      return { user: userData, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data?.message || 'Giriş yapılırken bir hata oluştu';
    }
  },
  
  // Kullanıcı kaydı
  register: async (name, email, password) => {
    try {
      // Gerçek API isteği
      const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, {
        name,
        email,
        password,
      });
      
      // API'den dönen yanıt şu yapıda olmalı:
      // { _id, name, email, avatar, isOnline, token }
      const userData = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isOnline: response.data.isOnline
      };
      
      const token = response.data.token;
      
      // Kullanıcı verilerini ve token'ı kaydet
      await saveUserData(userData, token);
      
      return { user: userData, token };
    } catch (error) {
      console.error('Register error:', error);
      throw error.response?.data?.message || 'Kayıt olurken bir hata oluştu';
    }
  },
  
  // Çıkış yap
  logout: async () => {
    try {
      // Token al
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // Gerçek API isteği
        await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
      }
      
      // Her durumda yerel verileri temizle
      await clearUserData();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Hata olsa bile yerel verileri temizle
      await clearUserData();
      
      return true;
    }
  },
  
  // Şifremi unuttum
  forgotPassword: async (email) => {
    try {
      // Gerçek API isteği
      const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        email,
      });
      
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error.response?.data?.message || 'Şifre sıfırlama işlemi başarısız oldu';
    }
  },
  
  // Token doğrulama
  verifyToken: async (token) => {
    try {
      // Token header'a zaten interceptor tarafından ekleniyor
      const response = await apiClient.get(AUTH_ENDPOINTS.VERIFY_TOKEN);
      
      if (response.data.isValid) {
        // API'den gelen kullanıcı verisi
        const userData = {
          id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          avatar: response.data.user.avatar,
          isOnline: response.data.user.isOnline
        };
        
        // Kullanıcı verilerini güncelle
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
      } else {
        throw new Error('Token geçersiz');
      }
    } catch (error) {
      console.error('Verify token error:', error);
      throw error.response?.data?.message || 'Oturum doğrulanamadı';
    }
  },
  
  // Mevcut kullanıcı verilerini al
  getCurrentUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  // Token kontrolü
  checkToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token; // Boolean değer döndür (token varsa true, yoksa false)
    } catch (error) {
      console.error('Check token error:', error);
      return false;
    }
  },
};

export default authService; 