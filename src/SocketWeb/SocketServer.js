export default (io) => {
    // Create a namespace '/chat'
    const chatNamespace = io.of("/chat");

    chatNamespace.on("connection", function (socket) {
        console.log("Socket connected to /chat namespace");

        socket.on("joinRoom", (roomid) => {
            socket.join(roomid);
            console.log("User joined room", roomid);
        });

        socket.on("sendMessage", (data) => {
            console.log("Received message: ", data);
            // Broadcast message to the room
            chatNamespace.to(data.roomId).emit("newMessage", data.message);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected from /chat namespace");
        });
    });
};
