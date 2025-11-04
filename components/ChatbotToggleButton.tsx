import React from 'react';
import ChatIcon from './icons/ChatIcon';
import XIcon from './icons/XIcon';

interface ChatbotToggleButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const ChatbotToggleButton: React.FC<ChatbotToggleButtonProps> = ({ onClick, isOpen }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-[100] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 flex items-center justify-center transition-transform duration-300 ease-in-out transform hover:scale-110"
            aria-label={isOpen ? 'Close Chatbot' : 'Open Chatbot'}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <span className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center ${isOpen ? 'opacity-0 transform -rotate-45 scale-50' : 'opacity-100 transform rotate-0 scale-100'}`}>
                    <ChatIcon className="w-full h-full" />
                </span>
                <span className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center ${isOpen ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform rotate-45 scale-50'}`}>
                    <XIcon className="w-full h-full" />
                </span>
            </div>
        </button>
    );
};

export default ChatbotToggleButton;
