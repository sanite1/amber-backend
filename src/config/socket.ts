import { Server } from "socket.io";
import { sendMessageService } from "../services/message.service";
const activeUsers = new Map<string, string>(); // Map to track active users (userId -> socketId)

export const setupWebSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("New WebSocket connection:", socket.id);

    socket.on("join", (userId: string) => {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      try {
        const message = await sendMessageService(senderId, receiverId, content);

        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", message);
        }

        socket.emit("messageSent", message);
      } catch (error) {
        socket.emit("error", { message: "Message sending failed" });
      }
    });

    socket.on("disconnect", () => {
      activeUsers.forEach((value, key) => {
        if (value === socket.id) {
          activeUsers.delete(key);
        }
      });
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
