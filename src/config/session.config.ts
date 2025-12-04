import crypto from 'crypto';
import session from 'express-session';

/*
    Express session configuration.
    Uses a secure secret in production, falling back to a random secret in development.
*/

// Validate session secret in production
const getSessionSecret = (): string => {
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.error('ERREUR: La variable SESSION_SECRET est requise en production');
    process.exit(1);
  }
  return process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
};

// Express session configuration
export const sessionConfig: session.SessionOptions = {
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
