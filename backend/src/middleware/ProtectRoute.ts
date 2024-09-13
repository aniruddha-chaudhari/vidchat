import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../db/db'

interface deocdedToken extends JwtPayload {
    Id: number;
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
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'You need to be logged in' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as deocdedToken;

        if (!decoded) {
            return res.status(401).json({ message: 'You need to be logged in' });
        }
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.Id]);

        if (!user.rows[0]) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user.rows[0];
        next();
    }
    catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

export default protectRoute;

