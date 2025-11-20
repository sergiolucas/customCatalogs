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
