import express from 'express';
import { Server as socketioserver } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new socketioserver(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

const emitMessage = (chatId: number, message: any) => {
    io.to(`chat:${chatId}`).emit('new_message', message);
};

io.on('connection', (socket) => {
    console.log('a user connected');

    // Join a chat room
    socket.on('join_chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`User joined chat room: chat:${chatId}`);
    });

    // Leave a chat room
    socket.on('leave_chat', (chatId) => {
        socket.leave(`chat:${chatId}`);
        console.log(`User left chat room: chat:${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', (chatId, message) => {
        emitMessage(chatId, message);
        console.log(`Message sent to chat room: chat:${chatId}`, message);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

export { io, server, app };