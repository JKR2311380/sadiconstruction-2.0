import { useState } from 'react';
import { supabase } from './supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (data.user) {
        setMessage('Login successful!');
        console.log('Logged in user:', data.user);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md">
        
        {/* Visual Brand Identity */}
        <div className="text-center mb-10">
          <div className="inline-block bg-slate-100 border border-slate-200 p-4 rounded-xl shadow-inner mb-4">
            <span className="text-4xl">🏗️</span> 
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-tight">
            Sadiconstruction
          </h1>
          <p className="mt-2 text-slate-500">Project Management Database</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF7F3F] focus:border-[#FF7F3F] outline-none transition"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-800">
                Password
              </label>
              <a href="#" className="text-sm font-medium text-[#FF7F3F] hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF7F3F] focus:border-[#FF7F3F] outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7F3F] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#e06b2f] transition-colors focus:ring-4 focus:outline-none flex justify-center items-center disabled:opacity-70 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Need an account?{' '}
          <a href="#" className="font-medium text-[#FF7F3F] hover:underline">
            Request access.
          </a>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;