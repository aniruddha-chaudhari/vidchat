import { Request, Response } from "express";
import { io } from "../socket";
import pool from "../db/db";

export async function startIndividualChat(req: Request, res: Response) {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId;
    try {
        const existingChat = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 INTERSECT SELECT chat_id FROM chat_participants WHERE user_id = $2',
            [senderId, receiverId]
        );

        if (existingChat.rows.length > 0) {
            return res.json({ chatId: existingChat.rows[0].chat_id });
        }

        const newChat = await pool.query(
            'INSERT INTO chats (name, is_group_chat) VALUES ($1, $2) RETURNING id',
            ['', false]
        );
        const chatId = newChat.rows[0].id;

        await pool.query(
            'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
            [chatId, senderId, receiverId]
        );

        return res.json({ chatId });
    } catch (err) {
        console.error('Error starting individual chat:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export async function startGroupChat(req: Request, res: Response) {
    const senderId = req.user.id;
    const receiverIds = req.body.receiverIds;
    try {
        const existingChat = await pool.query('SELECT chat_id FROM chat_participants WHERE user_id = $1 INTERSECT SELECT chat_id FROM chat_participants WHERE user_id = ALL($2::int[])', [senderId, receiverIds]);

        if (existingChat.rows.length > 0) {
            return existingChat.rows[0].chat_id;
        }

        const newChat = await pool.query('INSERT INTO chats (name,is_group_chat) values ($1,$2) RETURNING chat_id', ['', true]);
        const chatId = newChat.rows[0].chat_id;

        await pool.query('INSERT INTO chat_participants (chat_id,user_id) values ($1,$2),($1,$3)', [chatId, senderId, receiverIds]);

        io.to(`chat:${chatId}`).emit('new_chat', { chatId, senderId, receiverIds });

        return chatId;
    } catch (err) {
        console.log('Error starting group chat:', err);
        throw new Error('Internal server error');
    }
};