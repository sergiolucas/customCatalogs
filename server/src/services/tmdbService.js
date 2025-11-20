import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetch complete movie metadata from TMDB
 */
export async function getMovieDetails(tmdbId) {
    try {
        // Fetch movie details with append_to_response for credits, external_ids, and images
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'es-ES',
                append_to_response: 'credits,external_ids,images'
            }
        });

        const data = response.data;

        // Extract actors (top 10)
        const actors = data.credits?.cast?.slice(0, 10).map(c => c.name).join('#') || '';

        // Extract directors
        const directors = data.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join('#') || '';

        // Get logo from images (prefer Spanish, fallback to English)
        const logos = data.images?.logos || [];
        const logo = logos.find(l => l.iso_639_1 === 'es')?.file_path ||
            logos.find(l => l.iso_639_1 === 'en')?.file_path ||
            logos[0]?.file_path || null;

        // Format runtime
        const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min` : null;

        return {
            genres: JSON.stringify(data.genres?.map(g => g.name) || []),
            imdbRating: data.vote_average ? data.vote_average.toFixed(1) : null,
            description: data.overview || null,
            runtime,
            releaseDate: data.release_date || null,
            rating: data.vote_average || null,
            background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            logo: logo ? `https://image.tmdb.org/t/p/original${logo}` : null,
            actors,
            directors,
            imdbId: data.external_ids?.imdb_id || null,
            lastEpisodeDate: null // Not applicable for movies
        };
    } catch (error) {
        console.error(`Error fetching movie details for TMDB ID ${tmdbId}:`, error.message);
        return null;
    }
}

/**
 * Fetch complete series metadata from TMDB
 */
export async function getSeriesDetails(tmdbId) {
    try {
        // Fetch series details with append_to_response for credits, external_ids, and images
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'es-ES',
                append_to_response: 'credits,external_ids,images'
            }
        });

        const data = response.data;

        // Extract actors (top 10)
        const actors = data.credits?.cast?.slice(0, 10).map(c => c.name).join('#') || '';

        // Extract directors/creators
        const directors = data.created_by?.map(c => c.name).join('#') || '';

        // Get logo from images (prefer Spanish, fallback to English)
        const logos = data.images?.logos || [];
        const logo = logos.find(l => l.iso_639_1 === 'es')?.file_path ||
            logos.find(l => l.iso_639_1 === 'en')?.file_path ||
            logos[0]?.file_path || null;

        // Get last episode air date
        const lastEpisodeDate = data.last_episode_to_air?.air_date || data.last_air_date || null;

        // Format runtime (use first episode runtime if available)
        const runtime = data.episode_run_time?.[0] ? `${data.episode_run_time[0]}min` : null;

        return {
            genres: JSON.stringify(data.genres?.map(g => g.name) || []),
            imdbRating: data.vote_average ? data.vote_average.toFixed(1) : null,
            description: data.overview || null,
            runtime,
            releaseDate: data.first_air_date || null,
            rating: data.vote_average || null,
            background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            logo: logo ? `https://image.tmdb.org/t/p/original${logo}` : null,
            actors,
            directors,
            imdbId: data.external_ids?.imdb_id || null,
            lastEpisodeDate
        };
    } catch (error) {
        console.error(`Error fetching series details for TMDB ID ${tmdbId}:`, error.message);
        return null;
    }
}

/**
 * Fetch metadata based on type
 */
export async function getMediaDetails(tmdbId, type) {
    if (type === 'movie') {
        return getMovieDetails(tmdbId);
    } else if (type === 'series') {
        return getSeriesDetails(tmdbId);
    }
    return null;
}
