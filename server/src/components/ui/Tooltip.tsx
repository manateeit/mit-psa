import React, { useState, useCallback, useRef } from 'react';
import { AutomationProps } from '../../types/ui-reflection/types';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps & AutomationProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      {isVisible && (
        <div 
          className="absolute z-[9999] w-64 px-4 py-3 text-base text-white bg-gray-800 rounded shadow-sm"
          style={{
            left: position.x + 'px',
            top: position.y + 10 + 'px',
            transform: 'translateX(-50%)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
