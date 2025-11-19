import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Install = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    // Construct the addon URL
    // Assuming the server is hosted at the same domain or configured URL
    // For local dev: 
    // The Stremio Addon URL format: /addon/USER_ID/manifest.json
    const addonUrl = `${window.location.origin}/addon/${user?.id}/manifest.json`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(addonUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-2xl">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition w-fit">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="bg-gray-800 p-10 rounded-lg shadow-xl text-center">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6">
                        Install to Stremio
                    </h1>
                    <p className="text-gray-300 mb-8 text-lg">
                        Your custom catalogs are ready! Use the link below to install the addon in Stremio.
                    </p>

                    <div className="bg-gray-900 p-4 rounded-lg flex items-center justify-between mb-8 border border-gray-700">
                        <code className="text-green-400 truncate mr-4 font-mono">{addonUrl}</code>
                        <button
                            onClick={copyToClipboard}
                            className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition text-white min-w-[40px] flex justify-center"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                        </button>
                    </div>

                    <a
                        href={`stremio://${addonUrl.replace('http://', '').replace('https://', '')}`}
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg shadow-purple-900/50"
                    >
                        Install Now
                    </a>

                    <p className="mt-6 text-sm text-gray-500">
                        If the button doesn't work, copy the URL and paste it into the Stremio search bar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Install;
