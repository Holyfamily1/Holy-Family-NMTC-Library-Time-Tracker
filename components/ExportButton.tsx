import React, { useState, useRef, useEffect } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ExportOption {
    label: string;
    action: () => void;
}

interface ExportButtonProps {
    options: ExportOption[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    if (options.length === 0) return null;

    const handleOptionClick = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={wrapperRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>Export</span>
                    <ChevronDownIcon className="w-5 h-5 -mr-1" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {options.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => handleOptionClick(option.action)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                role="menuitem"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
