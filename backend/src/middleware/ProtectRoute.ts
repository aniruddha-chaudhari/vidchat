import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../db/db'

interface DecodedToken extends JwtPayload {
    userId: number;  // Changed from Id to userId to match token generation
}

declare global {
    namespace Express {
        interface Request {
            user: {
                id: number;
            };
        }
    }
}

const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies['jwt-vid'];
        
        if (!token) {
            // console.log('No token found in cookies');
            return res.status(401).json({ message: 'No authentication token found' });
        }

        // console.log('Token found:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

        if (!decoded) {
            // console.log('Token verification failed');
            return res.status(401).json({ message: 'Invalid token' });
        }

        // console.log('Decoded token:', decoded);
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

        if (!user.rows[0]) {
            console.log('User not found for id:', decoded.userId);
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = { id: user.rows[0].id };
        next();
    }
    catch (error: any) {
        console.error('Protection route error:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
}

export default protectRoute;

