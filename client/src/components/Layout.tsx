import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="text-heroku-purple h-12 fixed top-0 left-0 right-0 z-10 shadow-sm">
        <div className="h-full flex items-center px-4">
          <h1 className="text-lg font-semibold">Heroku Managed Inference and Agents</h1>
        </div>
      </header>

      <main className="flex-1 pt-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
