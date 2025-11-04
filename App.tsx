import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import StudentInput from './components/StudentInput';
import CurrentSessions from './components/CurrentSessions';
import SessionLog from './components/SessionLog';
import StudentSummary from './components/StudentSummary';
import { ActiveSession, CompletedSession } from './types';
import ChatbotToggleButton from './components/ChatbotToggleButton';
import Chatbot from './components/Chatbot';

interface SessionUpdateData {
    id: string;
    studentName: string;
    level: number;
    timeIn: string | Date;
    timeOut: string | Date;
    notes?: string;
}

interface NewSessionData {
    studentName: string;
    level: number;
    timeIn: string | Date;
    timeOut: string | Date;
    notes?: string;
}


const App: React.FC = () => {
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    const toggleChat = () => setIsChatOpen(prev => !prev);

    const handleTimeIn = (studentName: string, level: number) => {
        if (!studentName.trim()) {
            alert("Please enter a student name or ID.");
            return;
        }
        if (activeSessions.some(s => s.studentName.toLowerCase() === studentName.trim().toLowerCase())) {
            alert("This student is already signed in.");
            return;
        }

        const newSession: ActiveSession = {
            id: `${Date.now()}-${studentName}`,
            studentName: studentName.trim(),
            level,
            timeIn: new Date(),
        };
        setActiveSessions(prev => [...prev, newSession]);
    };

    const handleTimeOut = (sessionId: string) => {
        const sessionToEnd = activeSessions.find(s => s.id === sessionId);
        if (!sessionToEnd) return;

        const timeOut = new Date();
        const durationMs = timeOut.getTime() - sessionToEnd.timeIn.getTime();
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const completedSession: CompletedSession = {
            ...sessionToEnd,
            timeOut,
            duration: { hours, minutes, seconds },
        };

        setCompletedSessions(prev => [completedSession, ...prev]);
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    const handleUpdateSession = (updatedData: SessionUpdateData) => {
        setCompletedSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === updatedData.id) {
                    const timeIn = new Date(updatedData.timeIn);
                    const timeOut = new Date(updatedData.timeOut);

                    // Validation should prevent this, but as a safeguard:
                    if (timeIn.getTime() >= timeOut.getTime()) {
                        return session; 
                    }

                    const durationMs = timeOut.getTime() - timeIn.getTime();
                    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;

                    return {
                        ...session,
                        studentName: updatedData.studentName,
                        level: updatedData.level,
                        timeIn,
                        timeOut,
                        notes: updatedData.notes,
                        duration: { hours, minutes, seconds },
                    };
                }
                return session;
            })
        );
    };

    const handleAddSession = (newSessionData: NewSessionData) => {
        const timeIn = new Date(newSessionData.timeIn);
        const timeOut = new Date(newSessionData.timeOut);

        // This validation is also in the modal, but it's good practice to have it here too.
        if (timeIn.getTime() >= timeOut.getTime()) {
            alert("Error: Time In must be earlier than Time Out.");
            return;
        }

        const durationMs = timeOut.getTime() - timeIn.getTime();
        const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const newSession: CompletedSession = {
            id: `${Date.now()}-${newSessionData.studentName}`,
            studentName: newSessionData.studentName.trim(),
            level: newSessionData.level,
            timeIn,
            timeOut,
            notes: newSessionData.notes,
            duration: { hours, minutes, seconds },
        };

        setCompletedSessions(prev => [newSession, ...prev].sort((a, b) => b.timeIn.getTime() - a.timeIn.getTime()));
    };

    const handleDeleteSession = (sessionId: string) => {
        setCompletedSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
    };

    const uniqueStudentNames = useMemo(() => {
        const names = new Set(completedSessions.map(s => s.studentName));
        return Array.from(names);
    }, [completedSessions]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="space-y-8">
                    <StudentInput onTimeIn={handleTimeIn} studentNames={uniqueStudentNames} completedSessions={completedSessions} />
                    <CurrentSessions sessions={activeSessions} onTimeOut={handleTimeOut} />
                    <StudentSummary sessions={completedSessions} />
                    <SessionLog 
                        sessions={completedSessions} 
                        onUpdateSession={handleUpdateSession} 
                        onDeleteSession={handleDeleteSession}
                        onAddSession={handleAddSession}
                    />
                </div>
            </main>
            <ChatbotToggleButton onClick={toggleChat} isOpen={isChatOpen} />
            {isChatOpen && (
                <Chatbot 
                    onClose={toggleChat} 
                    activeSessions={activeSessions} 
                    completedSessions={completedSessions}
                />
            )}
        </div>
    );
};

export default App;