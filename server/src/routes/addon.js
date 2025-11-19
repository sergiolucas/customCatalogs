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
            select: { id: true, name: true }
        });

        const manifest = {
            id: `com.customcatalogs.${userId}`,
            version: '1.0.0',
            name: 'Custom Catalogs',
            description: 'Your personal custom catalogs',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: catalogs.map(cat => ({
                type: 'movie', // Stremio requires type, but we can mix. We'll define 'movie' and 'series' for each catalog if needed, or just 'movie' if mixed? 
                // Actually, Stremio catalogs are type-specific usually. 
                // Let's define two entries per catalog: one for movies, one for series, 
                // OR just use 'movie' and 'series' types and filter items accordingly.
                // For simplicity, let's assume the catalog supports both types but we list it twice or use 'other'?
                // Better approach: List each catalog twice, once for 'movie' and once for 'series'.
                id: `cat_${cat.id}`,
                name: cat.name,
                extra: [{ name: 'search', isRequired: false }]
            })).concat(catalogs.map(cat => ({
                type: 'series',
                id: `cat_${cat.id}`,
                name: cat.name,
                extra: [{ name: 'search', isRequired: false }]
            })))
        };

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
        // id is like "cat_UUID" or "cat_UUID.json" (express handles .json extension if not strict?)
        // Stremio requests: /catalog/movie/cat_123.json

        const catalogId = id.replace('cat_', '').replace('.json', '');

        const catalog = await prisma.catalog.findUnique({
            where: { id: catalogId },
            include: {
                items: {
                    include: { mediaItem: true },
                    orderBy: { createdAt: 'asc' } // Order by creation time
                }
            }
        });

        if (!catalog || catalog.userId !== userId) {
            return res.json({ metas: [] });
        }

        // Filter items by type (movie/series) and sort by CatalogItem.createdAt
        const items = catalog.items
            .filter(i => i.mediaItem.type === type)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort by link creation time
            .map(i => i.mediaItem);

        const metas = items.map(item => ({
            id: `tmdb:${item.tmdbId}`,
            type: item.type,
            name: item.title,
            poster: item.poster ? `https://image.tmdb.org/t/p/w500${item.poster}` : null,
        }));

        res.json({ metas });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching catalog' });
    }
});

export default router;
