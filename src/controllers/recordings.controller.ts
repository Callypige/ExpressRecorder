import { Request, Response } from 'express';
import pool from '../database';
import { Recording } from '../types';
import { cloudinary } from '../middleware/upload.middleware';

// Create a new recording (with direct Cloudinary upload)
export const createRecording = async (req: Request, res: Response) => {
  const { cloudinary_url, cloudinary_public_id, original_name, size, duration } = req.body;

  if (!cloudinary_url || !cloudinary_public_id) {
    return res.status(400).json({ error: 'URL Cloudinary manquante' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO recordings (user_id, filename, original_name, size, duration) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        req.session.userId,
        cloudinary_url, // Cloudinary URL
        original_name || 'recording.webm',
        parseInt(size) || 0,
        parseFloat(duration) || null
      ]
    );

    const recording = result.rows[0];
    res.json({
      id: recording.id,
      filename: recording.filename,
      original_name: recording.original_name,
      size: recording.size,
      duration: recording.duration
    });
  } catch (err) {
    console.error('Error saving recording:', err);
    res.status(500).json({ error: 'Échec de la sauvegarde de l\'enregistrement' });
  }
};

// Get all recordings of the user
export const getRecordings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recordings WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.userId]
    );

    res.json({ recordings: result.rows });
  } catch (err) {
    console.error('Error fetching recordings:', err);
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

// Delete a recording
export const deleteRecording = async (req: Request, res: Response) => {
  const recordingId = req.params.id;

  try {
    // Retrieve recording info
    const result = await pool.query(
      'SELECT * FROM recordings WHERE id = $1 AND user_id = $2',
      [recordingId, req.session.userId]
    );

    const recording = result.rows[0];

    if (!recording) {
      return res.status(404).json({ error: 'Enregistrement non trouvé' });
    }

    // Extract the public_id from the Cloudinary URL
    const urlParts = recording.filename.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/'); // express-recorder/recording-xxx
    const publicId = publicIdWithExt.split('.')[0]; // Remove the extension

    // Delete the file from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); // audio files use 'video' resource_type
    } catch (cloudinaryErr) {
      console.error('Error deleting file from Cloudinary:', cloudinaryErr);
      // Continue even if Cloudinary deletion fails
    }

    // Delete the recording from the database
    await pool.query(
      'DELETE FROM recordings WHERE id = $1 AND user_id = $2',
      [recordingId, req.session.userId]
    );

    res.json({ message: 'Enregistrement supprimé avec succès' });
  } catch (err) {
    console.error('Error deleting recording:', err);
    res.status(500).json({ error: 'Échec de la suppression de l\'enregistrement' });
  }
};
