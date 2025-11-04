import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ActiveSession, CompletedSession } from '../types';
import XIcon from './icons/XIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserIcon from './icons/UserIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface ChatbotProps {
    onClose: () => void;
    activeSessions: ActiveSession[];
    completedSessions: CompletedSession[];
}

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

const Chatbot: React.FC<ChatbotProps> = ({ onClose, activeSessions, completedSessions }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: 'ai',
            text: "Hello! I'm the library AI assistant. How can I help you analyze the session data today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSendMessage = async (messageText: string) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: trimmedInput }]);
        setIsLoading(true);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = `You are a helpful and friendly AI assistant for the Holy Family NMTC Library Time Tracker application. Your role is to answer questions based on the provided library session data. The data is given in a JSON object.

- \`activeSessions\`: A list of students currently signed into the library. Each object includes \`studentName\`, \`level\`, and \`timeIn\`.
- \`completedSessions\`: A list of students who have already signed out. Each object includes \`studentName\`, \`level\`, \`timeIn\`, \`timeOut\`, and \`duration\` in hours, minutes, and seconds.

When answering, be concise and friendly. Format your answers clearly. If a question cannot be answered with the given data, say so politely. Do not make up information. Analyze the data to answer questions about student counts, session durations, who is currently present, who has visited, total times, average times, etc.

The current date and time is: ${new Date().toString()}. Use this for any time-related queries.`;

            const dataContext = JSON.stringify({ activeSessions, completedSessions });
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on the following data, please answer my question.\n\nDATA:\n${dataContext}\n\nQUESTION:\n${trimmedInput}`,
                config: {
                    systemInstruction
                }
            });

            const aiResponseText = response.text;
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = error instanceof Error && error.message.includes('API key') 
                ? "Could not connect to the AI service. Please ensure the API key is configured correctly."
                : "Sorry, I encountered an error. Please try again.";
            setMessages(prev => [...prev, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(input);
    };
    
    const suggestedQuestions = [
        "How many students are in the library right now?",
        "Who spent the most time in the library today?",
        "What is the average visit duration?",
        "List all Level 200 students who visited.",
    ];

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out transform-gpu animate-slide-in-up">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-6 h-6 text-indigo-500"/>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Library AI Assistant</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <XIcon className="w-5 h-5"/>
                </button>
            </header>
            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 flex-shrink-0 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-indigo-500" />
                            </div>
                        )}
                        <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none' : 'bg-indigo-600 text-white rounded-br-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 flex-shrink-0 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="max-w-xs md:max-w-sm px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none flex items-center justify-center">
                           <SpinnerIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
                 {messages.length <= 1 && (
                    <div className="pt-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Or try a suggestion:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestedQuestions.map(q => (
                                <button key={q} onClick={() => handleSendMessage(q)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                 )}
            </div>
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the data..."
                        className="flex-grow w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 flex-shrink-0 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
             <style>{`
                @keyframes slide-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in-up { animation: slide-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default Chatbot;
