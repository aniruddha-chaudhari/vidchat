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
            onlineUsers.set(normalizedUserId, socket.id);
            io.emit('user_status', { userId: normalizedUserId, online: true });
        });

        socket.on('join_chat', (chatId) => {
            const roomName = `chat:${chatId}`;
            socket.join(roomName);
        });

        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
        });

        socket.on('send_message', (message: SocketMessage) => {
            const chatId = message.chat_id || message.chatId;
            
            if (!chatId || !message.senderId || !message.content) {
                console.error('Invalid message format:', message);
                return;
            }

            const standardizedMessage = {
                ...message,
                chatId: chatId,
                created_at: new Date().toISOString(),
                is_read: false
            };

            // Emit to all users in the chat room
            io.to(`chat:${chatId}`).emit('receive_message', standardizedMessage);
        });

        socket.on('disconnect', () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
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