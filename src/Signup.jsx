import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Mail, Lock, ShieldCheck, User, UserCheck, AlertCircle, Phone } from 'lucide-react';
import logo from './assets/new-logo.jpeg';

export default function Signup() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("citizen");
    const [department, setDepartment] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { signupWithEmail } = useAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        if (phone && phone.replace(/\D/g, '').length !== 10) {
            return setError("Please enter a valid 10-digit mobile number");
        }

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setLoading(true);
            const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;
            await signupWithEmail(email, password, role, username, department, formattedPhone);
            navigate(role === 'citizen' ? '/citizen/dashboard' : '/authority/dashboard');
        } catch (err) {
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-white p-2 flex items-center justify-center overflow-hidden shadow-md border border-slate-100">
                        <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Join the Smart Civic & Emergency Response System
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start animate-in fade-in zoom-in-95">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSignup} autoComplete="off">
                        {/* Role Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Register as</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('citizen')}
                                    className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'citizen' ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                >
                                    <User className="w-4 h-4 mr-2" /> Citizen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('authority')}
                                    className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'authority' ? 'border-primary-600 bg-primary-50 text-primary-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                >
                                    <UserCheck className="w-4 h-4 mr-2" /> Authority
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium transition-colors"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>

                        {role === 'authority' && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        required={role === 'authority'}
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium transition-colors"
                                    >
                                        <option value="">-- Select Department --</option>
                                        <option value="municipal">🧹 Municipal Corporation</option>
                                        <option value="water">💧 Water Supply & Sewage</option>
                                        <option value="electricity">⚡ Electricity Board</option>
                                        <option value="fire">🚒 Fire & Rescue Services</option>
                                        <option value="health">🏥 Health & Medical (Hospital)</option>
                                        <option value="pwd">🛣️ Public Works Department (PWD)</option>
                                        <option value="police">🚔 Police & Law Enforcement</option>
                                        <option value="environment">🌿 Environment & Sanitation</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                            <div className="relative flex rounded-lg shadow-sm border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors">
                                <div className="bg-slate-100 border-r border-slate-300 px-3 py-2.5 flex items-center text-slate-700 font-extrabold text-sm shrink-0 select-none">
                                    <Phone className="h-4 w-4 text-slate-500 mr-1.5" />
                                    <span>+91</span>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    autoComplete="off"
                                    className="w-full px-3 py-2.5 text-slate-900 bg-white placeholder-slate-400 font-medium text-sm outline-none"
                                    placeholder="Enter 10-digit mobile number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="off"
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium transition-colors"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-sm text-slate-600">
                                Already have an account? {' '}
                                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
