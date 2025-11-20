import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Plus, X, Save, ArrowLeft, Trash2 } from 'lucide-react';

const EditCatalog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [type, setType] = useState('movie');
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCatalog();
        }
    }, [id]);

    const fetchCatalog = async () => {
        try {
            const res = await axios.get('/api/catalogs');
            const catalog = res.data.find(c => c.id === id);
            if (catalog) {
                setName(catalog.name);
                setType(catalog.type || 'movie');
                setItems(catalog.items || []);
            }
        } catch (error) {
            console.error('Error fetching catalog', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/tmdb/search?query=${searchQuery}`);
            setSearchResults(res.data.results || []);
        } catch (error) {
            console.error('Error searching TMDB', error);
        }
        setLoading(false);
    };

    const addItem = (item) => {
        if (!item || !item.id) return;
        const safeItems = Array.isArray(items) ? items : [];
        if (safeItems.find(i => i.tmdbId === String(item.id))) return;

        // Check if item type matches catalog type
        const itemType = item.media_type === 'tv' ? 'series' : item.media_type;
        if (itemType !== type) {
            alert(`This catalog only accepts ${type === 'movie' ? 'movies' : 'series'}`);
            return;
        }

        const newItem = {
            tmdbId: String(item.id),
            type: itemType,
            title: item.title || item.name || 'Unknown Title',
            poster: item.poster_path || null
        };
        setItems([...safeItems, newItem]);
    };

    const removeItem = (tmdbId) => {
        const safeItems = Array.isArray(items) ? items : [];
        setItems(safeItems.filter(i => i.tmdbId !== tmdbId));
    };

    const handleSave = async () => {
        if (!name) return alert('Please enter a catalog name');
        try {
            if (id) {
                await axios.put(`/api/catalogs/${id}`, { name, items });
            } else {
                // Create first, then update with items
                const res = await axios.post('/api/catalogs', { name, type });
                const newId = res.data.id;
                if (items && items.length > 0) {
                    await axios.put(`/api/catalogs/${newId}`, { items });
                }
            }
            navigate('/');
        } catch (error) {
            console.error('Error saving catalog', error);
            alert('Error saving catalog');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Catalog Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-3xl font-bold bg-transparent border-b border-gray-700 focus:border-purple-500 focus:outline-none text-white w-1/2 placeholder-gray-600"
                    />
                    <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded flex items-center gap-2 font-bold transition">
                        <Save size={20} /> Save Catalog
                    </button>
                </div>
                {!id && (
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="radio"
                                value="movie"
                                checked={type === 'movie'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-purple-600"
                            />
                            Movies
                        </label>
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="radio"
                                value="series"
                                checked={type === 'series'}
                                onChange={(e) => setType(e.target.value)}
                                className="text-purple-600"
                            />
                            Series
                        </label>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Section */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-fit">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Search size={20} /> Add Items
                    </h2>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Search movies/series..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition">
                            <Search size={20} />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {searchResults.map(item => (
                            <div key={item.id} className="flex gap-3 bg-gray-700 p-2 rounded hover:bg-gray-600 transition group">
                                <img
                                    src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'https://placehold.co/92x138?text=No+Image'}
                                    alt={item.title || item.name}
                                    className="w-12 h-18 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{item.title || item.name}</p>
                                    <p className="text-xs text-gray-400">{item.release_date || item.first_air_date || 'Unknown Year'}</p>
                                    <p className="text-xs text-gray-400 capitalize">{item.media_type}</p>
                                </div>
                                <button onClick={() => addItem(item)} className="text-green-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition">
                                    <Plus size={24} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Items List */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Catalog Items ({items.length})</h2>
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-700 rounded-lg">
                            No items yet. Search and add some!
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {items.map((item, idx) => (
                                <div key={`${item.tmdbId}-${idx}`} className="relative group">
                                    <img
                                        src={item.poster ? `https://image.tmdb.org/t/p/w300${item.poster}` : 'https://placehold.co/300x450?text=No+Image'}
                                        alt={item.title}
                                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                                        <button onClick={() => removeItem(item.tmdbId)} className="bg-red-600 hover:bg-red-700 p-2 rounded-full text-white">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <p className="mt-2 font-medium truncate">{item.title}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditCatalog;
