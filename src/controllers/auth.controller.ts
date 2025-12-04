import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../database';
import { User } from '../types';

/*
    Controller for user authentication: registration, login, logout, and fetching current user.
*/

// Helper function to validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Registration
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  // Validation
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Le nom d\'utilisateur est requis' });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email valide requise' });
  }
  
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hashedPassword],
      function(this: any, err: Error | null) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Ce nom d\'utilisateur ou email est déjà utilisé' });
          }
          return res.status(500).json({ error: 'Erreur lors de la création du compte' });
        }

        req.session.userId = this.lastID;
        req.session.username = username.trim();
        res.json({ 
          user: { 
            id: this.lastID, 
            username: username.trim(),
            email: email.toLowerCase().trim()
          } 
        });
      }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase().trim()],
    async (err: Error | null, user: User) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      try {
        // Compare password with hash
        const passwordMatch = await bcrypt.compare(password, user.password!);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ 
          user: { 
            id: user.id, 
            username: user.username,
            email: user.email
          } 
        });
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
      }
    }
  );
};

// Get current user
export const getCurrentUser = (req: Request, res: Response) => {
  res.json({ 
    user: { 
      id: req.session.userId, 
      username: req.session.username 
    } 
  });
};

// Logout
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err: Error) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
};
