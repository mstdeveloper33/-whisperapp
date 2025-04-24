import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import messageReducer from './slices/messageSlice';

// Redux store yapılandırması
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    messages: messageReducer,
    // Diğer reducer'ları daha sonra ekleyeceğiz
  },
  // Geliştirme ortamında Redux DevTools'u aktif et
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
