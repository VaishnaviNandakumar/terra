import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    // Use requestAnimationFrame for smooth animation
    const id = requestAnimationFrame(() => {
      setWidth(progress);
    });
    
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
      <div className="mt-2 text-right text-sm text-gray-700">{progress}%</div>
    </div>
  );
};