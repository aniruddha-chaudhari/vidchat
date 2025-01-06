import { Request, Response } from "express";
import { io } from "../socket";
import pool from "../db/db";
import client from "../db/redisdb";

interface Message {
    id: number;
    chatId: number;
    senderId: number;
    content: string;
    timestamp: Date;
}

export const sendMessages = async (req: Request, res: Response) => {
    const senderId = req.user.id;
    const chatId = req.params.chatId;
    const { content } = req.body;

    try {
        await pool.query('BEGIN');
        
        const participantCheck = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 AND chat_id = $2', 
            [senderId, chatId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).send('You are not a participant in this chat');
        }

        const messageResult = await pool.query(
            'INSERT INTO messages (chat_id,sender_id,content) values ($1,$2,$3) RETURNING *', 
            [chatId, senderId, content]
        );

        const message = messageResult.rows[0];

        await pool.query('COMMIT');
        
        await client.hset(
            `chat:${chatId}:messages`,
            message.id.toString(),
            JSON.stringify(message)
        );
        
        return res.status(201).json(message);
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: 'Failed to send message', error: err });
    } finally {
        pool.query('END');
    }
};

export const getMessages = async (req: Request, res: Response) => {
    const chatId = req.params.chatId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
        console.log(`Fetching messages for chat ${chatId} with limit ${limit} and offset ${offset}`);

        const participantCheck = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 AND chat_id = $2',
            [req.user.id, chatId]
        );

        if (participantCheck.rows.length === 0) {
            console.log(`User ${req.user.id} is not a participant in chat ${chatId}`);
            return res.status(403).json({ message: 'You are not a participant in this chat' });
        }

        const cachedMessages = await client.hgetall(`chat:${chatId}:messages`);
        console.log(`Found ${Object.keys(cachedMessages).length} cached messages`);

        if (Object.keys(cachedMessages).length > 0) {
            const messages = Object.values(cachedMessages)
                .map((message: string) => JSON.parse(message))
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(offset, offset + limit);
            console.log(`Returning ${messages.length} cached messages`);
            return res.json(messages);
        }

        const result = await pool.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [chatId, limit, offset]
        );

        const messages = result.rows;
        console.log(`Retrieved ${messages.length} messages from database`);
        
        // Cache messages
        for (const message of messages) {
            await client.hset(
                `chat:${chatId}:messages`,
                message.id.toString(),
                JSON.stringify(message)
            );
        }
        await client.expire(`chat:${chatId}:messages`, 3600); // 1 hour expiry
        console.log(`Cached ${messages.length} messages with 1 hour expiry`);

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};