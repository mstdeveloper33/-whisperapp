import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, setActiveChat } from '../../redux/slices/messageSlice';
import messageService from '../../api/services/messageService';
import { getApiBaseUrl } from '../../utils/deviceUtils';

const ChatDetailScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const roomIdRef = useRef(null);
  
  // Redux'tan mesajları al
  const messages = useSelector((state) => state.messages.messages[userId] || []);
  const loading = useSelector((state) => state.messages.loading);
  const error = useSelector((state) => state.messages.error);
  const isTypingPartner = useSelector((state) => state.messages.isTyping[userId] || false);
  
  // Mevcut kullanıcı
  const currentUser = useSelector((state) => state.auth.user);
  
  // Bağlantı durumunu kontrol et
  const checkConnectionStatus = async () => {
    try {
      setCheckingConnection(true);
      
      // Doğrudan API'ye bir ping isteği gönder
      console.log('Doğrudan sunucu testi yapılıyor...');
      try {
        const apiUrl = getApiBaseUrl();
        console.log(`Test edilecek API URL: ${apiUrl}`);
        
        const testResponse = await fetch(apiUrl.replace('/api', ''), { 
          method: 'GET',
          timeout: 5000 
        });
        console.log('Sunucu test yanıtı:', testResponse.status, await testResponse.text());
      } catch (pingError) {
        console.error('Ping hatası:', pingError);
      }
      
      const status = await messageService.checkConnections();
      setConnectionStatus(status);
      console.log('Bağlantı durumu:', status);
      
      if (!status.apiConnected) {
        console.warn(`API bağlantısı yok: ${status.apiUrl}`);
      }
      
      if (!status.socketConnected) {
        console.warn(`Socket bağlantısı yok: ${status.socketUrl}`);
      }
      
      return status;
    } catch (error) {
      console.error('Bağlantı kontrolü hatası:', error);
      setConnectionStatus({ 
        apiConnected: false, 
        socketConnected: false,
        error: error.message
      });
      return false;
    } finally {
      setCheckingConnection(false);
    }
  };
  
  // Mesajları yükle
  useEffect(() => {
    // Aktif sohbeti ayarla
    dispatch(setActiveChat(userId));
    
    // Mesajları getir
    dispatch(fetchMessages(userId));
    
    // Sohbet odası oluştur
    roomIdRef.current = messageService.joinChatRoom(userId);
    
    // Bağlantı durumunu kontrol et
    checkConnectionStatus();
    
    // Ekran kapatıldığında
    return () => {
      dispatch(setActiveChat(null));
    };
  }, [dispatch, userId]);
  
  // Mesaj gönderme
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // Mesaj içeriğini önce kaydet ve input'u temizle
      const messageContent = newMessage;
      setNewMessage('');
      
      // Kullanıcı kontrolü
      if (!currentUser || !currentUser.id) {
        throw new Error('Oturum bilgileriniz bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // Alıcı kontrolü
      if (!userId) {
        throw new Error('Mesaj göndermek için geçerli bir alıcı gerekli.');
      }
      
      // Önce bağlantı durumunu kontrol et
      let status;
      try {
        status = await checkConnectionStatus();
        if (!status.apiConnected) {
          throw new Error(`API sunucusuna bağlanılamadı (${status.apiUrl}). Lütfen bağlantınızı kontrol edin ve tekrar deneyin.`);
        }
      } catch (connectionError) {
        console.error('Bağlantı kontrolü sırasında hata:', connectionError);
        throw new Error('Sunucu bağlantısı kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      
      // Not: Sunucu çalışıyor ancak API endpoint'ler yetkilendirme gerektirebilir
      if (status?.apiWarning && status.apiWarning.includes('require authentication')) {
        console.log('API çalışıyor ancak yetkilendirme gerektirir. Redux aracılığıyla mesaj gönderme denenecek...');
      }
      
      // Mesaj gönder
      try {
        console.log(`Mesaj gönderiliyor: ${userId}, "${messageContent}"`);
        
        // Redux thunk ile mesaj göndermeyi dene
        await dispatch(sendMessage({
          receiverId: userId,
          content: messageContent,
          messageType: 'text',
        })).unwrap();
        
        // Başarılı gönderim
        console.log('Mesaj başarıyla gönderildi');
      } catch (dispatchError) {
        // Redux hatası
        console.error('Redux üzerinden mesaj gönderme hatası:', dispatchError);
        
        // Yetkilendirme sorunu olabilir
        if (typeof dispatchError === 'string' && 
            (dispatchError.includes('401') || 
             dispatchError.includes('yetkilendirme') || 
             dispatchError.includes('Unauthorized'))) {
          throw new Error('Oturumunuz sona ermiş görünüyor. Lütfen tekrar giriş yapın.');
        }
        
        // Fallback: Doğrudan messageService ile tekrar dene
        try {
          console.log('Redux başarısız oldu, doğrudan messageService kullanılarak tekrar deneniyor...');
          await messageService.sendMessage(userId, messageContent, 'text');
          console.log('Mesaj messageService ile başarıyla gönderildi');
        } catch (serviceError) {
          console.error('messageService ile mesaj gönderme hatası:', serviceError);
          throw serviceError; // Tekrar hata fırlatarak ana catch bloğuna düşmesini sağla
        }
      }
      
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      // Hata mesajını belirle
      let errorMessage;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = 'Mesajınız gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      }
      
      // Hata tipine göre kullanıcıya farklı mesajlar göster
      if (errorMessage.includes('bağlantı') || 
          errorMessage.includes('internet') || 
          errorMessage.includes('Network')) {
        errorMessage = `Bağlantı hatası: ${errorMessage}`;
      } else if (errorMessage.includes('oturum') || 
                errorMessage.includes('giriş yapın') || 
                errorMessage.includes('401')) {
        errorMessage = `Oturum hatası: ${errorMessage}`;
      }
      
      Alert.alert(
        'Mesaj Gönderilemedi',
        errorMessage,
        [{ text: 'Tamam' }]
      );
      
      // Hata durumunda mesaj içeriğini geri getir
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
      // Yazma durumunu kapat
      handleStopTyping();
    }
  };
  
  // Yeniden bağlanmayı dene
  const handleRetryConnection = async () => {
    await checkConnectionStatus();
  };
  
  // Yazıyor bilgisi gönderme
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Yazıyor bildirimi gönder
      if (roomIdRef.current) {
        messageService.sendTypingNotification(roomIdRef.current, true);
      }
    }
    
    // Önceki timeout'u temizle
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 3 saniye sonra yazma durumunu kapat
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };
  
  // Yazma durumunu sonlandırma
  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      // Yazma durumu bitti bildirimi gönder
      if (roomIdRef.current) {
        messageService.sendTypingNotification(roomIdRef.current, false);
      }
    }
  };
  
  // Her mesaj için tarih formatı
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Mesaj renderleyici
  const renderMessage = ({ item }) => {
    // Mesaj item'ı kontrol et
    if (!item || !item.sender) {
      console.warn('Geçersiz mesaj verisi:', item);
      return null;
    }
    
    // Kimin mesajı olduğunu kontrol et
    const isMyMessage = item.sender._id === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };
  
  // Bağlantı durum göstergesi
  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;
    
    const { apiConnected, socketConnected } = connectionStatus;
    const isConnected = apiConnected && socketConnected;
    
    return (
      <TouchableOpacity 
        style={[
          styles.connectionStatus,
          isConnected ? styles.connectedStatus : styles.disconnectedStatus
        ]} 
        onPress={handleRetryConnection}
      >
        <Text style={styles.connectionStatusText}>
          {checkingConnection ? 'Bağlantı kontrol ediliyor...' : 
           isConnected ? 'Bağlantı kuruldu' : 'Bağlantı sorunu! Dokunarak tekrar deneyin.'}
        </Text>
        {!isConnected && (
          <Text style={styles.connectionDetailsText}>
            API: {apiConnected ? '✓' : '✗'} | Socket: {socketConnected ? '✓' : '✗'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderConnectionStatus()}
        
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => dispatch(fetchMessages(userId))}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            inverted={true} // En son mesaj altta olacak şekilde
          />
        )}
        
        {isTypingPartner && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{userName} yazıyor...</Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Mesajınızı yazın..."
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton, 
              (newMessage.trim() === '' || sendingMessage) && styles.disabledSendButton
            ]}
            onPress={handleSendMessage}
            disabled={newMessage.trim() === '' || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  messagesList: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingContainer: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  typingText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#BDBDBD',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  connectionStatus: {
    padding: 8,
    alignItems: 'center',
  },
  connectedStatus: {
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  disconnectedStatus: {
    backgroundColor: 'rgba(244,67,54,0.1)',
  },
  connectionStatusText: {
    fontSize: 14,
    color: '#333333',
  },
  connectionDetailsText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});

export default ChatDetailScreen; 