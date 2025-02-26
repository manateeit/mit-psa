import React, { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

interface HoursProgressBarProps {
  percentage: number;
  width?: number | string;
  height?: number;
  showTooltip?: boolean;
  tooltipContent?: React.ReactNode;
  label?: string;
}

// Custom tooltip component that accepts ReactNode content
const TooltipWrapper: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700">
          {content}
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      )}
    </div>
  );
};

export const HoursProgressBar: React.FC<HoursProgressBarProps> = ({
  percentage,
  width = 100,
  height = 10,
  showTooltip = false,
  tooltipContent,
  label
}) => {
  const progressBar = (
    <div className="flex flex-col">
      {label && (
        <div className="text-xs text-gray-600 mb-1">{label}</div>
      )}
      <div className="relative w-full bg-blue-100 rounded-full overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${Math.min(100, percentage)}%` }}
        ></div>
      </div>
    </div>
  );

  if (showTooltip && tooltipContent) {
    // Use our custom TooltipWrapper for ReactNode content
    return (
      <TooltipWrapper content={tooltipContent}>
        <div className="cursor-help">{progressBar}</div>
      </TooltipWrapper>
    );
  }

  return progressBar;
};

export default HoursProgressBar;
