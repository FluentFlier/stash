
import jwt from 'jsonwebtoken';
import { env } from './backend/config/env.js';

// Using existing user ID from DB
const existingUserId = '79bd4bb1-e6f0-4acb-aa6b-d2c4b8b86ecf';
console.log('Using User ID:', existingUserId);

const token = jwt.sign(
    {
        aud: 'authenticated',
        role: 'authenticated',
        sub: existingUserId,
        email: 'jamieseoh7@gmail.com'
    },
    env.SUPABASE_JWT_SECRET,
    { expiresIn: '1h' }
);

console.log(token);
