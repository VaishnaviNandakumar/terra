import React, { useState } from 'react';
import { Upload, Edit3, BarChart3, Home, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationHeaderProps {
  sessionId: string | null;
  username: string;
}

export function NavigationHeader({ sessionId, username }: NavigationHeaderProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/upload', icon: Upload, label: 'Upload Data' },
    { path: '/edit', icon: Edit3, label: 'Edit Tags' },
    { path: '/dashboard', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <header className="bg-black border-b border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-500">terra</h1> &nbsp; &nbsp; &nbsp; &nbsp; 
            {username && (
              <span className="hidden md:inline ml-4 text-sm text-gray-400">
                Welcome, {username}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-green-400"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <nav className="hidden md:flex space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isDisabled = !sessionId && path !== '/';
              const LinkComponent = isDisabled ? 'div' : Link;
              
              return (
                <LinkComponent
                  key={path}
                  to={`${path}${sessionId ? `?sessionId=${sessionId}` : ''}`}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2
                    ${isActive(path) 
                      ? 'bg-green-500/10 text-green-500' 
                      : isDisabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-white hover:text-green-400 hover:bg-[#111111]'
                    }
                  `}
                  title={isDisabled ? 'Please start a session first' : label}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </LinkComponent>
              );
            })}
          </nav>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isDisabled = !sessionId && path !== '/';
              const LinkComponent = isDisabled ? 'div' : Link;
              
              return (
                <LinkComponent
                  key={path}
                  to={`${path}${sessionId ? `?sessionId=${sessionId}` : ''}`}
                  className={`
                    block px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2
                    ${isActive(path) 
                      ? 'bg-green-500/10 text-green-500' 
                      : isDisabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-white hover:text-green-400 hover:bg-[#111111]'
                    }
                  `}
                  title={isDisabled ? 'Please start a session first' : label}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </LinkComponent>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}