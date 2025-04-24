import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocketBaseUrl } from '../utils/deviceUtils';

// Socket.io sunucu URL'si - Platform'a göre otomatik belirleniyor
// Emülatör kullanıyorsanız:
// - Android için: http://10.0.2.2:8080
// - iOS için: http://localhost:8080
// Fiziksel cihaz kullanıyorsanız local IP adresinizi kullanın

class SocketManager {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.isConnecting = false;
    this.reconnectTimer = null;
  }

  // Socket bağlantısını başlat
  init = async () => {
    try {
      // Bağlantı zaten devam ediyorsa tekrar deneme
      if (this.isConnecting) {
        console.log('Socket bağlantısı zaten kurulmaya çalışılıyor...');
        return null;
      }
      
      // Eğer zaten bir bağlantı varsa, tekrar bağlanma
      if (this.socket && this.socket.connected) {
        console.log('Socket zaten bağlı');
        return this.socket;
      }

      // Bağlantı durumunu güncelle
      this.isConnecting = true;
      
      // AsyncStorage'dan token'ı al
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      
      if (!token || !userJson) {
        console.log('Socket bağlantısı için token veya kullanıcı bilgisi yok');
        this.isConnecting = false;
        return null;
      }
      
      const user = JSON.parse(userJson);
      this.userId = user.id; // Kullanıcı ID'sini sakla
      
      // Platformuna göre URL seç
      const SOCKET_URL = getSocketBaseUrl();
      console.log(`Bağlanılacak socket URL: ${SOCKET_URL}`);
      
      // Önceki socket bağlantısını kapat
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Socket.io bağlantısını başlat
      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000 // Timeout süresini artır
      });

      // Bağlantı olayları
      this.socket.on('connect', () => {
        console.log('Socket.io bağlantısı başarıyla kuruldu');
        // Bağlantı başarılı olduğunda sayacı sıfırla
        this.connectionAttempts = 0;
        this.isConnecting = false;
        
        // Kullanıcı ID'sini sakla
        this.socket.userId = this.userId;
        // Bağlantı kurulduğunda setup event'ini çağır
        this.socket.emit('setup', { _id: this.userId });
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.io bağlantısı kesildi');
        // Bağlantı durumunu güncelle
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket bağlantı hatası:', error);
        this.isConnecting = false;
        
        // Yeniden bağlanma için maksimum deneme sayısını kontrol et
        this.connectionAttempts++;
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(`Yeniden bağlanmaya çalışılıyor (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
          // Mevcut zaman aşımını temizle
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
          }
          
          // Artan gecikme ile yeniden bağlanmayı dene (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
          console.log(`${delay}ms sonra yeniden bağlanmaya çalışılacak`);
          
          this.reconnectTimer = setTimeout(() => {
            this.init();
          }, delay);
        } else {
          console.error('Maksimum yeniden bağlanma denemesi aşıldı. Bağlantı kurulamadı.');
        }
      });
      
      // Yetki hatası
      this.socket.on('unauthorized', (error) => {
        console.error('Socket yetkilendirme hatası:', error);
        this.isConnecting = false;
        // Token geçersiz olabilir - token'ı yenileme veya kullanıcıyı çıkış yapmaya yönlendirme gerekebilir
      });

      return this.socket;
    } catch (error) {
      console.error('Socket başlatma hatası:', error);
      this.isConnecting = false;
      return null;
    }
  };

  // Mevcut socket instance'ını getir
  getSocket = () => {
    return this.socket;
  };
  
  // Bağlantı durumunu kontrol et
  isConnected = () => {
    return this.socket && this.socket.connected;
  };

  // Bağlantıyı kapat
  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      
      // Yeniden bağlanma zamanlayıcısını temizle
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Bağlantı durumunu güncelle
      this.isConnecting = false;
      this.connectionAttempts = 0;
      
      console.log('Socket.io bağlantısı kapatıldı');
    }
  };
  
  // Yeniden bağlanmayı zorla
  forceReconnect = async () => {
    console.log('Yeniden bağlanma zorlanıyor...');
    // Mevcut bağlantıyı kapat
    this.disconnect();
    // Bağlantı sayacını sıfırla
    this.connectionAttempts = 0;
    // Yeniden bağlan
    return await this.init();
  };
}

// Singleton instance
const socketManager = new SocketManager();

export default socketManager; 