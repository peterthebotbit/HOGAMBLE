export default function setupChatSockets(io) {
  const chatRooms = new Map();
  
  io.on('connection', (socket) => {
    socket.on('join_chat', (data) => {
      const { userId, username, room } = data;
      socket.join(`chat:${room}`);
      
      io.to(`chat:${room}`).emit('user_joined', {
        username,
        timestamp: new Date()
      });
    });
    
    socket.on('send_message', (data) => {
      const { username, message, room, timestamp } = data;
      
      // Basic profanity filter
      let filteredMessage = message
        .replace(/badword1/gi, '****')
        .replace(/badword2/gi, '****');
      
      io.to(`chat:${room}`).emit('new_message', {
        username,
        message: filteredMessage,
        timestamp: timestamp || new Date(),
        isSystemMessage: false
      });
    });
    
    socket.on('leave_chat', (data) => {
      const { username, room } = data;
      socket.leave(`chat:${room}`);
      
      io.to(`chat:${room}`).emit('user_left', {
        username,
        timestamp: new Date()
      });
    });
  });
}
