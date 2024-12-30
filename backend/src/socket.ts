import express from 'express';
import { Server as socketioserver } from 'socket.io';
import { createServer } from 'http';
import pool from './db/db';
import client from './db/redisdb';

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

const storeAndEmitMessage = async (message: SocketMessage) => {
    try {
        await pool.query('BEGIN');
        const messageResult = await pool.query(
            'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id, chat_id, sender_id, content, created_at as timestamp',
            [message.chatId, message.senderId, message.content]
        );

        const storedMessage = messageResult.rows[0];
        await pool.query('COMMIT');

        // Cache the message in Redis
        await client.hset(
            `chat:${message.chatId}:messages`, 
            storedMessage.id.toString(), 
            JSON.stringify(storedMessage)
        );
        await client.expire(`chat:${message.chatId}:messages`, 36000);

        // Emit the stored message to the chat room
        io.to(`chat:${message.chatId}`).emit('new_message', storedMessage);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error storing message:', error);
    }
};

io.on('connection', (socket) => {
    console.log('a user connected');

    // Set user as online
    socket.on('user_connected', async (userId: number) => {
        onlineUsers.set(userId, socket.id);
        // Notify user's contacts that they're online
        const contacts = await pool.query(
            'SELECT DISTINCT user_id FROM chat_participants WHERE chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = $1)',
            [userId]
        );
        contacts.rows.forEach(contact => {
            const contactSocketId = onlineUsers.get(contact.user_id);
            if (contactSocketId) {
                io.to(contactSocketId).emit('contact_online', userId);
            }
        });
    });

    // Handle contact click/selection
    socket.on('select_contact', async (data: { userId: number, contactId: number }) => {
        const { userId, contactId } = data;
        // Create or get existing chat
        const existingChat = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 INTERSECT SELECT chat_id FROM chat_participants WHERE user_id = $2',
            [userId, contactId]
        );

        let chatId;
        if (existingChat.rows.length > 0) {
            chatId = existingChat.rows[0].chat_id;
        } else {
            const newChat = await pool.query(
                'INSERT INTO chats (name, is_group_chat) VALUES ($1, $2) RETURNING id',
                ['', false]
            );
            chatId = newChat.rows[0].id;
            await pool.query(
                'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
                [chatId, userId, contactId]
            );
        }

        // Join both users to the chat room
        socket.join(`chat:${chatId}`);
        const contactSocketId = onlineUsers.get(contactId);
        if (contactSocketId) {
            io.to(contactSocketId).emit('join_chat', chatId);
        }

        socket.emit('chat_started', { chatId });
    });

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
    socket.on('send_message', async (message: SocketMessage) => {
        // Verify participant before storing/emitting message
        const participantCheck = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 AND chat_id = $2',
            [message.senderId, message.chatId]
        );

        if (participantCheck.rows.length > 0) {
            await storeAndEmitMessage(message);
            console.log(`Message sent to chat room: chat:${message.chatId}`, message);
        }
    });

    socket.on('disconnect', () => {
        // Find and remove disconnected user
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                // Notify contacts that user is offline
                io.emit('contact_offline', userId);
                break;
            }
        }
        console.log('user disconnected');
    });
});

export { io, server, app };