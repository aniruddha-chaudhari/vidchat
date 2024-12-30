import { Request, Response } from 'express';
import pool from '../db/db';

export async function getContacts(req: Request, res: Response) {
    try {
        const contacts = await pool.query('SELECT contact_id FROM contacts WHERE user_id = $1', [req.user.id]);
        if (contacts.rows.length === 0) {
            return res.status(404).json({ msg: 'No contacts found' });
        }

        const contactIds = contacts.rows.map(contact => contact.contact_id);
        const users = await pool.query('SELECT id, username, email FROM users WHERE id = ANY($1::int[])', [contactIds]);

        res.status(200).json(users.rows);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ msg: 'Internal server error' });
    }
}

export async function createContact(req: Request, res: Response) {
    try {
        const { email } = req.body;
        const contact = await pool.query('SELECT id, username FROM users WHERE email = $1', [email]);
        
        if (!contact.rows[0]) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if contact already exists
        const existingContact = await pool.query(
            'SELECT * FROM contacts WHERE user_id = $1 AND contact_id = $2',
            [req.user.id, contact.rows[0].id]
        );

        if (existingContact.rows.length > 0) {
            return res.status(400).json({ msg: 'Contact already exists' });
        }

        const newContact = await pool.query(
            'INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2) RETURNING *',
            [req.user.id, contact.rows[0].id]
        );

        res.status(201).json({
            id: newContact.rows[0].id,
            username: contact.rows[0].username,
            email: email
        });
        
    } catch (err) {
        console.error('Error creating contact:', err);
        res.status(500).json({ msg: 'Internal server error' });
    }
}