import { Server as socketioserver } from 'socket.io';
import { Server } from 'http';

interface SocketMessage {
    id?: number;
    chatId: number;
    senderId: number;
    content: string;
    createdAt?: Date;
    chat_id?: number;
    created_at?: string;
    is_read?: boolean;
}

const onlineUsers = new Map();

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
            const roomName = `chat:${chatId}`;
            socket.join(roomName);
            console.log(`User ${socket.id} joined room ${roomName}`);
            // Log all clients in this room
            const clients = io.sockets.adapter.rooms.get(roomName);
            console.log(`Clients in room ${roomName}:`, Array.from(clients || []));
        });

        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`User with socket ${socket.id} left chat room: chat:${chatId}`);
        });

        socket.on('send_message', (message: SocketMessage) => {
            console.log('Message received on server:', message);
            const chatId = message.chat_id || message.chatId;
            
            if (!chatId || !message.senderId) {
                console.error('Invalid message format:', message);
                return;
            }

            // Broadcast to room (including sender)
            io.to(`chat:${chatId}`).emit('receive_message', {
                ...message,
                chatId: chatId,
                senderId: message.senderId, // Ensure senderId is included
                created_at: message.created_at || new Date().toISOString(),
                is_read: false
            });
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