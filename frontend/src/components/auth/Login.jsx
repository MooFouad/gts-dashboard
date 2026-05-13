import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, AlertCircle, Loader } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-8 animate-slide-down">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img
              src="/logo.svg"
              alt="GTS Logo"
              className="h-10 w-auto brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">GTS Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Enterprise Management System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 animate-fade-in">
            <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-rose-700 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="input-label">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field !pl-10"
                placeholder="your-email@example.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field !pl-10"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Contact your administrator for access credentials</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
