import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import genrateToken from '../utils/genrateToken';
import pool from '../db/db';


export async function signup(req: Request, res: Response) {

    try {
        const { username, email, password } = req.body;

        console.log('Received signup request with data:', { username, email, password });

        if (!username || !email || !password) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({ msg: 'Please fill all the fields' });
        }

        if (password.length < 6) {
            console.log('Validation failed: Password too short');
            return res.status(400).json({ msg: 'Password must be atleast 6 characters long' });
        }

        const user = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);


        if (user.rows.length > 0) {
            console.log('User already exists');
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', [username, email, hashedPassword]);

        if (newUser) {
            genrateToken(newUser.rows[0].id, res);
            res.status(201).json({
                id: newUser.rows[0].id,
                username: newUser.rows[0].username,
                email: newUser.rows[0].email
            });

        }
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (!user.rows[0]) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);

        if (!isPasswordMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        genrateToken(user.rows[0].id, res);

        res.status(200).json({
            id: user.rows[0].id,
            username: user.rows[0].username,
            email: user.rows[0].email
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Internal server error' });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        res.cookie('jwt', '', { maxAge: 0 });
        res.status(200).json({ msg: 'Logged out successfully' });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Internal server error' });
    }
}

export const authCheck = async (req: Request, res: Response) => {
    try {
        const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.id]);
        if (!user.rows[0]) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json(
            {
                id: user.rows[0].id,
                username: user.rows[0].username,
                email: user.rows[0].email
            }
        );
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Internal server error' });
    }
};