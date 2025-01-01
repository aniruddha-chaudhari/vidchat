import { Server as socketioserver } from 'socket.io';
import { Server } from 'http';

interface SocketMessage {
    chatId: number;
    senderId: number;
    content: string;
}

const onlineUsers = new Map(); // userId -> socketId

let io: socketioserver;

export const initializeSocket = (server: Server) => {
    io = new socketioserver(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {

        socket.on('user_online', (userId: string | number) => {
            // Convert userId to number if it's a string
            const normalizedUserId = typeof userId === 'string' ? parseInt(userId) : userId;
            console.log(`User ${normalizedUserId} is online with socket ID: ${socket.id}`);
            onlineUsers.set(normalizedUserId, socket.id);
            console.log('Current online users:', Array.from(onlineUsers.entries()));
            io.emit('user_status', { userId: normalizedUserId, online: true });
        });

        socket.on('join_chat', (chatId) => {
            socket.join(`chat:${chatId}`);
            console.log(`User with socket ${socket.id} joined chat room: chat:${chatId}`);
        });

        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`User with socket ${socket.id} left chat room: chat:${chatId}`);
        });

        // Only relay messages in real-time
        socket.on('send_message', (message: SocketMessage) => {
            console.log('Message received:', message);
            io.to(`chat:${message.chatId}`).emit('receive_message', message);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    console.log(`User ${userId} went offline`);
                    onlineUsers.delete(userId);
                    io.emit('user_status', { userId, online: false });
                    break;
                }
            }
        });
    });

    return io;
};

export { io };