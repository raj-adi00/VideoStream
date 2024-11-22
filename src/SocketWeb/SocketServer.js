const setupSocketIo = (io) => {
  const onlineUsers = {};
  io.on("connection", (socket) => {
    console.log(`User Connected ${socket.id}`);

    socket.on("userOnline", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`User ${userId} is online`);
    });
    socket.removeAllListeners("sendMessage");
    socket.on("sendMessage", ({ senderId, receiverId, message, timestamp }) => {
      const receiverSocket = onlineUsers[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId,
          message,
          receiverId,
          timestamp,
        });
      }
    });
    socket.on("disconnect", () => {
      for (const [userId, socketId] of Object.entries(onlineUsers)) {
        if (socketId === socket.id) {
          delete onlineUsers[userId];
          console.log(`User ${userId} went offline.`);
          break;
        }
      }
    });
  });
};

export default setupSocketIo;
