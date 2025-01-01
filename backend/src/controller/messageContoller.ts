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

    console.log('Received message request:', {
        senderId,
        chatId,
        content,
        timestamp: new Date().toISOString()
    });

    try {
        console.log('Beginning transaction');
        pool.query('BEGIN');
        
        console.log('Checking participant authorization');
        const participantCheck = await pool.query(
            'SELECT chat_id FROM chat_participants WHERE user_id = $1 AND chat_id = $2', 
            [senderId, chatId]
        );

        if (participantCheck.rows.length === 0) {
            console.log('Unauthorized participant attempt');
            return res.status(403).send('You are not a participant in this chat');
        }

        console.log('Inserting message into database');
        const messageResult = await pool.query(
            'INSERT INTO messages (chat_id,sender_id,content) values ($1,$2,$3) RETURNING *', 
            [chatId, senderId, content]
        );

        const message = messageResult.rows[0];
        console.log('Message saved successfully:', message);

        await pool.query('COMMIT');
        console.log('Transaction committed');
        
        // Cache in Redis
        console.log('Caching message in Redis');
        await client.hset(
            `chat:${chatId}:messages`,
            message.id.toString(),
            JSON.stringify(message)
        );
        
        return res.status(201).json(message);
    } catch (err) {
        console.error('Error in sendMessages:', err);
        await pool.query('ROLLBACK');
        res.status(500).json({ message: 'Failed to send message', error: err });
    } finally {
        pool.query('END');
    }
};

export const getMessages = async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.chatId);
    // const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
        await pool.query('BEGIN');
        const paticipantCheck = await pool.query('SELECT chat_id FROM chat_participants WHERE user_id = $1 AND chat_id = $2', [req.user.id, chatId]);

        if (paticipantCheck.rows.length === 0) {
            return res.status(403).send('You are not a participant in this chat');
        }

        const cachedMessages = await client.hgetall(`chat:${chatId}:messages`);
    if (Object.keys(cachedMessages).length > 0){
        return Object.values(cachedMessages)
        .map((message: string) => JSON.parse(message))
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(offset, offset + limit);
    } 

    const result = await pool.query(
        'SELECT id, chat_id, sender_id, content, created_at as timestamp FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [chatId, limit, offset]
      );
      
      const messages : Message[] = result.rows;

      for (const message of messages) {
        await client.hset(`chat:${chatId}:messages`, message.id.toString(), JSON.stringify(message));
      }

      await client.expire(`chat:${chatId}:messages`, 36000);
    
      return messages;
        

    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal server error');
    }
}