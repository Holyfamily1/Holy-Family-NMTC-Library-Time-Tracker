import React, { useState, useEffect } from 'react';
import LoginIcon from './icons/LoginIcon';
import { CompletedSession } from '../types';

interface StudentInputProps {
    onTimeIn: (studentName: string, level: number) => void;
    studentNames: string[];
    completedSessions: CompletedSession[];
}

const StudentInput: React.FC<StudentInputProps> = ({ onTimeIn, studentNames, completedSessions }) => {
    const [studentName, setStudentName] = useState('');
    const [level, setLevel] = useState(100);

    useEffect(() => {
        if (studentName && studentNames.some(name => name.toLowerCase() === studentName.toLowerCase())) {
            // Find the most recent session for this student to get their level.
            // Since new completed sessions are prepended, the first one found is the latest.
            const lastSession = completedSessions.find(s => s.studentName.toLowerCase() === studentName.toLowerCase());
            if (lastSession) {
                setLevel(lastSession.level);
            }
        }
    }, [studentName, studentNames, completedSessions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onTimeIn(studentName, level);
        setStudentName('');
        setLevel(100); // Reset level to default after sign in
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-4">
                <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter Student Name or ID"
                    className="flex-grow w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    list="student-names"
                />
                <datalist id="student-names">
                    {studentNames.map(name => <option key={name} value={name} />)}
                </datalist>
                <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full sm:w-auto px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    aria-label="Select Level"
                >
                    <option value={100}>Level 100</option>
                    <option value={200}>Level 200</option>
                    <option value={300}>Level 300</option>
                    <option value={400}>Level 400</option>
                </select>
                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200 transform hover:scale-105"
                >
                    <LoginIcon className="w-5 h-5" />
                    <span>Time In</span>
                </button>
            </form>
        </div>
    );
};

export default StudentInput;