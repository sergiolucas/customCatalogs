import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all catalogs for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const catalogs = await prisma.catalog.findMany({
            where: { userId: req.user.id },
            include: {
                items: {
                    include: {
                        mediaItem: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Transform response to match previous format for frontend compatibility
        const transformed = catalogs.map(cat => ({
            ...cat,
            items: cat.items.map(i => ({
                tmdbId: i.mediaItem.tmdbId,
                type: i.mediaItem.type,
                title: i.mediaItem.title,
                poster: i.mediaItem.poster
            }))
        }));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching catalogs' });
    }
});

// Create catalog
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, type } = req.body;
        const catalog = await prisma.catalog.create({
            data: {
                name,
                type: type || 'movie', // Default to movie if not specified
                userId: req.user.id
            }
        });
        res.json(catalog);
    } catch (error) {
        console.error('Error creating catalog:', error);
        res.status(500).json({ error: 'Error creating catalog', details: error.message });
    }
});

// Update catalog (add/remove items)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, items } = req.body; // items is array of { tmdbId, type, title, poster }

        // Verify ownership
        const existing = await prisma.catalog.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!existing) return res.status(404).json({ error: 'Catalog not found' });

        // Update name if provided
        if (name) {
            await prisma.catalog.update({
                where: { id },
                data: { name }
            });
        }

        if (items) {
            // 1. Upsert all MediaItems first
            for (const item of items) {
                await prisma.mediaItem.upsert({
                    where: {
                        tmdbId_type: {
                            tmdbId: String(item.tmdbId),
                            type: item.type
                        }
                    },
                    update: {
                        title: item.title,
                        poster: item.poster
                    },
                    create: {
                        tmdbId: String(item.tmdbId),
                        type: item.type,
                        title: item.title,
                        poster: item.poster
                    }
                });
            }

            // 2. Get all MediaItems IDs
            const mediaItems = await prisma.mediaItem.findMany({
                where: {
                    OR: items.map(item => ({
                        tmdbId: String(item.tmdbId),
                        type: item.type
                    }))
                }
            });

            // Map input items to fetched mediaItems to preserve order
            const now = Date.now();
            const orderedCatalogItems = items.map((item, index) => {
                const mediaItem = mediaItems.find(mi => mi.tmdbId === String(item.tmdbId) && mi.type === item.type);
                if (!mediaItem) return null;
                return {
                    catalogId: id,
                    mediaItemId: mediaItem.id,
                    createdAt: new Date(now + index) // Ensure distinct timestamps for ordering
                };
            }).filter(Boolean);

            // 3. Sync CatalogItems (Delete all and recreate links)
            // Transaction: delete all links for this catalog, create new links
            await prisma.$transaction([
                prisma.catalogItem.deleteMany({ where: { catalogId: id } }),
                prisma.catalogItem.createMany({
                    data: orderedCatalogItems
                })
            ]);
        }

        const updated = await prisma.catalog.findUnique({
            where: { id },
            include: {
                items: {
                    include: { mediaItem: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Transform response
        const transformed = {
            ...updated,
            items: updated.items.map(i => ({
                tmdbId: i.mediaItem.tmdbId,
                type: i.mediaItem.type,
                title: i.mediaItem.title,
                poster: i.mediaItem.poster
            }))
        };

        res.json(transformed);

    } catch (error) {
        console.error('Error updating catalog:', error);
        res.status(500).json({ error: 'Error updating catalog', details: error.message });
    }
});

// Delete catalog
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Verify ownership
        const existing = await prisma.catalog.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!existing) return res.status(404).json({ error: 'Catalog not found' });

        await prisma.catalog.delete({ where: { id } });
        res.json({ message: 'Catalog deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting catalog' });
    }
});

export default router;
