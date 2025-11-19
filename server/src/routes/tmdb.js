import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { query, type = 'multi' } = req.query;
        const response = await axios.get(`${TMDB_BASE_URL}/search/${type}`, {
            params: {
                api_key: TMDB_API_KEY,
                query,
                language: 'es-ES' // Default to Spanish as per user language
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching from TMDB' });
    }
});

router.get('/discover', authenticateToken, async (req, res) => {
    try {
        const { type = 'movie', with_genres, primary_release_year, sort_by } = req.query;
        const response = await axios.get(`${TMDB_BASE_URL}/discover/${type}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'es-ES',
                with_genres,
                primary_release_year,
                sort_by
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error discovering from TMDB' });
    }
});

export default router;
