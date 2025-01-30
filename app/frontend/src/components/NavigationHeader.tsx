import React from 'react';
import { Upload, Edit3, BarChart3, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationHeaderProps {
  sessionId: string | null;
  username: string;
}

export function NavigationHeader({ sessionId, username }: NavigationHeaderProps) {
  const location = useLocation();

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">ExpenseNinja</h1>
            {username && (
              <span className="ml-4 text-sm text-gray-500">
                Welcome, {username}
              </span>
            )}
          </div>
          
          <nav className="flex space-x-1">
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
                      ? 'bg-blue-50 text-blue-700' 
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
      </div>
    </header>
  );
}