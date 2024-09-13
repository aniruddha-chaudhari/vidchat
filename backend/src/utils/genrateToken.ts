import jwt from 'jsonwebtoken';
import { Response } from 'express';



const genrateToken = (Id: number, res: Response) => {
    const token = jwt.sign({ Id }, process.env.JWT_SECRET!, {
        expiresIn: "15d",
    });
    res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite:'strict',
    secure: process.env.NODE_ENV !== 'development'
    }
    );

};

export default genrateToken;