import React, { useState, useMemo, useRef } from 'react';
import { CompletedSession } from '../types';
import ClockIcon from './icons/ClockIcon';
import SearchIcon from './icons/SearchIcon';
import EditIcon from './icons/EditIcon';
import ExportButton from './ExportButton';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

declare global {
    interface Window {
        jspdf: any;
    }
}

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
    timeIn: string;
    timeOut: string;
    notes?: string;
}

interface SessionLogProps {
    sessions: CompletedSession[];
    onUpdateSession: (updatedData: SessionUpdateData) => void;
    onDeleteSession: (sessionId: string) => void;
    onAddSession: (newSessionData: NewSessionData) => void;
}

const AddSessionModal: React.FC<{
    onClose: () => void;
    onSave: (newSessionData: NewSessionData) => void;
}> = ({ onClose, onSave }) => {
    const [studentName, setStudentName] = useState('');
    const [level, setLevel] = useState(100);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const [timeIn, setTimeIn] = useState(formatDateForInput(oneHourAgo));
    const [timeOut, setTimeOut] = useState(formatDateForInput(now));


    const handleSave = () => {
        setError('');
        if (!studentName.trim()) {
            setError("Student name cannot be empty.");
            return;
        }

        const timeInDate = new Date(timeIn);
        const timeOutDate = new Date(timeOut);

        if (timeInDate.getTime() >= timeOutDate.getTime()) {
            setError("Validation failed: Time In must be earlier than Time Out.");
            return;
        }

        onSave({
            studentName: studentName.trim(),
            level,
            timeIn,
            timeOut,
            notes: notes.trim(),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                    Add New Session
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="add-studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Name</label>
                        <input
                            id="add-studentName"
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="add-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                        <select
                            id="add-level"
                            value={level}
                            onChange={(e) => setLevel(Number(e.target.value))}
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value={100}>Level 100</option>
                            <option value={200}>Level 200</option>
                            <option value={300}>Level 300</option>
                            <option value={400}>Level 400</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="add-timeIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time In</label>
                             <input 
                                id="add-timeIn"
                                type="datetime-local"
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                             <label htmlFor="add-timeOut" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Out</label>
                             <input 
                                id="add-timeOut"
                                type="datetime-local"
                                value={timeOut}
                                onChange={(e) => setTimeOut(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="add-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea
                            id="add-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add a note..."
                            className="mt-1 w-full h-24 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                            aria-label="Note content"
                        ></textarea>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Save Session
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};


const EditSessionModal: React.FC<{
    session: CompletedSession;
    onClose: () => void;
    onSave: (updatedData: SessionUpdateData) => void;
}> = ({ session, onClose, onSave }) => {
    const [studentName, setStudentName] = useState(session.studentName);
    const [level, setLevel] = useState(session.level);
    const [notes, setNotes] = useState(session.notes || '');
    const [error, setError] = useState('');

    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [timeIn, setTimeIn] = useState(formatDateForInput(session.timeIn));
    const [timeOut, setTimeOut] = useState(formatDateForInput(session.timeOut));

    const handleSave = () => {
        setError('');
        if (!studentName.trim()) {
            setError("Student name cannot be empty.");
            return;
        }

        const timeInDate = new Date(timeIn);
        const timeOutDate = new Date(timeOut);

        if (timeInDate.getTime() >= timeOutDate.getTime()) {
            setError("Validation failed: Time In must be earlier than Time Out.");
            return;
        }

        onSave({
            id: session.id,
            studentName: studentName.trim(),
            level,
            timeIn,
            timeOut,
            notes: notes.trim(),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                    Edit Session for {session.studentName}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Name</label>
                        <input
                            id="studentName"
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                        <select
                            id="level"
                            value={level}
                            onChange={(e) => setLevel(Number(e.target.value))}
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value={100}>Level 100</option>
                            <option value={200}>Level 200</option>
                            <option value={300}>Level 300</option>
                            <option value={400}>Level 400</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="timeIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time In</label>
                             <input 
                                id="timeIn"
                                type="datetime-local"
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                             <label htmlFor="timeOut" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Out</label>
                             <input 
                                id="timeOut"
                                type="datetime-local"
                                value={timeOut}
                                onChange={(e) => setTimeOut(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add a note..."
                            className="mt-1 w-full h-24 p-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                            aria-label="Note content"
                        ></textarea>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};


const ConfirmationModal: React.FC<{
    session: CompletedSession;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ session, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-fade-in-scale">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Confirm Deletion</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Are you sure you want to delete the session for <span className="font-semibold">{session.studentName}</span> from <span className="font-semibold">{session.timeIn.toLocaleString()}</span>?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        Delete Session
                    </button>
                </div>
            </div>
        </div>
    );
};

const exportElementAsImage = async (element: HTMLElement, filename: string): Promise<void> => {
    try {
        const elementToRender = element.cloneNode(true) as HTMLElement;
        elementToRender.style.maxHeight = 'none';
        elementToRender.style.overflow = 'visible';

        document.body.appendChild(elementToRender);
        // FIX: Use offsetWidth and offsetHeight which exist on HTMLElement, instead of width and height.
        const { offsetWidth, scrollWidth, offsetHeight, scrollHeight } = elementToRender;
        const renderWidth = Math.max(offsetWidth, scrollWidth) + 2; // Add border pixel
        const renderHeight = Math.max(offsetHeight, scrollHeight) + 2;
        document.body.removeChild(elementToRender);

        if (renderWidth === 0 || renderHeight === 0) {
            alert("Cannot export an empty element.");
            return;
        }

        const isDark = document.documentElement.classList.contains('dark');
        const themeClass = isDark ? 'dark' : 'light';

        const styles = `
            .dark { --bg-color: #1f2937; --header-bg: #374151; --text-color: #e5e7eb; --border-color: #4b5563; --link-color: #818cf8; --secondary-text: #9ca3af; --row-bg-even: #273142; }
            .light { --bg-color: #ffffff; --header-bg: #f3f4f6; --text-color: #1f2937; --border-color: #e5e7eb; --link-color: #4f46e5; --secondary-text: #6b7280; --row-bg-even: #f9fafb; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; background-color: var(--bg-color); color: var(--text-color); font-size: 14px; border: 1px solid var(--border-color); }
            th, td { border: 1px solid var(--border-color); padding: 10px; text-align: left; vertical-align: top; }
            thead { background-color: var(--header-bg); font-weight: bold; }
            tbody tr:nth-child(even) { background-color: var(--row-bg-even); }
            p, div, span, th, td { color: var(--text-color); }
            .text-indigo-600, .dark .dark\\:text-indigo-400 { color: var(--link-color); }
            .font-semibold { font-weight: 600; } .text-sm { font-size: 0.875rem; } .text-xs { font-size: 0.75rem; }
            .text-gray-500, .dark .dark\\:text-gray-400 { color: var(--secondary-text); }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
            .italic { font-style: italic; }
            svg { display: inline-block; vertical-align: middle; width: 1rem; height: 1rem; }
        `;

        const htmlContent = `<div class="${themeClass}">${elementToRender.outerHTML}</div>`;
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${renderWidth}" height="${renderHeight}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${renderWidth}px; height: ${renderHeight}px;">
                        <style>${styles}</style>
                        ${htmlContent}
                    </div>
                </foreignObject>
            </svg>`;

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = renderWidth; canvas.height = renderHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = isDark ? '#1f2937' : '#ffffff';
                ctx.fillRect(0, 0, renderWidth, renderHeight);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = filename; link.href = pngUrl;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            console.error("Failed to load SVG with foreignObject.");
            alert("Sorry, the image could not be exported due to a browser limitation.");
            URL.revokeObjectURL(url);
        };
        img.src = url;
    } catch (e) {
        console.error("Error exporting element as image:", e);
        alert("An unexpected error occurred while exporting the image.");
    }
};

const SessionLog: React.FC<SessionLogProps> = ({ sessions, onUpdateSession, onDeleteSession, onAddSession }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sessionToEdit, setSessionToEdit] = useState<CompletedSession | null>(null);
    const [deletingSession, setDeletingSession] = useState<CompletedSession | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setLevelFilter('');
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            const nameMatch = session.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;

            const levelMatch = !levelFilter || session.level === Number(levelFilter);
            if (!levelMatch) return false;

            const sessionDate = session.timeIn;
            let dateMatch = true;
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0); // Compare from the beginning of the day
                if (sessionDate < start) {
                    dateMatch = false;
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Compare until the end of the day
                if (sessionDate > end) {
                    dateMatch = false;
                }
            }

            return dateMatch;
        });
    }, [sessions, searchQuery, startDate, endDate, levelFilter]);

    const totalDuration = useMemo(() => {
        const totalSeconds = filteredSessions.reduce((acc, session) => {
            return acc + (session.duration.hours * 3600) + (session.duration.minutes * 60) + session.duration.seconds;
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
    }, [filteredSessions]);

    const areFiltersActive = searchQuery !== '' || startDate !== '' || endDate !== '' || levelFilter !== '';

    const handleConfirmDelete = () => {
        if (deletingSession) {
            onDeleteSession(deletingSession.id);
            setDeletingSession(null);
        }
    };

    const handleExportCSV = () => {
        if (filteredSessions.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = ["Student Name", "Level", "Time In", "Time Out", "Duration (HH:MM:SS)", "Notes"];
        const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');
        const escapeCSV = (str: string | undefined) => {
            if (str === null || str === undefined) return '""';
            const s = String(str);
            if (s.search(/("|,|\n)/g) >= 0) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const csvRows = filteredSessions.map(session => {
            const studentName = escapeCSV(session.studentName);
            const level = session.level;
            const timeIn = `"${session.timeIn.toLocaleString()}"`;
            const timeOut = `"${session.timeOut.toLocaleString()}"`;
            const duration = `${formatTwoDigits(session.duration.hours)}:${formatTwoDigits(session.duration.minutes)}:${formatTwoDigits(session.duration.seconds)}`;
            const notes = escapeCSV(session.notes);
            return [studentName, level, timeIn, timeOut, duration, notes].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const today = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `library_session_log_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportImage = () => {
        if (tableContainerRef.current) {
            exportElementAsImage(tableContainerRef.current, 'library_session_log.png');
        } else {
            alert("Could not find table to export.");
        }
    };

    const handleExportPDF = () => {
        if (filteredSessions.length === 0) {
            alert("No data to export.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

        const head = [["Student Name", "Level", "Time In", "Time Out", "Duration (HH:MM:SS)", "Notes"]];
        const body = filteredSessions.map(session => [
            session.studentName,
            session.level,
            session.timeIn.toLocaleString(),
            session.timeOut.toLocaleString(),
            `${formatTwoDigits(session.duration.hours)}:${formatTwoDigits(session.duration.minutes)}:${formatTwoDigits(session.duration.seconds)}`,
            session.notes || 'N/A'
        ]);

        doc.text("Library Session Log", 14, 15);
        
        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            theme: 'grid',
            styles: {
                fontSize: 8,
            },
            headStyles: {
                fillColor: [79, 70, 229] // Indigo
            },
            columnStyles: {
                5: { cellWidth: 'auto' }, // Notes column
            }
        });

        const today = new Date().toISOString().slice(0, 10);
        doc.save(`library_session_log_${today}.pdf`);
    };
    
    const exportOptions = [
        { label: "Export as CSV", action: handleExportCSV },
        { label: "Export as Image (PNG)", action: handleExportImage },
        { label: "Export as PDF", action: handleExportPDF }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
             {isAddModalOpen && (
                <AddSessionModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={onAddSession}
                />
            )}
            {sessionToEdit && (
                <EditSessionModal
                    session={sessionToEdit}
                    onClose={() => setSessionToEdit(null)}
                    onSave={onUpdateSession}
                />
            )}
            {deletingSession && (
                <ConfirmationModal 
                    session={deletingSession}
                    onClose={() => setDeletingSession(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white whitespace-nowrap">Session Log</h2>
                     {filteredSessions.length > 0 && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                                Total: {totalDuration.hours > 0 && `${totalDuration.hours}h `}
                                {totalDuration.minutes}m {totalDuration.seconds}s
                            </span>
                        </div>
                     )}
                </div>
                <div className="w-full flex flex-col md:flex-row items-stretch gap-2">
                     <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Session</span>
                    </button>
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by student name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                    </div>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        aria-label="Filter by Level"
                    >
                        <option value="">All Levels</option>
                        <option value="100">Level 100</option>
                        <option value="200">Level 200</option>
                        <option value="300">Level 300</option>
                        <option value="400">Level 400</option>
                    </select>
                    <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
                        <label htmlFor="startDate" className="pl-3 pr-1 text-sm font-medium text-gray-500 dark:text-gray-400">From</label>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate || ''}
                            className="py-2 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none"
                            aria-label="Start Date"
                        />
                        <label htmlFor="endDate" className="pl-2 pr-1 text-sm font-medium text-gray-500 dark:text-gray-400">To</label>
                        <input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || ''}
                            className="py-2 pr-3 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none"
                            aria-label="End Date"
                        />
                    </div>
                     <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    >
                        Clear
                    </button>
                    <ExportButton options={exportOptions} />
                </div>
            </div>
            <div ref={tableContainerRef} className="overflow-x-auto max-h-[50vh] pr-2">
                 {sessions.length > 0 ? (
                    filteredSessions.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time In</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Out</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSessions.map((session) => {
                                    const isLongSession = session.duration.hours >= 2;
                                    return (
                                        <tr 
                                            key={session.id} 
                                            className={`transition-colors duration-200 ${isLongSession ? 'bg-amber-50 dark:bg-amber-900/20' : ''} hover:bg-gray-100 dark:hover:bg-gray-700/50`}
                                            title={isLongSession ? "This session exceeded 2 hours." : undefined}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{session.studentName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Level {session.level}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                <div>{session.timeIn.toLocaleDateString()}</div>
                                                <div>{session.timeIn.toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                <div>{session.timeOut.toLocaleDateString()}</div>
                                                <div>{session.timeOut.toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                                <div className={`flex items-center gap-2 ${isLongSession ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span>
                                                        {session.duration.hours > 0 && `${session.duration.hours}h `}
                                                        {session.duration.minutes}m {session.duration.seconds}s
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300 max-w-xs">
                                                <p className="truncate" title={session.notes}>
                                                    {session.notes || <span className="italic text-gray-400">No notes</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setSessionToEdit(session)}
                                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                        aria-label={`Edit session for ${session.studentName}`}
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingSession(session)}
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                        aria-label={`Delete session for ${session.studentName}`}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            {areFiltersActive ? "No sessions match your search criteria." : "No completed sessions yet."}
                        </p>
                    )
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No completed sessions yet.</p>
                )}
            </div>
        </div>
    );
};

export default SessionLog;