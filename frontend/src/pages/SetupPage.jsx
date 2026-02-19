import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { seedCustodian } from '../services/api';

/**
 * SetupPage – one-time custodian account creation.
 * Only works if no custodian exists in the system.
 */
export default function SetupPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = form;
        if (!name || !email || !password) { setError('All fields are required.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

        setLoading(true);
        try {
            await seedCustodian(name, email, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.error || 'Setup failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">ScriptSense Setup</h1>
                    <p className="text-purple-300 mt-1 text-sm">Create the initial Custodian account</p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                    <div className="bg-purple-900/30 border border-purple-700/30 rounded-lg px-4 py-3 mb-5 text-purple-300 text-xs">
                        This page is only accessible once. After creating the custodian account, this endpoint will be disabled.
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <p className="text-green-300 font-medium">Custodian account created!</p>
                            <p className="text-gray-400 text-sm">Redirecting to login...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-3 mb-4 text-red-300 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {[
                                    { name: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Custodian Name' },
                                    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'admin@university.edu' },
                                    { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: 'Min. 6 characters' },
                                    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: 'Repeat password' },
                                ].map(({ name, label, type, icon: Icon, placeholder }) => (
                                    <div key={name}>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                                        <div className="relative">
                                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type={type}
                                                name={name}
                                                value={form[name]}
                                                onChange={handleChange}
                                                placeholder={placeholder}
                                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Shield className="w-4 h-4" /> Create Custodian Account</>
                                    )}
                                </button>
                            </form>
                            <p className="text-center text-gray-400 text-sm mt-5">
                                Already set up? <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
