import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/new-logo.jpeg';
import { Mail, Lock, AlertCircle, ShieldCheck, User } from 'lucide-react';

export default function Login() {
  const [loginRole, setLoginRole] = useState('citizen'); // 'citizen' | 'authority'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where the user was trying to go before login (if any)
  const from = location.state?.from?.pathname;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const result = await loginUser(email, password, loginRole);
      
      const user = result?.user;
      const role = user?.role;
      
      // Strict Segregation Check
      if (role && role !== loginRole) {
         // Logout immediately to prevent mixed sessions
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         return setError(`This account does not have ${loginRole} access. Please use the correct login portal.`);
      }

      const destination = from || (role === 'authority' ? '/authority/dashboard' : '/citizen/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6 group">
           <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-white p-2 flex items-center justify-center overflow-hidden shadow-md border border-slate-100 italic">
               <img src={logo} alt="SevaSetu Logo" className="h-full w-full object-contain" />
            </div>
          </div>
        </Link>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
             {loginRole === 'authority' ? 'Authority Portal Login' : 'Citizen Portal Login'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
             Smart Civic & Emergency Response System
          </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Role Segregation Toggle */}
          <div className="flex p-1.5 bg-slate-100 rounded-xl mb-6 shadow-inner border border-slate-200/50">
            <button
              onClick={() => { setLoginRole('citizen'); setError(''); }}
              className={`flex-1 flex justify-center items-center py-3 text-sm font-bold rounded-lg transition-all ${loginRole === 'citizen' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User className="w-4 h-4 mr-2" /> Citizen
            </button>
            <button
              onClick={() => { setLoginRole('authority'); setError(''); }}
              className={`flex-1 flex justify-center items-center py-3 text-sm font-bold rounded-lg transition-all ${loginRole === 'authority' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Authority
            </button>
          </div>

          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
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
                {loading ? 'Processing...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-slate-600">
                Don't have an account? {' '}
                <Link
                  to="/signup"
                  className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
