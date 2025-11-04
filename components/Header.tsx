import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                            Holy Family NMTC Library
                        </h1>
                        <span className="hidden sm:block text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            Time Tracker
                        </span>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="w-6 h-6" />
                        ) : (
                            <SunIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;