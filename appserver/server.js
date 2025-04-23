// server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./server/config/db');
const colors = require('colors');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Routes
const authRoutes = require('./server/routes/authRoutes');
const userRoutes = require('./server/routes/userRoutes');
const messageRoutes = require('./server/routes/messageRoutes');
const groupRoutes = require('./server/routes/groupRoutes');

// Middleware
const { notFound, errorHandler } = require('./server/middlewares/errorMiddleware');
const { apiLimiter, authLimiter, messageLimiter } = require('./server/middlewares/rateLimitMiddleware');

// .env dosyasını yükle
dotenv.config();

// MongoDB'ye bağlan
connectDB();

// Express uygulamasını başlat
const app = express();

// CORS middleware'i ekliyoruz (frontend ile backend arasındaki bağlantı için)
app.use(cors());

// JSON verilerini parse etmek için middleware
app.use(express.json());

// Genel API limiter'ı uygula
app.use(apiLimiter);

// Routes (spesifik limiter'lar ile)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageLimiter, messageRoutes);
app.use('/api/groups', groupRoutes);

// Temel route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Hata yakalama middleware'leri
app.use(notFound);
app.use(errorHandler);

// HTTP sunucusu oluştur
const server = http.createServer(app);

// Socket.IO başlat
const io = socketIO(server, {
  cors: {
    origin: '*', // Güvenlik için üretimde değiştirilmeli
    methods: ['GET', 'POST'],
  },
});

// Aktif kullanıcı listesini sakla
const activeUsers = new Map(); // userId => socketId

// Grup odaları - Map: groupId => Set of socketIds
const groupRooms = new Map();

// Socket bağlantılarını dinle
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı', socket.id);

  // Kullanıcı oturum açtığında
  socket.on('setup', (userData) => {
    // Kullanıcı ID'sini sakla
    activeUsers.set(userData._id, socket.id);
    console.log('Kullanıcı bağlandı:', userData.name);
    socket.emit('connected');
  });

  // Kullanıcı bir sohbete katıldığında (özel sohbet)
  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('Kullanıcı odaya katıldı:', room);
  });

  // Kullanıcı bir grup sohbetine katıldığında
  socket.on('join group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log('Kullanıcı grup odasına katıldı:', groupId);
    
    // Grup odasına kullanıcı ekle
    if (!groupRooms.has(groupId)) {
      groupRooms.set(groupId, new Set());
    }
    groupRooms.get(groupId).add(socket.id);
  });

  // Kullanıcı özel mesaj gönderdiğinde
  socket.on('new message', (newMessageReceived) => {
    const receiverId = newMessageReceived.receiver._id;
    
    // Mesajı alacak kullanıcı aktif mi kontrol et
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      // Alıcı aktifse, mesajı doğrudan ilet
      io.to(receiverSocketId).emit('message received', newMessageReceived);
    }
  });

  // Kullanıcı grup mesajı gönderdiğinde
  socket.on('new group message', (newGroupMessage) => {
    const groupId = newGroupMessage.group;
    
    // Mesajı grubun socket odasına ilet
    socket.to(`group-${groupId}`).emit('group message received', newGroupMessage);
  });

  // Kullanıcı yazıyor bildirimi (özel sohbet)
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  // Kullanıcı grup sohbetinde yazıyor bildirimi
  socket.on('group typing', (groupId) => {
    socket.to(`group-${groupId}`).emit('group typing', {
      groupId,
      userId: socket.userId
    });
  });
  
  socket.on('group stop typing', (groupId) => {
    socket.to(`group-${groupId}`).emit('group stop typing', {
      groupId,
      userId: socket.userId
    });
  });

  // Kullanıcı bağlantısı kesildiğinde
  socket.on('disconnect', () => {
    console.log('Kullanıcı bağlantısı kesildi');
    
    // Aktif kullanıcı listesinden çıkar
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
    
    // Grup odalarından çıkar
    for (const [groupId, socketIds] of groupRooms.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        
        // Eğer odada hiç kullanıcı kalmadıysa, odayı sil
        if (socketIds.size === 0) {
          groupRooms.delete(groupId);
        }
      }
    }
  });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`.yellow.bold));
