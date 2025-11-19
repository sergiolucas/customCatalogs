import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Export all data as JSON
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's catalogs with all items
        const catalogs = await prisma.catalog.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        mediaItem: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Transform to export format
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            catalogs: catalogs.map(cat => ({
                name: cat.name,
                type: cat.type,
                items: cat.items.map(item => ({
                    tmdbId: item.mediaItem.tmdbId,
                    type: item.mediaItem.type,
                    title: item.mediaItem.title,
                    poster: item.mediaItem.poster
                }))
            }))
        };

        res.setHeader('Content-Disposition', `attachment; filename="catalogs-backup-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Error exporting data' });
    }
});

// Import data from JSON
router.post('/import', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { catalogs } = req.body;

        if (!catalogs || !Array.isArray(catalogs)) {
            return res.status(400).json({ error: 'Invalid import data' });
        }

        // Import each catalog
        for (const catalogData of catalogs) {
            // Create catalog
            const catalog = await prisma.catalog.create({
                data: {
                    name: catalogData.name,
                    type: catalogData.type,
                    userId: userId
                }
            });

            // Add items
            if (catalogData.items && catalogData.items.length > 0) {
                for (const item of catalogData.items) {
                    // Create or get media item
                    const mediaItem = await prisma.mediaItem.upsert({
                        where: {
                            tmdbId_type: {
                                tmdbId: item.tmdbId,
                                type: item.type
                            }
                        },
                        update: {},
                        create: {
                            tmdbId: item.tmdbId,
                            type: item.type,
                            title: item.title,
                            poster: item.poster
                        }
                    });

                    // Link to catalog
                    await prisma.catalogItem.create({
                        data: {
                            catalogId: catalog.id,
                            mediaItemId: mediaItem.id
                        }
                    });

                    // Small delay to maintain order
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        }

        res.json({ message: 'Data imported successfully', count: catalogs.length });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Error importing data' });
    }
});

export default router;
