import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messageService from '../../api/services/messageService';

// Başlangıç durumu
const initialState = {
  messages: {},  // { userId: [messages] } formatında
  activeChat: null,
  isTyping: {},  // { userId: boolean } formatında
  loading: false,
  error: null,
};

// Async Thunk'lar
// Mesajları getir
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (userId, { rejectWithValue }) => {
    try {
      const messages = await messageService.getMessages(userId);
      return { userId, messages };
    } catch (error) {
      return rejectWithValue(
        typeof error === 'string' ? error : 'Mesajlar yüklenemedi'
      );
    }
  }
);

// Mesaj gönder
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ receiverId, content, messageType, media }, { rejectWithValue, getState }) => {
    try {
      console.log(`Redux Thunk: Mesaj gönderiliyor - Alıcı: ${receiverId}, İçerik: ${content}`);
      
      // Mevcut kullanıcıyı al
      const currentUser = getState().auth.user;
      
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      if (!receiverId) {
        throw new Error('Geçerli bir alıcı ID gerekli');
      }
      
      if (!content || content.trim() === '') {
        throw new Error('Mesaj içeriği boş olamaz');
      }
      
      // Mesaj service çağır - receiverId, content, messageType, media parametrelerini gönderiyoruz
      const message = await messageService.sendMessage(receiverId, content, messageType, media);
      
      // Başarılı yanıt döndü mü kontrol et
      if (!message) {
        throw new Error('Mesaj gönderilemedi: Sunucudan geçersiz yanıt');
      }
      
      return { receiverId, message };
    } catch (error) {
      console.error('Send message error in Redux:', error);
      
      // Hatanın türüne göre çeşitli mesaj formatlarını kontrol et
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else if (typeof error === 'string') {
        return rejectWithValue(error);
      } else if (error.response && error.response.data && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue('Mesaj gönderilemedi');
      }
    }
  }
);

// Mesajı okundu olarak işaretle
export const markMessageAsRead = createAsyncThunk(
  'messages/markMessageAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const updatedMessage = await messageService.markAsRead(messageId);
      return updatedMessage;
    } catch (error) {
      return rejectWithValue(
        typeof error === 'string' ? error : 'Mesaj okundu işaretlenemedi'
      );
    }
  }
);

// Mesajı sil
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await messageService.deleteMessage(messageId);
      return messageId;
    } catch (error) {
      return rejectWithValue(
        typeof error === 'string' ? error : 'Mesaj silinemedi'
      );
    }
  }
);

// Message slice
export const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Aktif sohbeti ayarla
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    
    // Yeni mesaj alındı (socket.io üzerinden)
    messageReceived: (state, action) => {
      const { sender, receiver } = action.payload;
      // Mesajı gönderen veya alıcı ben değilsem işleme
      const myId = receiver._id; // TODO: Gerçek uygulamada kendi ID'nizi alın
      const otherUserId = sender._id === myId ? receiver._id : sender._id;
      
      // Kullanıcı için mesaj listesi yoksa oluştur
      if (!state.messages[otherUserId]) {
        state.messages[otherUserId] = [];
      }
      
      // Mesajı ekle
      state.messages[otherUserId].push(action.payload);
    },
    
    // Yazıyor durumunu ayarla
    setTypingStatus: (state, action) => {
      const { userId, isTyping } = action.payload;
      state.isTyping[userId] = isTyping;
    },
    
    // Hata durumunu temizle
    clearError: (state) => {
      state.error = null;
    },
    
    // Tüm mesajları temizle (test amaçlı)
    clearAllMessages: (state) => {
      state.messages = {};
    }
  },
  extraReducers: (builder) => {
    // Mesajları getirme
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { userId, messages } = action.payload;
        state.loading = false;
        state.messages[userId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mesaj gönderme
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { receiverId, message } = action.payload;
        state.loading = false;
        
        // Kullanıcı için mesaj listesi yoksa oluştur
        if (!state.messages[receiverId]) {
          state.messages[receiverId] = [];
        }
        
        // Mesajı ekle
        state.messages[receiverId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Mesaj gönderme işlemi başarısız:', action.payload);
      })
      
      // Mesajı okundu olarak işaretleme
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const userId = updatedMessage.sender._id; // Mesajı gönderen kişinin ID'si
        
        // İlgili kullanıcının mesajlarını bul
        if (state.messages[userId]) {
          // Mesajı güncelle
          state.messages[userId] = state.messages[userId].map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          );
        }
      })
      
      // Mesajı silme
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        
        // Tüm kullanıcıların mesajlarından silinen mesajı kaldır
        Object.keys(state.messages).forEach(userId => {
          state.messages[userId] = state.messages[userId].filter(
            msg => msg._id !== messageId
          );
        });
      });
  },
});

// Action creators
export const { 
  setActiveChat, 
  messageReceived, 
  setTypingStatus, 
  clearError,
  clearAllMessages
} = messageSlice.actions;

// Selector
export const selectMessages = (state, userId) => state.messages.messages[userId] || [];
export const selectActiveChat = (state) => state.messages.activeChat;
export const selectTypingStatus = (state, userId) => state.messages.isTyping[userId] || false;
export const selectMessageLoading = (state) => state.messages.loading;
export const selectMessageError = (state) => state.messages.error;

export default messageSlice.reducer;
