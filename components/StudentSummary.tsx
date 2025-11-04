import React, { useMemo, useState, useRef } from 'react';
import { CompletedSession } from '../types';
import ClockIcon from './icons/ClockIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import SearchIcon from './icons/SearchIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import PieChart from './PieChart';
import TableIcon from './icons/TableIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import PhotographIcon from './icons/PhotographIcon';
import ExportButton from './ExportButton';


interface StudentSummaryProps {
    sessions: CompletedSession[];
}

interface StudentTotal {
    studentName: string;
    level: number;
    totalSeconds: number;
    sessionCount: number;
    averageSeconds: number;
}

const formatDuration = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60); // Use floor to avoid decimals in seconds display
    
    let durationString = '';
    if (hours > 0) durationString += `${hours}h `;
    if (hours > 0 || minutes > 0) durationString += `${minutes}m `;
    // Only show seconds if total time is less than a minute or for detail
    if (hours === 0 && minutes === 0) durationString += `${seconds}s`;

    return durationString.trim() || '0s';
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
            .font-semibold { font-weight: 600; } .text-sm { font-size: 0.875rem; }
            .bg-gray-200 { background-color: #e5e7eb; } .dark .dark\\:bg-gray-600 { background-color: #4b5563; }
            .bg-indigo-500 { background-color: #6366f1; }
            .h-1\\.5 { height: 6px; } .rounded-full { border-radius: 9999px; } .mt-1 { margin-top: 4px; }
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

const StudentSummary: React.FC<StudentSummaryProps> = ({ sessions }) => {
    const [sortConfig, setSortConfig] = useState<{ key: 'studentName' | 'level' | 'totalSeconds' | 'averageSeconds' | 'sessionCount'; direction: 'ascending' | 'descending' }>({ key: 'totalSeconds', direction: 'descending' });
    const [displayLimit, setDisplayLimit] = useState<number>(5);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'chart' | 'pie'>('table');
    const [pieChartMetric, setPieChartMetric] = useState<'level' | 'name'>('level');
    const chartRef = useRef<SVGSVGElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        student: StudentTotal;
    } | null>(null);

    const studentTotals = useMemo<StudentTotal[]>(() => {
        const totals: { [key: string]: { totalSeconds: number; level: number; sessionCount: number } } = {};
        sessions.forEach(session => {
            const key = `${session.studentName}|${session.level}`;
            const durationInSeconds = (session.duration.hours * 3600) + (session.duration.minutes * 60) + session.duration.seconds;
            if (totals[key]) {
                totals[key].totalSeconds += durationInSeconds;
                totals[key].sessionCount += 1;
            } else {
                totals[key] = {
                    totalSeconds: durationInSeconds,
                    level: session.level,
                    sessionCount: 1,
                };
            }
        });

        return Object.entries(totals).map(([key, data]) => {
            const [studentName] = key.split('|');
            const averageSeconds = data.sessionCount > 0 ? data.totalSeconds / data.sessionCount : 0;
            return {
                studentName,
                level: data.level,
                totalSeconds: data.totalSeconds,
                sessionCount: data.sessionCount,
                averageSeconds,
            };
        });
    }, [sessions]);
    
    const pieChartDataByLevel = useMemo(() => {
        const levelCounts = studentTotals.reduce((acc, student) => {
            acc[student.level] = (acc[student.level] || 0) + 1;
            return acc;
        }, {} as { [key: number]: number });

        const colors: { [key: number]: string } = {
            100: '#6366F1', // indigo-500 from tailwind
            200: '#14B8A6', // teal-500
            300: '#F43F5E', // rose-500
            400: '#F59E0B'  // amber-500
        };

        return Object.entries(levelCounts)
            .map(([level, count]) => ({
                label: `Level ${level}`,
                value: count,
                color: colors[Number(level)] || '#6B7280',
            }))
            .sort((a, b) => Number(a.label.split(' ')[1]) - Number(b.label.split(' ')[1]));
    }, [studentTotals]);
    
    const studentTotalsByName = useMemo(() => {
        const totals: { [key: string]: { studentName: string; totalSeconds: number; } } = {};
        sessions.forEach(session => {
            const key = session.studentName;
            const durationInSeconds = (session.duration.hours * 3600) + (session.duration.minutes * 60) + session.duration.seconds;
            if (totals[key]) {
                totals[key].totalSeconds += durationInSeconds;
            } else {
                totals[key] = {
                    studentName: session.studentName,
                    totalSeconds: durationInSeconds,
                };
            }
        });

        return Object.values(totals).sort((a, b) => b.totalSeconds - a.totalSeconds);
    }, [sessions]);

    const pieChartDataByName = useMemo(() => {
        const topN = 9;
        if (studentTotalsByName.length === 0) return [];
        
        const topStudents = studentTotalsByName.slice(0, topN);
        const otherStudents = studentTotalsByName.slice(topN);

        const chartData = topStudents.map(student => ({
            label: student.studentName,
            value: student.totalSeconds,
        }));

        if (otherStudents.length > 0) {
            const otherTotalSeconds = otherStudents.reduce((sum, s) => sum + s.totalSeconds, 0);
            chartData.push({
                label: 'Other Students',
                value: otherTotalSeconds,
            });
        }
        
        const colors = [
            '#6366F1', '#14B8A6', '#F43F5E', '#F59E0B', '#8B5CF6',
            '#3B82F6', '#EC4899', '#10B981', '#F97316', '#6B7280'
        ];

        return chartData.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
        }));
    }, [studentTotalsByName]);


    const totalSessionCount = useMemo(() => {
        return studentTotals.reduce((total, student) => total + student.sessionCount, 0);
    }, [studentTotals]);

    const maxTotalSeconds = useMemo(() => {
        if (studentTotals.length === 0) return 1; // Avoid division by zero
        return Math.max(...studentTotals.map(s => s.totalSeconds));
    }, [studentTotals]);

    const sortedAndFilteredTotals = useMemo(() => {
        let filteredItems = studentTotals.filter(student =>
            student.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        let sortableItems = [...filteredItems];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            // Secondary sort by name for consistency
            if (a.studentName < b.studentName) return -1;
            if (a.studentName > b.studentName) return 1;

            return 0;
        });
        return sortableItems;
    }, [studentTotals, sortConfig, searchQuery]);

    const requestSort = (key: 'studentName' | 'level' | 'totalSeconds' | 'averageSeconds' | 'sessionCount') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (key: 'studentName' | 'level' | 'totalSeconds' | 'averageSeconds' | 'sessionCount') => {
        if (sortConfig.key !== key) {
            return null;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="w-4 h-4 ml-1" />;
        }
        return <ArrowDownIcon className="w-4 h-4 ml-1" />;
    };

    const handleExportTableCSV = () => {
        if (sortedAndFilteredTotals.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = ["Student Name", "Level", "Session Count", "Average Session Time (HH:MM:SS)", "Total Time Spent (HH:MM:SS)"];
        const formatTwoDigits = (num: number) => num.toString().padStart(2, '0');

        const formatSecondsToHHMMSS = (totalSeconds: number): string => {
            if (totalSeconds < 0) totalSeconds = 0;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            return `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
        };

        const escapeCSV = (str: string | undefined) => {
            if (str === null || str === undefined) return '""';
            const s = String(str);
            if (s.search(/("|,|\n)/g) >= 0) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };

        const csvRows = sortedAndFilteredTotals.map(student => {
            return [escapeCSV(student.studentName), student.level, student.sessionCount, formatSecondsToHHMMSS(student.averageSeconds), formatSecondsToHHMMSS(student.totalSeconds)].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const today = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `student_leaderboard_${today}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleDownloadChartAs = (format: 'png' | 'jpeg' | 'svg') => {
        const svg = chartRef.current;
        if (!svg) {
            alert("Chart not available for download.");
            return;
        }

        const { width, height } = svg.getBoundingClientRect();
        if (width === 0 || height === 0) {
            alert("Cannot download an empty chart.");
            return;
        }
        
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? '#1f2937' : '#ffffff';
        const textColor = isDark ? '#e5e7eb' : '#374151';

        const svgClone = svg.cloneNode(true) as SVGSVGElement;
        svgClone.setAttribute('width', String(width));
        svgClone.setAttribute('height', String(height));
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', bgColor);
        svgClone.insertBefore(bgRect, svgClone.firstChild);

        svgClone.querySelectorAll('text').forEach(text => {
            if (!text.hasAttribute('fill') || text.getAttribute('fill') === 'currentColor') {
                text.setAttribute('fill', textColor);
            }
        });
        
        const svgString = new XMLSerializer().serializeToString(svgClone);
        const filename = viewMode === 'pie' ? `student_distribution_${pieChartMetric}` : 'student_leaderboard';

        if (format === 'svg') {
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const link = document.createElement('a');
            link.download = `${filename}.svg`; link.href = url;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return;
        }

        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // For higher resolution
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const mimeType = `image/${format}`;
                const imageUrl = canvas.toDataURL(mimeType);
                
                const link = document.createElement('a');
                link.download = `${filename}.${format}`;
                link.href = imageUrl;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const handleExportChartDataCSV = () => {
        const dataToExport = viewMode === 'pie' ? (pieChartMetric === 'level' ? pieChartDataByLevel : pieChartDataByName) : chartData;
        if(dataToExport.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ["Label", "Value (Formatted)", "Value (Raw Seconds/Count)"];
        const csvRows = dataToExport.map(item => {
            const formattedValue = viewMode === 'pie' && pieChartMetric === 'name' ? formatDuration(item.value) : item.value.toString();
            return [`"${item.label}"`, `"${formattedValue}"`, item.value].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const filename = viewMode === 'pie' ? `student_distribution_data_${pieChartMetric}` : 'student_leaderboard_data';
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleExportTableImage = () => {
        if(tableRef.current) {
            exportElementAsImage(tableRef.current, 'student_leaderboard.png');
        } else {
            alert("Could not find table to export.");
        }
    };

    const displayOptions = [
        { label: 'Top 5', value: 5 },
        { label: 'Top 10', value: 10 },
        { label: 'Top 20', value: 20 },
        { label: 'All', value: Infinity },
    ];
    
    const chartData = useMemo(() => sortedAndFilteredTotals.slice(0, displayLimit === Infinity ? undefined : displayLimit), [sortedAndFilteredTotals, displayLimit]);
    
    const yAxisConfig = useMemo(() => {
        if (chartData.length === 0) {
            return { max: 3600, labels: [] }; // Default to 1 hour
        }
        const maxVal = Math.max(...chartData.map(s => s.totalSeconds), 0);
        let yAxisMax = Math.ceil(maxVal / 3600) * 3600; // Round up to the nearest hour
        if (maxVal > 0 && yAxisMax === 0) yAxisMax = 3600; // if max is less than 1 hr, set scale to 1 hr
        if (maxVal < 900) yAxisMax = Math.ceil(maxVal/60) * 60; // if max is less than 15m, round to nearest minute
        if (yAxisMax === 0) yAxisMax = 60; // Absolute minimum
        
        const tickCount = 4;
        const labels = Array.from({ length: tickCount + 1 }, (_, i) => {
            const value = (yAxisMax / tickCount) * i;
            return { value, label: formatDuration(value) };
        }).reverse();

        return { max: yAxisMax, labels };
    }, [chartData]);

    const barColors = [
        '#6366f1', '#14b8a6', '#f43f5e', '#0ea5e9', '#f59e0b',
        '#84cc16', '#8b5cf6', '#06b6d4', '#d946ef'
    ];
    
    const getExportOptions = () => {
        if (viewMode === 'table') {
            return [
                { label: "Export as CSV", action: handleExportTableCSV },
                { label: "Export as Image (PNG)", action: handleExportTableImage }
            ];
        }
        // Chart or Pie view
        return [
            { label: "Download Chart (PNG)", action: () => handleDownloadChartAs('png') },
            { label: "Download Chart (JPEG)", action: () => handleDownloadChartAs('jpeg') },
            { label: "Download Chart (SVG)", action: () => handleDownloadChartAs('svg') },
            { label: "Export Data as CSV", action: handleExportChartDataCSV }
        ];
    };


    // Bar Chart Constants
    const BAR_CHART_VIEWBOX_HEIGHT = 400;
    const BAR_CHART_VIEWBOX_WIDTH = Math.max(800, chartData.length * 60); // Make wider for more bars
    const BAR_CHART_MARGIN = { top: 20, right: 20, bottom: 120, left: 60 };
    const barChartInnerWidth = BAR_CHART_VIEWBOX_WIDTH - BAR_CHART_MARGIN.left - BAR_CHART_MARGIN.right;
    const barChartInnerHeight = BAR_CHART_VIEWBOX_HEIGHT - BAR_CHART_MARGIN.top - BAR_CHART_MARGIN.bottom;


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white whitespace-nowrap">Student Leaderboard</h2>
                    {totalSessionCount > 0 && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <ClipboardListIcon className="w-4 h-4" />
                            <span>
                                {totalSessionCount} Total Sessions
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {viewMode !== 'pie' && (
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-auto pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                                aria-label="Search student leaderboard by name"
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`} aria-label="Table View" title="Table View">
                            <TableIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setViewMode('chart')} className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'chart' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`} aria-label="Bar Chart View" title="Bar Chart View">
                            <ChartBarIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setViewMode('pie')} className={`p-2 rounded-md transition-colors duration-200 ${viewMode === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`} aria-label="Pie Chart View" title="Pie Chart View">
                            <ChartPieIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    {viewMode !== 'pie' && (
                         <select
                            value={displayLimit === Infinity ? 'Infinity' : displayLimit}
                            onChange={(e) => {
                                const value = e.target.value;
                                setDisplayLimit(value === 'Infinity' ? Infinity : Number(value));
                            }}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                            aria-label="Select number of students to display"
                        >
                            {displayOptions.map(option => (
                                <option key={String(option.value)} value={String(option.value)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                    <ExportButton options={getExportOptions()} />
                </div>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
                {studentTotals.length > 0 ? (
                    sortedAndFilteredTotals.length > 0 || viewMode === 'pie' ? (
                        <>
                            {viewMode === 'table' && (
                                <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <button onClick={() => requestSort('studentName')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                                    Student
                                                    {getSortIcon('studentName')}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <button onClick={() => requestSort('level')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                                    Level
                                                    {getSortIcon('level')}
                                                </button>
                                            </th>
                                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <button onClick={() => requestSort('sessionCount')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                                    Session Count
                                                    {getSortIcon('sessionCount')}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <button onClick={() => requestSort('averageSeconds')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                                    Avg. Session Time
                                                    {getSortIcon('averageSeconds')}
                                                </button>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <button onClick={() => requestSort('totalSeconds')} className="flex items-center hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                                                    Total Time Spent
                                                    {getSortIcon('totalSeconds')}
                                                </button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {sortedAndFilteredTotals.slice(0, displayLimit === Infinity ? undefined : displayLimit).map((student) => (
                                            <tr key={`${student.studentName}-${student.level}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.studentName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.level}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-500 dark:text-gray-300">{student.sessionCount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDuration(student.averageSeconds)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    <div className="flex flex-col">
                                                        <span>{formatDuration(student.totalSeconds)}</span>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                                            <div
                                                                className="bg-indigo-500 h-1.5 rounded-full"
                                                                style={{ width: `${(student.totalSeconds / maxTotalSeconds) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            
                            {viewMode === 'chart' && (
                                <div className="flex justify-center w-full">
                                <svg ref={chartRef} viewBox={`0 0 ${BAR_CHART_VIEWBOX_WIDTH} ${BAR_CHART_VIEWBOX_HEIGHT}`} className="w-full max-w-4xl" style={{ fontFamily: 'sans-serif' }}>
                                    {/* Y-Axis */}
                                    {yAxisConfig.labels.map(({ value, label }) => {
                                        const y = BAR_CHART_MARGIN.top + barChartInnerHeight - (value / yAxisConfig.max) * barChartInnerHeight;
                                        return (
                                            <g key={value}>
                                                <text
                                                    x={BAR_CHART_MARGIN.left - 8}
                                                    y={y}
                                                    textAnchor="end"
                                                    alignmentBaseline="middle"
                                                    fontSize="12"
                                                    fill="currentColor"
                                                    className="text-gray-500 dark:text-gray-400 font-mono"
                                                >
                                                    {label}
                                                </text>
                                                <line
                                                    x1={BAR_CHART_MARGIN.left}
                                                    y1={y}
                                                    x2={BAR_CHART_MARGIN.left + barChartInnerWidth}
                                                    y2={y}
                                                    stroke="currentColor"
                                                    className="text-gray-300 dark:text-gray-600"
                                                    strokeDasharray="2,2"
                                                />
                                            </g>
                                        );
                                    })}
                                    
                                    {/* X-Axis base line */}
                                    <line
                                        x1={BAR_CHART_MARGIN.left}
                                        y1={BAR_CHART_MARGIN.top + barChartInnerHeight}
                                        x2={BAR_CHART_MARGIN.left + barChartInnerWidth}
                                        y2={BAR_CHART_MARGIN.top + barChartInnerHeight}
                                        stroke="currentColor"
                                        className="text-gray-300 dark:text-gray-600"
                                    />

                                    {/* Bars and X-Axis Labels */}
                                    {chartData.map((student, index) => {
                                        const barWidth = (barChartInnerWidth / chartData.length) * 0.8;
                                        const barX = BAR_CHART_MARGIN.left + (barChartInnerWidth / chartData.length) * (index + 0.1);
                                        const barHeight = (student.totalSeconds / yAxisConfig.max) * barChartInnerHeight;
                                        const barY = BAR_CHART_MARGIN.top + barChartInnerHeight - barHeight;

                                        return (
                                            <g key={student.studentName}>
                                                <rect
                                                    x={barX}
                                                    y={barY}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={barColors[index % barColors.length]}
                                                    className="transition-opacity duration-200 hover:opacity-80"
                                                    onMouseMove={(e) => {
                                                        const svg = chartRef.current;
                                                        if (svg) {
                                                            const pt = svg.createSVGPoint();
                                                            pt.x = e.clientX;
                                                            pt.y = e.clientY;
                                                            const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
                                                            setTooltip({
                                                                x: x + 10,
                                                                y: y,
                                                                student: student,
                                                            });
                                                        }
                                                    }}
                                                    onMouseLeave={() => {
                                                        setTooltip(null);
                                                    }}
                                                />
                                                <text
                                                    x={barX + barWidth / 2}
                                                    y={BAR_CHART_MARGIN.top + barChartInnerHeight + 15}
                                                    textAnchor="end"
                                                    fontSize="12"
                                                    fill="currentColor"
                                                    className="text-gray-600 dark:text-gray-300"
                                                    transform={`rotate(-45, ${barX + barWidth / 2}, ${BAR_CHART_MARGIN.top + barChartInnerHeight + 15})`}
                                                >
                                                    {student.studentName}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    
                                    {/* Custom Tooltip */}
                                    {tooltip && (
                                        <g transform={`translate(${tooltip.x}, ${tooltip.y})`} style={{ pointerEvents: 'none' }}>
                                            <rect
                                                x="0"
                                                y="-50"
                                                width="170"
                                                height="70"
                                                rx="5"
                                                fill={document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
                                                stroke={document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb'}
                                                strokeWidth="1"
                                            />
                                            <text x="10" y="-30" fontSize="14" fontWeight="bold" fill="currentColor" className="text-gray-900 dark:text-gray-100">
                                                {tooltip.student.studentName}
                                            </text>
                                            <text x="10" y="-10" fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-300">
                                                Time: {formatDuration(tooltip.student.totalSeconds)}
                                            </text>
                                            <text x="10" y="10" fontSize="12" fill="currentColor" className="text-gray-600 dark:text-gray-300">
                                                Sessions: {tooltip.student.sessionCount}
                                            </text>
                                        </g>
                                    )}
                                </svg>
                                </div>
                            )}
                             {viewMode === 'pie' && (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-600 p-1 rounded-lg">
                                            <button onClick={() => setPieChartMetric('level')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${pieChartMetric === 'level' ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'}`}>
                                                By Level
                                            </button>
                                            <button onClick={() => setPieChartMetric('name')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${pieChartMetric === 'name' ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'}`}>
                                                By Student
                                            </button>
                                        </div>
                                    </div>
                                    {pieChartMetric === 'level' ? (
                                        <PieChart 
                                            ref={chartRef}
                                            data={pieChartDataByLevel} 
                                            title="Student Distribution by Level"
                                            valueFormatter={(value) => `${value}`}
                                            totalLabel="Total Student Entries"
                                            totalValueFormatter={(total) => `${total}`}
                                            tooltipValueFormatter={(value) => `${value} ${value === 1 ? 'entry' : 'entries'}`}
                                        />
                                    ) : (
                                        <PieChart 
                                            ref={chartRef}
                                            data={pieChartDataByName}
                                            title="Time Distribution by Student"
                                            valueFormatter={(value) => formatDuration(value)}
                                            totalLabel="Total Time"
                                            totalValueFormatter={(total) => formatDuration(total)}
                                            tooltipValueFormatter={(value) => formatDuration(value)}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                           No students match your search.
                        </p>
                    )
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No completed sessions yet. A leaderboard will be generated once students start signing out.</p>
                )}
            </div>
        </div>
    );
};

export default StudentSummary;