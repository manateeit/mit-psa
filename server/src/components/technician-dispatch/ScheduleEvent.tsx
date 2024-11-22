import React from 'react';
import { IScheduleEntry } from '@/interfaces/schedule.interfaces';
import { getEventColors } from './utils';

interface ScheduleEventProps {
  event: Omit<IScheduleEntry, 'tenant'>;
  position: { left: string; width: string };
  isDragging: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, direction: 'left' | 'right') => void;
}

const ScheduleEvent: React.FC<ScheduleEventProps> = ({
  event,
  position,
  isDragging,
  isHovered,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  onResizeStart,
}) => {
  const colors = getEventColors(event.work_item_type);

  return (
    <div
      className={`text-xs ${colors.bg} ${colors.text} p-1 shadow-md rounded cursor-move ${colors.hover} absolute 
        ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
      style={{
        left: position.left,
        width: position.width,
        top: '0px',
        height: '100%',
        zIndex: isDragging ? 1000 : 10,
        pointerEvents: isDragging ? 'none' : 'auto'
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="font-bold relative left-4">{event.title.split(':')[0]}</div>
      <div className="relative left-4">{event.title.split(':')[1]}</div>
      <button
        className={`absolute top-1 right-2 w-4 h-4 text-[rgb(var(--color-text-400))] 
          hover:text-[rgb(var(--color-text-600))] transition-colors delete-button z-20
          ${isHovered ? 'block' : 'hidden'}`}
        onClick={onDelete}
        title="Delete schedule entry"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 pointer-events-none"
        >
          <path d="M3 6h18"></path>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
      <div
        className="absolute top-0 bottom-0 left-0 w-2 bg-[rgb(var(--color-border-300))] cursor-ew-resize rounded-l resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(e, 'left');
        }}
      ></div>
      <div
        className="absolute top-0 bottom-0 right-0 w-2 bg-[rgb(var(--color-border-300))] cursor-ew-resize rounded-r resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart(e, 'right');
        }}
      ></div>
    </div>
  );
};

export default ScheduleEvent;
