import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../database';
import { Recording } from '../types';
import { uploadsDir } from '../middleware/upload.middleware';

// Créer un nouvel enregistrement
export const createRecording = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier uploadé' });
  }

  const { duration } = req.body;

  db.run(
    `INSERT INTO recordings (user_id, filename, original_name, size, duration) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.session.userId,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      duration || null
    ],
    function(this: any, err: Error | null) {
      if (err) {
        return res.status(500).json({ error: 'Échec de la sauvegarde de l\'enregistrement' });
      }

      res.json({
        id: this.lastID,
        filename: req.file!.filename,
        original_name: req.file!.originalname,
        size: req.file!.size,
        duration: duration || null
      });
    }
  );
};

// Obtenir tous les enregistrements de l'utilisateur
export const getRecordings = (req: Request, res: Response) => {
  db.all(
    'SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err: Error | null, recordings: Recording[]) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      res.json({ recordings });
    }
  );
};

// Supprimer un enregistrement
export const deleteRecording = (req: Request, res: Response) => {
  const recordingId = req.params.id;

  // Récupérer les infos de l'enregistrement pour supprimer le fichier
  db.get(
    'SELECT * FROM recordings WHERE id = ? AND user_id = ?',
    [recordingId, req.session.userId],
    (err: Error | null, recording: Recording) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!recording) {
        return res.status(404).json({ error: 'Enregistrement non trouvé' });
      }

      // Supprimer le fichier
      const filePath = path.join(uploadsDir, recording.filename);
      fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erreur lors de la suppression du fichier:', err);
        }
      });

      // Supprimer l'enregistrement de la base de données
      db.run(
        'DELETE FROM recordings WHERE id = ? AND user_id = ?',
        [recordingId, req.session.userId],
        (err: Error | null) => {
          if (err) {
            return res.status(500).json({ error: 'Échec de la suppression de l\'enregistrement' });
          }

          res.json({ message: 'Enregistrement supprimé avec succès' });
        }
      );
    }
  );
};
