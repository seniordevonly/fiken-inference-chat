import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login({ email, password, rememberMe });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Login failed');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 block w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Remember me (7 days)</span>
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
