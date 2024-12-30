import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db/db';

import { app,server } from './socket';
import authRoutes from './routes/authRoutes'
import contactsRoute from './routes/ContactsRoute'
import chatRoute from './routes/ChatRoutes'

app.use(cookieparser());
app.use(express.json()); 
app.use(cors({
    origin: "http://localhost:3000", // Update this to match your frontend port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));
dotenv.config();



app.use("/api/auth",authRoutes);
app.use("/api/contacts",contactsRoute);
app.use("/api/chats",chatRoute);

pool.on('connect', () => {
    try {
        console.log('Connected to the database');
    } catch (error) {
        console.log(error);
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connection established');
    release();
});


server.listen(5000, () => { 
    console.log('Server is running http://localhost:5000');
});