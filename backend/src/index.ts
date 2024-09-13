import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db/db';

import authRoutes from './routes/authRoutes'

const app = express();
app.use(cookieparser());
app.use(express.json()); 
app.use(cors());
dotenv.config();



app.use("/api/auth",authRoutes);

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

const key= process.env.JWT_SECRET
console.log(key);

app.listen(5000, () => { 
    console.log('Server is running http://localhost:5000');
});