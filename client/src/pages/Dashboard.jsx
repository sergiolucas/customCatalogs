import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, ExternalLink, Download, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [catalogs, setCatalogs] = useState([]);
    const { logout } = useAuth();
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const fetchCatalogs = async () => {
        try {
            const res = await axios.get('/api/catalogs');
            setCatalogs(res.data);
        } catch (error) {
            console.error('Error fetching catalogs', error);
        }
    };

    const deleteCatalog = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`/api/catalogs/${id}`);
            fetchCatalogs();
        } catch (error) {
            console.error('Error deleting catalog', error);
        }
    };

    const handleExport = async () => {
        try {
            const res = await axios.get('/api/backup/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `catalogs-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error', error);
            alert('Error exporting data');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                await axios.post('/api/backup/import', data);
                alert('Data imported successfully!');
                fetchCatalogs();
            } catch (error) {
                console.error('Import error', error);
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-purple-500">My Catalogs</h1>
                <div className="flex flex-wrap gap-4">
                    <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 transition">
                        <Download size={20} /> Backup
                    </button>
                    <button onClick={handleImportClick} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded flex items-center gap-2 transition">
                        <Upload size={20} /> Restore
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                    <Link to="/install" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition">
                        <ExternalLink size={20} /> Install to Stremio
                    </Link>
                    <button onClick={logout} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition">
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/catalog/new" className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:text-purple-500 hover:border-purple-500 transition cursor-pointer group">
                    <Plus size={48} className="mb-4 group-hover:scale-110 transition" />
                    <span className="text-xl font-semibold">Create New Catalog</span>
                </Link>

                {catalogs.map(catalog => (
                    <div key={catalog.id} className="bg-gray-800 rounded-lg p-6 shadow-lg relative group">
                        <h3 className="text-xl font-bold mb-2">{catalog.name}</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded uppercase text-gray-300">{catalog.type || 'movie'}</span>
                            <p className="text-gray-400">{catalog.items.length} items</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <Link to={`/catalog/${catalog.id}`} className="text-purple-400 hover:text-purple-300 font-semibold">
                                Edit Catalog
                            </Link>
                            <button onClick={() => deleteCatalog(catalog.id)} className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-gray-700 transition">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
