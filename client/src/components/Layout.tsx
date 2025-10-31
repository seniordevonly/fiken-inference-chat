import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/mia-logo.png';
import { useAuth } from '@/context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = async () => {
    await logout();
    if (location.pathname !== '/login') navigate('/login');
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='text-heroku-purple-30 h-12 fixed top-0 left-0 right-0 z-10 shadow-sm bg-white'>
        <div className='h-full flex items-center justify-between px-4'>
          <div className='flex items-center'>
            <img src={logo} alt='Heroku MIA' className='h-8 w-8 mr-2' />
            <h1 className='text-lg font-semibold'>Heroku Managed Inference and Agents</h1>
          </div>
          <div className='flex items-center gap-3'>
            {user ? (
              <>
                <span className='text-sm text-gray-700'>{user.email}</span>
                <button
                  onClick={onLogout}
                  className='text-sm text-indigo-600 hover:text-indigo-700'
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to='/login' className='text-sm text-indigo-600 hover:text-indigo-700'>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className='flex-1 pt-12'>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
