import apiClient from '../client';
import { MESSAGE_ENDPOINTS } from '../endpoints';
import socketManager from '../socketManager';
import { getApiBaseUrl, getSocketBaseUrl } from '../../utils/deviceUtils';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const messageService = {
  // Bir kullanıcıyla olan tüm mesajları getir
  getMessages: async (userId) => {
    try {
      const response = await apiClient.get(MESSAGE_ENDPOINTS.GET_MESSAGES(userId));
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error);
      
      // Ağ hatalarını daha açıklayıcı hale getir
      if (error.message && error.message.includes('Network Error')) {
        const apiUrl = getApiBaseUrl();
        throw `Sunucuya bağlanılamadı (${apiUrl}). Lütfen ağ bağlantınızı kontrol edin.`;
      }
      
      throw error.response?.data?.message || 'Mesajlar yüklenemedi';
    }
  },
  
  // Yeni mesaj gönder
  sendMessage: async (receiverId, content, messageType = 'text', media = null) => {
    try {
      console.log(`Mesaj gönderiliyor: ${receiverId}, ${content}`);
      console.log(`Kullanılan platform: ${Platform.OS}`);
      
      // Alıcı ID kontrolü
      if (!receiverId) {
        throw new Error('Geçerli bir alıcı ID gerekli');
      }
      
      // API request hazırla - Backend'in beklediği formata göre düzenliyoruz
      const messageData = {
        receiverId: receiverId,  // Backend receiverId bekliyor, receiver değil
        content: content || '',   // Mesaj içeriği
        messageType: messageType || 'text'
      };
      
      // Eğer medya dosyası varsa ekle
      if (media) {
        messageData.mediaUrl = media.url;
        messageData.mediaType = media.type;
        messageData.mediaSize = media.size;
        messageData.mediaName = media.name;
      }
      
      console.log('Gönderilecek veri:', JSON.stringify(messageData, null, 2));
      console.log('API URL:', getApiBaseUrl() + MESSAGE_ENDPOINTS.SEND_MESSAGE);
      
      // Önce token kontrolü yap
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // API isteği gönder (daha uzun timeout ile)
      const response = await apiClient.post(MESSAGE_ENDPOINTS.SEND_MESSAGE, messageData, {
        timeout: 15000 // 15 saniye timeout
      });
      
      // Başarılı yanıt kontrolü
      if (!response || !response.data) {
        throw new Error('Sunucudan geçersiz yanıt alındı');
      }
      
      console.log('Mesaj başarıyla kaydedildi:', response.data);
      
      // Socket.io ile mesajı real-time olarak alıcıya ilet
      const socket = socketManager.getSocket();
      if (socket && socket.connected) {
        console.log('Socket bağlantısı var, mesaj iletiliyor...');
        socket.emit('new message', response.data);
      } else {
        console.warn('Socket bağlantısı yok veya bağlı değil. Sadece API ile mesaj gönderildi.');
      }
      
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      
      // Hata detaylarını daha fazla göster
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        
        // Yetkilendirme hatası
        if (error.response.status === 401) {
          throw new Error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        }
        
        // Diğer API hataları
        if (error.response.data && error.response.data.message) {
          throw new Error(`Sunucu hatası: ${error.response.data.message}`);
        }
      }
      
      // Ağ bağlantı hatası için özel mesaj
      if (error.message && error.message.includes('Network Error')) {
        const apiUrl = getApiBaseUrl();
        throw new Error(`Sunucuya bağlanılamadı (${apiUrl}). Lütfen ağ bağlantınızı ve server'ın çalıştığını kontrol edin.`);
      }
      
      // Timeout hatası için özel mesaj
      if (error.code === 'ECONNABORTED') {
        throw new Error('Sunucu yanıt vermedi. Lütfen internet bağlantınızı kontrol edin.');
      }
      
      // Android emülatörde 10.0.2.2 bağlantı sorunu
      if (Platform.OS === 'android' && error.message && (error.message.includes('10.0.2.2') || error.message.includes('failed to connect'))) {
        throw new Error('Android emülatörde bağlantı hatası. Sunucunun çalıştığından ve doğru portta dinlediğinden emin olun.');
      }
      
      // Genel hata
      throw new Error(error.message || 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  // Mesajı okundu olarak işaretle
  markAsRead: async (messageId) => {
    try {
      const response = await apiClient.put(MESSAGE_ENDPOINTS.MARK_AS_READ(messageId));
      return response.data;
    } catch (error) {
      console.error('Mark as read error:', error);
      
      // Ağ hatalarını daha açıklayıcı hale getir
      if (error.message && error.message.includes('Network Error')) {
        const apiUrl = getApiBaseUrl();
        throw `Sunucuya bağlanılamadı (${apiUrl}). Lütfen ağ bağlantınızı kontrol edin.`;
      }
      
      throw error.response?.data?.message || 'Mesaj okundu işaretlenemedi';
    }
  },
  
  // Mesajı sil
  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(MESSAGE_ENDPOINTS.DELETE_MESSAGE(messageId));
      return response.data;
    } catch (error) {
      console.error('Delete message error:', error);
      
      // Ağ hatalarını daha açıklayıcı hale getir
      if (error.message && error.message.includes('Network Error')) {
        const apiUrl = getApiBaseUrl();
        throw `Sunucuya bağlanılamadı (${apiUrl}). Lütfen ağ bağlantınızı kontrol edin.`;
      }
      
      throw error.response?.data?.message || 'Mesaj silinemedi';
    }
  },
  
  // Socket bağlantısını kur
  setupSocketConnection: (userId) => {
    const socket = socketManager.getSocket();
    
    if (socket) {
      try {
        // Kullanıcı bilgisi ile socket bağlantısını başlat
        // MongoDB _id formatında userId gönder
        socket.emit('setup', { _id: userId });
        
        // Socket event listener'ları kur
        socket.on('connected', () => {
          console.log('Socket.io bağlantısı kuruldu');
        });
        
        // Mesaj alma listener'ı
        socket.on('message received', (newMessage) => {
          // Bu event'i yakalayacak Redux action'ı veya callback fonksiyonu buradan çağrılabilir
          console.log('Yeni mesaj alındı:', newMessage);
          // Örnek: store.dispatch(newMessageReceived(newMessage));
        });
        
        // Yazıyor... bildirimi için listener'lar
        socket.on('typing', () => {
          // Kullanıcı yazıyor bildirimi için gerekli işlemler
          console.log('Karşı taraf yazıyor...');
        });
        
        socket.on('stop typing', () => {
          // Kullanıcı yazmayı bıraktı bildirimi için gerekli işlemler
          console.log('Karşı taraf yazmayı bıraktı');
        });
      } catch (error) {
        console.error('Socket event kurulum hatası:', error);
      }
    } else {
      console.warn('Socket bağlantısı olmadığından eventler kurulamadı');
    }
  },
  
  // Özel sohbet odasına katıl
  joinChatRoom: (userId) => {
    const socket = socketManager.getSocket();
    if (socket) {
      try {
        // Benzersiz oda ID'si oluştur (her iki kullanıcı ID'si alfabetik sırayla)
        const currentUserId = socket.userId; // Kendi ID'miz
        
        // userId kontrolü yap
        if (!currentUserId) {
          console.warn('Socket userId tanımlı değil, joinChatRoom başarısız olabilir');
        }
        
        const roomId = [currentUserId, userId].sort().join('_');
        
        // Odaya katıl
        socket.emit('join chat', roomId);
        console.log(`Sohbet odasına katılıyor: ${roomId}`);
        return roomId;
      } catch (error) {
        console.error('Sohbet odasına katılma hatası:', error);
        return null;
      }
    }
    return null;
  },
  
  // Yazıyor bildirimi gönder
  sendTypingNotification: (roomId, isTyping) => {
    const socket = socketManager.getSocket();
    if (socket) {
      try {
        if (isTyping) {
          socket.emit('typing', roomId);
        } else {
          socket.emit('stop typing', roomId);
        }
      } catch (error) {
        console.error('Yazma bildirimi gönderme hatası:', error);
      }
    }
  },
  
  // Socket ve API bağlantı durumunu kontrol et
  checkConnections: async () => {
    const connectionStatus = {
      apiConnected: false,
      socketConnected: false,
      apiUrl: getApiBaseUrl(),
      socketUrl: getSocketBaseUrl(),
      platform: Platform.OS,
      timeChecked: new Date().toISOString()
    };
    
    console.log(`[checkConnections] Platform: ${Platform.OS}`);
    console.log(`[checkConnections] API URL: ${connectionStatus.apiUrl}`);
    console.log(`[checkConnections] Socket URL: ${connectionStatus.socketUrl}`);
    
    // API bağlantısını kontrol et
    try {
      // Önce basit bir GET isteği deneyin (açık endpoint)
      const baseUrl = connectionStatus.apiUrl.replace('/api', '');
      console.log(`[checkConnections] Testing base URL: ${baseUrl}`);
      
      // Kök URL'i test et - bu yetkilendirme gerektirmez
      try {
        // Timeout ile istek
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const baseResponse = await fetch(baseUrl, { 
          signal: controller.signal,
          method: 'GET'
        });
        
        clearTimeout(timeoutId);
        
        console.log(`[checkConnections] Base URL response: ${baseResponse.status}`);
        
        if (baseResponse.ok) {
          console.log('[checkConnections] Base URL is accessible');
          connectionStatus.apiConnected = true;
          
          // API erişilebilir, ama yetkilendirme gerektirir
          // Kök URL'ye erişilebildiği için API çalışıyor
          connectionStatus.apiWarning = 'Server is running, but API endpoints require authentication';
        } else {
          // Başarısız ama yine de bir yanıt alındı, sunucu çalışıyor olabilir
          connectionStatus.apiConnected = true;
          connectionStatus.apiWarning = `Server returned status code: ${baseResponse.status}`;
        }
      } catch (fetchError) {
        // Timeout veya ağ hatası
        if (fetchError.name === 'AbortError') {
          console.error('[checkConnections] Fetch timeout!');
          connectionStatus.apiConnected = false;
          connectionStatus.apiError = 'Connection timeout';
        } else {
          console.error('[checkConnections] Fetch error:', fetchError.message);
          connectionStatus.apiConnected = false;
          connectionStatus.apiError = fetchError.message;
        }
        
        // XMLHttpRequest ile tekrar dene (bazı durumlarda daha güvenilir)
        try {
          console.log('[checkConnections] Retrying with XMLHttpRequest...');
          const isReachable = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const timeout = 5000;
            
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                // herhangi bir response alındıysa, sunucu çalışıyor demektir
                resolve(true);
              }
            };
            
            xhr.onerror = function() {
              console.error('[checkConnections] XMLHttpRequest error');
              resolve(false);
            };
            
            xhr.ontimeout = function() {
              console.error('[checkConnections] XMLHttpRequest timeout');
              resolve(false);
            };
            
            xhr.open('GET', baseUrl, true);
            xhr.timeout = timeout;
            xhr.send();
          });
          
          if (isReachable) {
            console.log('[checkConnections] Server is reachable via XMLHttpRequest');
            connectionStatus.apiConnected = true;
            connectionStatus.apiWarning = 'Server is reachable, but might not be fully functional';
          }
        } catch (xhrError) {
          console.error('[checkConnections] XMLHttpRequest error:', xhrError);
        }
      }
    } catch (error) {
      connectionStatus.apiConnected = false;
      connectionStatus.apiError = error.message;
      console.error('[checkConnections] API connection error:', error.message);
    }
    
    // Socket bağlantısını kontrol et
    const socket = socketManager.getSocket();
    connectionStatus.socketConnected = socket && socket.connected;
    
    if (!connectionStatus.socketConnected) {
      // Socket bağlı değilse yeniden bağlanmaya çalış
      try {
        console.log('[checkConnections] Socket not connected, attempting to reconnect...');
        // Yeni bir socket bağlantısı başlatmaya çalış
        if (socket) {
          // Socket var ama bağlı değil, yeniden bağlanmayı zorla
          await socketManager.forceReconnect();
        } else {
          // Socket yok, yeni bağlantı başlat
          await socketManager.init();
        }
        
        // Bağlantı durumunu tekrar kontrol et
        const reconnectedSocket = socketManager.getSocket();
        const isConnected = reconnectedSocket && reconnectedSocket.connected;
        
        connectionStatus.socketConnected = isConnected;
        if (isConnected) {
          console.log('[checkConnections] Socket successfully reconnected');
        } else {
          console.log('[checkConnections] Socket reconnection failed');
          if (reconnectedSocket) {
            connectionStatus.socketError = 'Socket initialized but not connected';
          } else {
            connectionStatus.socketError = 'Socket not initialized';
          }
        }
      } catch (socketError) {
        console.error('[checkConnections] Socket reconnection error:', socketError);
        connectionStatus.socketError = socketError.message || 'Failed to reconnect socket';
      }
    }
    
    console.log('[checkConnections] Results:', JSON.stringify(connectionStatus, null, 2));
    return connectionStatus;
  }
};

export default messageService; 