import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import tmdbRoutes from './routes/tmdb.js';
import catalogRoutes from './routes/catalogs.js';
import addonRoutes from './routes/addon.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... middleware ...

// Serve static files from the React app
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// API Routes
app.use('/addon', addonRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/catalogs', catalogRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
