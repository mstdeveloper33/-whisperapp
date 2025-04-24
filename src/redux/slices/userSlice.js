import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../api/services/userService';

// Başlangıç durumu
const initialState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
};

// Async Thunk'lar
// Kullanıcı listesini getir
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getUsers();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Kullanıcılar yüklenemedi'
      );
    }
  }
);

// Belirli bir kullanıcıyı getir
export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      return await userService.getUser(userId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Kullanıcı yüklenemedi'
      );
    }
  }
);

// Kullanıcı profilini getir
export const fetchProfile = createAsyncThunk(
  'users/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getProfile();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Profil yüklenemedi'
      );
    }
  }
);

// Kullanıcı profilini güncelle
export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      return await userService.updateProfile(profileData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Profil güncellenemedi'
      );
    }
  }
);

// User slice
export const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Belirli bir kullanıcıyı seç
    selectUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    // Hata durumunu sıfırla
    clearError: (state) => {
      state.error = null;
    },
    // Seçili kullanıcıyı sıfırla
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    // Kullanıcı listesini getirme
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Belirli bir kullanıcıyı getirme
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Kullanıcı profilini getirme
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Kullanıcı profilini selectedUser'a atıyoruz
        state.selectedUser = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Kullanıcı profilini güncelleme
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Action creators
export const { selectUser, clearError, clearSelectedUser } = userSlice.actions;

// Selector
export const selectUsers = (state) => state.users.users;
export const selectSelectedUser = (state) => state.users.selectedUser;
export const selectUserLoading = (state) => state.users.loading;
export const selectUserError = (state) => state.users.error;

export default userSlice.reducer;
