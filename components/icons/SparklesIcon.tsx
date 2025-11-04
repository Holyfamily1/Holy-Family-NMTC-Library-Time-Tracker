import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m11-1V5m2 2h-4m2 11h-4m4 2v-4M12 3v2m-1 1H9m6 0h-2m1 16v-2m-1-1H9m6 0h-2"
    />
  </svg>
);

export default SparklesIcon;
