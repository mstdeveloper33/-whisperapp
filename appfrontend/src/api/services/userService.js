import apiClient from '../client';
import { USER_ENDPOINTS } from '../endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test için örnek kullanıcılar (gerçek bir backend olmadığında simülasyon için)
const MOCK_USERS = [
  {
    id: '1',
    name: 'Test Kullanıcı',
    email: 'test@example.com',
    avatar: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Demo Kullanıcı',
    email: 'demo@example.com',
    avatar: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isOnline: false,
  },
  {
    id: '3',
    name: 'Ali Yılmaz',
    email: 'ali@example.com',
    avatar: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Ayşe Demir',
    email: 'ayse@example.com',
    avatar: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    isOnline: false,
  },
];

// Simülasyon modu artık KAPALI - gerçek backend kullanılacak
const SIMULATION_MODE = false;

const userService = {
  // Kullanıcı profilini getir
  getProfile: async () => {
    try {
      // Gerçek API isteği
      const response = await apiClient.get(USER_ENDPOINTS.GET_PROFILE);
      
      // Kullanıcı verisini AsyncStorage'a da kaydedelim
      const userData = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isOnline: response.data.isOnline
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data?.message || 'Profil bilgisi alınamadı';
    }
  },
  
  // Kullanıcı profilini güncelle
  updateProfile: async (profileData) => {
    try {
      // Gerçek API isteği
      const response = await apiClient.put(USER_ENDPOINTS.UPDATE_PROFILE, profileData);
      
      // Güncellenmiş kullanıcı verisini AsyncStorage'a da kaydedelim
      const updatedUser = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isOnline: response.data.isOnline
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data?.message || 'Profil güncellenemedi';
    }
  },
  
  // Kullanıcı listesini getir
  getUsers: async () => {
    try {
      // Gerçek API isteği
      const response = await apiClient.get(USER_ENDPOINTS.GET_USERS);
      
      // API'den dönen kullanıcı listesini frontend formatına dönüştür
      const users = response.data.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline
      }));
      
      return users;
    } catch (error) {
      console.error('Get users error:', error);
      throw error.response?.data?.message || 'Kullanıcı listesi alınamadı';
    }
  },
  
  // Belirli bir kullanıcıyı getir
  getUser: async (userId) => {
    try {
      // Gerçek API isteği
      const response = await apiClient.get(USER_ENDPOINTS.GET_USER(userId));
      
      // API'den dönen kullanıcı verisini frontend formatına dönüştür
      const user = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isOnline: response.data.isOnline
      };
      
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error.response?.data?.message || 'Kullanıcı bilgisi alınamadı';
    }
  },
};

export default userService; 