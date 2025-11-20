import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Manifest
router.get('/:userId/manifest.json', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const catalogs = await prisma.catalog.findMany({
            where: { userId },
            select: { id: true, name: true, type: true }
        });

        console.log(`Manifest request for user ${userId}: Found ${catalogs.length} catalogs`, catalogs);

        const manifest = {
            id: `com.customcatalogs.${userId}`,
            version: '1.0.0',
            name: 'Custom Catalogs',
            description: 'Your personal custom catalogs',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: catalogs.map(cat => ({
                type: cat.type,
                id: cat.id,
                name: cat.name
            }))
        };

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(manifest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating manifest' });
    }
});

// Catalog Handler
router.get('/:userId/catalog/:type/:id.json', async (req, res) => {
    try {
        const { userId, type, id } = req.params;

        const catalog = await prisma.catalog.findUnique({
            where: { id: id },
            include: {
                items: {
                    include: { mediaItem: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!catalog || catalog.userId !== userId) {
            return res.json({ metas: [] });
        }

        // Filter items by type (movie/series)
        const items = catalog.items
            .filter(i => i.mediaItem.type === type)
            .map(i => i.mediaItem);

        const metas = items.map(item => {
            // Parse genres from JSON string
            let genres = [];
            try {
                genres = item.genres ? JSON.parse(item.genres) : [];
            } catch (e) {
                genres = [];
            }

            // Build links array
            const links = [];

            // Add IMDB link if available
            if (item.imdbId && item.imdbRating) {
                links.push({
                    name: item.imdbRating,
                    category: 'imdb',
                    url: `https://imdb.com/title/${item.imdbId}`
                });
            }

            // Add cast links
            if (item.actors) {
                const actorList = item.actors.split('#').filter(Boolean);
                actorList.forEach(actor => {
                    links.push({
                        name: actor,
                        category: 'Cast',
                        url: `stremio:///search?search=${encodeURIComponent(actor)}`
                    });
                });
            }

            // Add director links
            if (item.directors) {
                const directorList = item.directors.split('#').filter(Boolean);
                directorList.forEach(director => {
                    links.push({
                        name: director,
                        category: 'Directors',
                        url: `stremio:///search?search=${encodeURIComponent(director)}`
                    });
                });
            }

            // Build the meta object
            const meta = {
                id: `tmdb:${item.tmdbId}`,
                type: item.type,
                name: item.title,
                poster: item.poster ? `https://image.tmdb.org/t/p/w500${item.poster}` : null,
                genres,
                description: item.description,
                links,
                rating: item.rating,
            };

            // Add optional fields if available
            if (item.imdbRating) meta.imdbRating = item.imdbRating;
            if (item.runtime) meta.runtime = item.runtime;
            if (item.releaseDate) {
                meta.released_at = item.releaseDate;
                meta.released = new Date(item.releaseDate).toISOString();
            }
            if (item.background) meta.background = item.background;
            if (item.logo) meta.logo = item.logo;
            if (item.actors) meta.actors = item.actors;
            if (item.directors) meta.directors = item.directors;
            if (item.lastEpisodeDate) {
                meta.last_episode_released_at = item.lastEpisodeDate;
            }

            return meta;
        });

        res.json({ metas });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching catalog' });
    }
});

export default router;
