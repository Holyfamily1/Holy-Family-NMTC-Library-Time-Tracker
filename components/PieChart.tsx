
import React from 'react';

interface PieChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    title: string;
    valueFormatter: (value: number) => string;
    totalLabel: string;
    totalValueFormatter: (value: number) => string;
    tooltipValueFormatter: (value: number) => string;
}

const PieSlice: React.FC<{
    color: string;
    path: string;
    label: string;
    value: number;
    percentage: string;
    tooltipValueFormatter: (value: number) => string;
}> = ({ color, path, label, value, percentage, tooltipValueFormatter }) => {
    return (
        <g className="group cursor-pointer">
            <path d={path} fill={color} className="transition-transform duration-200 ease-in-out group-hover:scale-105" />
            <title>{`${label}: ${tooltipValueFormatter(value)} (${percentage})`}</title>
        </g>
    );
};


const PieChart = React.forwardRef<SVGSVGElement, PieChartProps>(({ data, title, valueFormatter, totalLabel, totalValueFormatter, tooltipValueFormatter }, ref) => {

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500 dark:text-gray-400 py-8">Not enough data to display pie chart.</p></div>;
    }

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        if (Math.abs(endAngle - startAngle) >= 360) {
            // to draw a full circle, we draw a basically-full circle and the browser closes it.
             return describeArc(x, y, radius, startAngle, endAngle - 0.01);
        }
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "L", x, y,
            "Z"
        ].join(" ");
        return d;
    };

    // --- Layout calculations ---
    const legendYStart = 40;
    const legendItemHeight = 20;
    const legendBottomPadding = 50; // Space for total label, line, etc.
    const pieMinHeight = 220; // Minimum height for the pie chart area itself
    
    const legendHeight = legendYStart + (data.length * legendItemHeight) + legendBottomPadding;
    
    // NEW VALUES for better spacing
    const viewboxHeight = Math.max(pieMinHeight, legendHeight);
    const viewboxWidth = 420; // Increased width for more spacing
    
    const pieCenterX = 100; // Center of the pie chart graphic
    const pieCenterY = viewboxHeight / 2; // Vertically centered
    const pieRadius = 80; // Radius of the pie chart

    const legendXStart = pieCenterX + pieRadius + 40; // Start legend 40px to the right of the pie
    const legendWidth = 180; // Allocate width for the legend text


    let startAngle = 0;
    const slices = data.map(item => {
        const angle = total > 0 ? (item.value / total) * 360 : 0;
        const endAngle = startAngle + angle;
        const path = describeArc(pieCenterX, pieCenterY, pieRadius, startAngle, endAngle);
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) + '%' : '0.0%';
        const sliceData = {
            color: item.color,
            path: path,
            label: item.label,
            value: item.value,
            percentage: percentage
        };
        startAngle = endAngle;
        return sliceData;
    });

    const totalFormatted = totalValueFormatter(total);
    
    return (
        <div className="flex justify-center w-full">
            <svg ref={ref} viewBox={`0 0 ${viewboxWidth} ${viewboxHeight}`} className="w-full max-w-xl" style={{ fontFamily: 'sans-serif' }}>
                 <text x={viewboxWidth / 2} y="20" textAnchor="middle" fontSize="18" fontWeight="bold" fill="currentColor" className="text-gray-800 dark:text-gray-200">
                    {title}
                </text>

                {/* Pie slices are now drawn in the main coordinate space */}
                {slices.map((slice, index) => (
                    <PieSlice key={index} {...slice} tooltipValueFormatter={tooltipValueFormatter} />
                ))}

                {/* Legend */}
                <g transform={`translate(${legendXStart}, 0)`}>
                    {data.map((item, index) => {
                        const MAX_LABEL_LENGTH = 18;
                        const truncatedLabel = item.label.length > MAX_LABEL_LENGTH
                            ? `${item.label.substring(0, MAX_LABEL_LENGTH - 2)}...`
                            : item.label;
                        
                        return (
                             <g key={index} transform={`translate(0, ${legendYStart + index * legendItemHeight})`}>
                                <rect width="12" height="12" fill={item.color} rx="2" />
                                <text x="20" y="10" fontSize="14" fill="currentColor" className="text-gray-800 dark:text-gray-100">
                                    <title>{item.label}</title> {/* Show full name on hover */}
                                    {truncatedLabel}
                                </text>
                                <text x={legendWidth} y="10" textAnchor="end" fontSize="14" fill="currentColor" className="text-gray-500 dark:text-gray-400 font-mono">
                                    {valueFormatter(item.value)} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%)
                                </text>
                            </g>
                        );
                    })}
                    <line 
                        x1="0" 
                        y1={legendYStart + data.length * legendItemHeight + 15} 
                        x2={legendWidth} 
                        y2={legendYStart + data.length * legendItemHeight + 15} 
                        stroke="currentColor" 
                        className="text-gray-200 dark:text-gray-700" 
                    />
                     <g transform={`translate(0, ${legendYStart + data.length * legendItemHeight + 25})`}>
                        <text y="10" fontSize="14" fontWeight="bold" fill="currentColor" className="text-gray-800 dark:text-gray-100">{totalLabel}</text>
                        <text x={legendWidth} y="10" textAnchor="end" fontSize="14" fontWeight="bold" fill="currentColor" className="text-gray-800 dark:text-gray-100 font-mono">{totalFormatted}</text>
                    </g>
                </g>
            </svg>
        </div>
    );
});

export default PieChart;
