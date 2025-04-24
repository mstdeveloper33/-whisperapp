/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import socketManager from './src/api/socketManager';
import { logDeviceInfo } from './src/utils/deviceUtils';

const App = () => {
  const [socketInitialized, setSocketInitialized] = useState(false);

  // Başlangıçta cihaz bilgilerini logla
  useEffect(() => {
    const runStartupDiagnostics = async () => {
      console.log('======== WHISPER APP STARTING ========');
      await logDeviceInfo();
      console.log('======================================');
    };
    
    runStartupDiagnostics();
  }, []);

  // Uygulama başladığında socket bağlantısını kur
  useEffect(() => {
    // Socket bağlantısını başlat - Ana bağlantı AppNavigator'da yapılacak
    // Burada hemen bağlantı kurmak zorunda değiliz, oturum açınca da yapılabilir
    const initSocket = async () => {
      try {
        console.log('Socket bağlantısı başlatılıyor...');
        // AsyncStorage token kontrolü socketManager içinde yapıldığı için
        // buradan bağlantı kurmayı deneyebiliriz, ancak bağlanamasa bile sorun değil
        await socketManager.init();
        setSocketInitialized(true);
        console.log('Socket bağlantısı başlatıldı:', socketInitialized);
      } catch (error) {
        console.log('Socket başlatma hatası (App.js):', error);
        // Hata olsa bile uygulama normal çalışmaya devam eder
      }
    };

    // Kullanıcı zaten oturum açmış olabilir, o yüzden socket bağlantısını dene
    initSocket();

    // Uygulama kapandığında socket bağlantısını kapat
    return () => {
      try {
        console.log('Socket bağlantısı kapatılıyor...');
        socketManager.disconnect();
      } catch (error) {
        console.log('Socket kapatma hatası:', error);
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
};

export default App; 