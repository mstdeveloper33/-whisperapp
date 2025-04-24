// Backend API endpoint'leri

// Auth ile ilgili endpoint'ler
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  VERIFY_TOKEN: '/auth/verify',
  FORGOT_PASSWORD: '/auth/forgot-password',
};

// Kullanıcı ile ilgili endpoint'ler
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  GET_USERS: '/users',
  GET_USER: (id) => `/users/${id}`,
};

// Mesajlar ile ilgili endpoint'ler
export const MESSAGE_ENDPOINTS = {
  GET_MESSAGES: (userId) => `/messages/${userId}`,
  SEND_MESSAGE: '/messages',
  DELETE_MESSAGE: (id) => `/messages/${id}`,
  MARK_AS_READ: (id) => `/messages/${id}/read`,
};

// Gruplar ile ilgili endpoint'ler
export const GROUP_ENDPOINTS = {
  GET_GROUPS: '/groups',
  CREATE_GROUP: '/groups',
  GET_GROUP: (id) => `/groups/${id}`,
  UPDATE_GROUP: (id) => `/groups/${id}`,
  DELETE_GROUP: (id) => `/groups/${id}`,
  ADD_MEMBER: (id, userId) => `/groups/${id}/members/${userId}`,
  REMOVE_MEMBER: (id, userId) => `/groups/${id}/members/${userId}`,
  GET_GROUP_MESSAGES: (id) => `/groups/${id}/messages`,
  SEND_GROUP_MESSAGE: (id) => `/groups/${id}/messages`,
}; 