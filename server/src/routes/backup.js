import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    if (!process.env.ADMIN_EMAIL) {
        return res.status(500).json({ error: 'Admin email not configured' });
    }

    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Export FULL database (Admin only)
router.get('/export', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Get ALL users with their catalogs and items
        const users = await prisma.user.findMany({
            include: {
                catalogs: {
                    include: {
                        items: {
                            include: {
                                mediaItem: true
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            }
        });

        // Transform to export format
        const exportData = {
            version: '2.0', // Version 2 for full backup
            exportDate: new Date().toISOString(),
            users: users.map(user => ({
                email: user.email,
                password: user.password, // Hashed password
                catalogs: user.catalogs.map(cat => ({
                    name: cat.name,
                    type: cat.type,
                    items: cat.items.map(item => ({
                        tmdbId: item.mediaItem.tmdbId,
                        type: item.mediaItem.type,
                        title: item.mediaItem.title,
                        poster: item.mediaItem.poster
                    }))
                }))
            }))
        };

        res.setHeader('Content-Disposition', `attachment; filename="full-backup-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Error exporting data' });
    }
});

// Import FULL database (Admin only)
router.post('/import', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { users } = req.body;

        if (!users || !Array.isArray(users)) {
            return res.status(400).json({ error: 'Invalid import data' });
        }

        // Import each user
        for (const userData of users) {
            // Create or update user
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: { password: userData.password }, // Update password if changed
                create: {
                    email: userData.email,
                    password: userData.password
                }
            });

            // Import catalogs for this user
            if (userData.catalogs) {
                for (const catalogData of userData.catalogs) {
                    // Create catalog
                    const catalog = await prisma.catalog.create({
                        data: {
                            name: catalogData.name,
                            type: catalogData.type,
                            userId: user.id
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
                        }
                    }
                }
            }
        }

        res.json({ message: 'Full backup imported successfully', userCount: users.length });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Error importing data' });
    }
});

export default router;
