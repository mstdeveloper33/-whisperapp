import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { navigationRef } from './navigationRef';
import { checkAuth } from '../redux/slices/authSlice';
import { View, ActivityIndicator, Text, Alert } from 'react-native';
import socketManager from '../api/socketManager';
import messageService from '../api/services/messageService';
import { messageReceived } from '../redux/slices/messageSlice';

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [socketError, setSocketError] = useState(false);

  // Uygulama başlatıldığında kimlik doğrulama durumunu kontrol et
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Kullanıcı oturum açtığında socket bağlantısını kur
  useEffect(() => {
    if (isAuthenticated && user) {
      // Socket.io bağlantısını başlat
      const setupSocketConnection = async () => {
        try {
          // Socket bağlantısını başlat
          const socket = await socketManager.init();
          
          if (socket) {
            setSocketError(false);
            // Mesaj servisine socket bağlantısını kur
            messageService.setupSocketConnection(user.id);
            
            // Yeni mesaj alındığında Redux store'a ekle
            socket.on('message received', (newMessage) => {
              dispatch(messageReceived(newMessage));
            });
          } else {
            // Socket bağlantısı kurulamadı, ama uygulamayı yine de çalıştır
            setSocketError(true);
            console.warn('Socket bağlantısı kurulumadı, ancak uygulama çalışmaya devam edecek');
          }
        } catch (error) {
          setSocketError(true);
          console.error('Socket bağlantı hatası:', error);
          // Socket hatası kullanıcıya gösterilir ama uygulama çalışmaya devam eder
          Alert.alert(
            'Bağlantı Hatası',
            'Anlık mesajlaşma servisine bağlanılamadı. Bazı özellikler kısıtlı olabilir.',
            [{ text: 'Tamam', onPress: () => console.log('OK Pressed') }]
          );
        }
      };
      
      setupSocketConnection();
      
      // Component unmount olduğunda socket bağlantısını kapat
      return () => {
        try {
          socketManager.disconnect();
        } catch (error) {
          console.error('Socket kapatma hatası:', error);
        }
      };
    }
  }, [isAuthenticated, user, dispatch]);

  // Yükleme ekranı
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
