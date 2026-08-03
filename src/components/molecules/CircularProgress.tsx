import React from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress = ({
  value,
  size = 96,
  strokeWidth = 8,
  className = '',
}: CircularProgressProps) => {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="text-blue-500 transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-xl font-black text-white">{clampedValue}%</span>
    </div>
  );
};
