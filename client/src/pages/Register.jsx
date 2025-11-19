import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { email, password });
            navigate('/login');
        } catch (err) {
            setError('Error creating account');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-purple-500">Register</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded font-bold transition">
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
