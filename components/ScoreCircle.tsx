import React from 'react';

interface ScoreCircleProps {
  score: number;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  // Reduced size back to a more manageable size (100px)
  const size = 100; 
  const center = size / 2;
  const strokeWidth = 8; // Slightly thinner stroke
  const radius = (size - strokeWidth) / 2 - 4; // Adjusted padding
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'text-energy-500';
  if (score >= 80) color = 'text-growth-500';
  else if (score < 60) color = 'text-red-500';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
       {/* Background Circle */}
       <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        {/* Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center pt-1">
        <span className={`text-3xl font-extrabold ${color} leading-none`}>{score}</span>
        <span className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide transform scale-90">动作评分</span>
      </div>
    </div>
  );
};