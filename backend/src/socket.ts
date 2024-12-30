import express from 'express';
import { Server as socketioserver } from 'socket.io';
import { createServer } from 'http';

interface SocketMessage {
    chatId: number;
    senderId: number;
    content: string;
}

// Track online users
const onlineUsers = new Map(); // userId -> socketId

const app = express();
const server = createServer(app);
const io = new socketioserver(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // Set user as online
    socket.on('user_connected', (userId: number) => {
        onlineUsers.set(userId, socket.id);
        io.emit('user_status', { userId, status: 'online' });
    });

    // Join a chat room
    socket.on('join_chat', (chatId: number) => {
        socket.join(`chat:${chatId}`);
        console.log(`User joined chat room: chat:${chatId}`);
    });

    // Leave a chat room
    socket.on('leave_chat', (chatId: number) => {
        socket.leave(`chat:${chatId}`);
        console.log(`User left chat room: chat:${chatId}`);
    });

    // Real-time message relay
    socket.on('new_message', (message: SocketMessage) => {
        io.to(`chat:${message.chatId}`).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
        // Find and remove disconnected user
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                io.emit('user_status', { userId, status: 'offline' });
                break;
            }
        }
        console.log('user disconnected');
    });
});

export { io, server, app };