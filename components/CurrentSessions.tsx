
import React, { useState, useEffect, useMemo } from 'react';
import { ActiveSession } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ClockIcon from './icons/ClockIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import SearchIcon from './icons/SearchIcon';

interface CurrentSessionsProps {
    sessions: ActiveSession[];
    onTimeOut: (sessionId: string) => void;
}

const LiveDurationDisplay: React.FC<{ timeIn: Date }> = ({ timeIn }) => {
    const [duration, setDuration] = useState('00:00:00');

    useEffect(() => {
        const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

        const calculateAndSetDuration = () => {
            const now = new Date();
            const durationMs = now.getTime() - timeIn.getTime();
            if (durationMs < 0) return;

            const totalSeconds = Math.floor(durationMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            setDuration(`${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`);
        };
        
        calculateAndSetDuration();
        const intervalId = setInterval(calculateAndSetDuration, 1000);

        return () => clearInterval(intervalId);
    }, [timeIn]);

    return (
        <div className="flex items-center gap-1 font-mono text-sm text-gray-600 dark:text-gray-300" aria-live="off">
            <ClockIcon className="w-4 h-4" />
            <span>{duration}</span>
        </div>
    );
};


const CurrentSessions: React.FC<CurrentSessionsProps> = ({ sessions, onTimeOut }) => {
    const [timingOutId, setTimingOutId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'studentName' | 'timeIn'; direction: 'ascending' | 'descending' }>({ key: 'timeIn', direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');

    const handleTimeOutClick = (sessionId: string) => {
        setTimingOutId(sessionId);
        // Add a small delay for UX so the user can see the loading state
        setTimeout(() => {
            onTimeOut(sessionId);
        }, 500);
    };

    const filteredAndSortedSessions = useMemo(() => {
        const filteredItems = sessions.filter(session =>
            session.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const sortableItems = [...filteredItems];
        sortableItems.sort((a, b) => {
            const order = sortConfig.direction === 'ascending' ? 1 : -1;
            
            if (sortConfig.key === 'studentName') {
                const nameComparison = a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
                if (nameComparison !== 0) {
                    return nameComparison * order;
                }
                // Secondary sort by timeIn (earliest first)
                return a.timeIn.getTime() - b.timeIn.getTime();
            }
            
            if (sortConfig.key === 'timeIn') {
                const timeComparison = a.timeIn.getTime() - b.timeIn.getTime();
                if (timeComparison !== 0) {
                    return timeComparison * order;
                }
                // Secondary sort by name (alphabetical)
                return a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
            }

            return 0;
        });

        return sortableItems;
    }, [sessions, sortConfig, searchQuery]);

    const requestSort = (key: 'studentName' | 'timeIn') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: 'studentName' | 'timeIn') => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? 
            <ArrowUpIcon className="w-4 h-4 ml-1" /> : 
            <ArrowDownIcon className="w-4 h-4 ml-1" />;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Currently in Library ({sessions.length})</h2>
            
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                    type="text"
                    placeholder="Search active sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    aria-label="Search current sessions by student name"
                />
            </div>

            <div className="overflow-x-auto">
                {sessions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No students are currently signed in.</p>
                ) : filteredAndSortedSessions.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                     <button onClick={() => requestSort('studentName')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                        Student
                                        {getSortIcon('studentName')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                     <button onClick={() => requestSort('timeIn')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                        Time In / Duration
                                        {getSortIcon('timeIn')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAndSortedSessions.map((session) => {
                                const isTimingOut = timingOutId === session.id;
                                return (
                                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{session.studentName}</div>
                                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                                                Level {session.level}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Signed In: {session.timeIn.toLocaleTimeString()}
                                            </p>
                                            <LiveDurationDisplay timeIn={session.timeIn} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleTimeOutClick(session.id)}
                                                disabled={isTimingOut}
                                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:bg-red-400 disabled:cursor-wait"
                                            >
                                                {isTimingOut ? (
                                                    <>
                                                        <SpinnerIcon className="w-5 h-5" />
                                                        <span>Timing Out...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LogoutIcon className="w-5 h-5"/>
                                                        <span>Time Out</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No students match your search.</p>
                )}
            </div>
        </div>
    );
};

export default CurrentSessions;
