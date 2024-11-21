'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IScheduleEntry } from '@/interfaces/schedule.interfaces';
import { IUser } from '@/interfaces/auth.interfaces';
import { calculateTimeFromPosition, isWorkingHour, getEventColors } from './utils';

// Discriminated union type for drop events
interface WorkItemDrop {
  type: 'workItem';
  workItemId: string;
  techId: string;
  startTime: Date;
}

interface EventDrop {
  type: 'scheduleEntry';
  eventId: string;
  techId: string;
  startTime: Date;
}

type DropEvent = WorkItemDrop | EventDrop;

// Create a new type for drag sources
interface DragSource {
  id: string;
  type: 'workItem' | 'scheduleEntry';
  data?: Omit<IScheduleEntry, 'tenant'>;
}

interface DragState {
  sourceId: string;
  sourceType: 'workItem' | 'scheduleEntry';
  originalStart: Date;
  originalEnd: Date;
  currentStart: Date;
  currentEnd: Date;
  currentTechId: string;
  clickOffset15MinIntervals: number;
}

interface TechnicianScheduleGridProps {
  technicians: Omit<IUser, 'tenant'>[];
  events: Omit<IScheduleEntry, 'tenant'>[];
  selectedDate: Date;
  onDrop: (dropEvent: DropEvent) => void;
  onResize: (eventId: string, techId: string, newStart: Date, newEnd: Date) => void;
  onDeleteEvent: (eventId: string) => void;
}

interface HighlightedSlots {
  techId: string;
  slots: Set<string>;
}

const TechnicianScheduleGrid: React.FC<TechnicianScheduleGridProps> = ({
  technicians,
  events,
  selectedDate,
  onDrop,
  onResize,
  onDeleteEvent
}) => {
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [totalWidth, setTotalWidth] = useState<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const isDraggingRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const latestResizeRef = useRef<{
    eventId: string;
    techId: string;
    newStart: Date;
    newEnd: Date;
  } | null>(null);

  const resizingRef = useRef<{
    eventId: string,
    techId: string,
    startX: number,
    initialStart: Date,
    initialEnd: Date,
    resizeDirection: 'left' | 'right'
  } | null>(null);

  const [localEvents, setLocalEvents] = useState<Omit<IScheduleEntry, 'tenant'>[]>(events);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isGridFocused, setIsGridFocused] = useState(false);
  const [highlightedSlots, setHighlightedSlots] = useState<HighlightedSlots | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  useEffect(() => {
    const handleResize = () => {
      if (scheduleGridRef.current) {
        setTotalWidth(scheduleGridRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scheduleGridRef.current && !scheduleGridRef.current.contains(e.target as Node)) {
        setIsGridFocused(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this schedule entry?')) {
      onDeleteEvent(eventId);
      // Clear any drag or resize state that might interfere
      isDraggingRef.current = false;
      dragStateRef.current = null;
      resizingRef.current = null;
      setIsDragging(false);
      setDragState(null);
      setHighlightedSlots(null);
    }
  }, [onDeleteEvent]);

  const handleResizeStart = useCallback((e: React.MouseEvent, event: Omit<IScheduleEntry, 'tenant'>, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();

    resizingRef.current = {
      eventId: event.entry_id,
      techId: event.user_id,
      startX: e.clientX,
      initialStart: new Date(event.scheduled_start),
      initialEnd: new Date(event.scheduled_end),
      resizeDirection: direction
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current || !scheduleGridRef.current) return;

    const { eventId, techId, startX, initialStart, initialEnd, resizeDirection } = resizingRef.current;
    const deltaX = e.clientX - startX;

    const gridWidth = scheduleGridRef.current.offsetWidth;
    const minutesPerPixel = (24 * 60) / gridWidth;
    const deltaMinutes = deltaX * minutesPerPixel;

    const roundedMinutes = Math.round(deltaMinutes / 15) * 15;

    let newStart = new Date(initialStart);
    let newEnd = new Date(initialEnd);

    if (resizeDirection === 'left') {
      newStart = new Date(initialStart.getTime() + roundedMinutes * 60000);

      if (newStart >= newEnd || (newEnd.getTime() - newStart.getTime()) < 900000) {
        return;
      }
    } else {
      newEnd = new Date(initialEnd.getTime() + roundedMinutes * 60000);

      if (newEnd <= newStart || (newEnd.getTime() - newStart.getTime()) < 900000) {
        return;
      }
    }

    setLocalEvents(prevEvents =>
      prevEvents.map((event): Omit<IScheduleEntry, 'tenant'> => {
        if (event.entry_id === eventId) {
          return {
            ...event,
            scheduled_start: resizeDirection === 'left' ? newStart : event.scheduled_start,
            scheduled_end: resizeDirection === 'right' ? newEnd : event.scheduled_end
          };
        }
        return event;
      })
    );

    latestResizeRef.current = { eventId, techId, newStart, newEnd };

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (latestResizeRef.current) {
        onResize(
          latestResizeRef.current.eventId,
          latestResizeRef.current.techId,
          latestResizeRef.current.newStart,
          latestResizeRef.current.newEnd
        );
      }
    }, 100);
  }, [totalWidth, onResize]);

  const handleResizeEnd = useCallback(() => {
    if (latestResizeRef.current) {
      onResize(
        latestResizeRef.current.eventId,
        latestResizeRef.current.techId,
        latestResizeRef.current.newStart,
        latestResizeRef.current.newEnd
      );
      latestResizeRef.current = null;
    }

    resizingRef.current = null;

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove, onResize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStateRef.current || !scheduleGridRef.current) return;

    // We're using mouseover events on time slots instead of mouse move
    // This function is kept for the event listener cleanup
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (dragStateRef.current) {
      let dropEvent: DropEvent;

      if (dragStateRef.current.sourceType === 'workItem') {
        dropEvent = {
          type: 'workItem',
          workItemId: dragStateRef.current.sourceId,
          techId: dragStateRef.current.currentTechId,
          startTime: dragStateRef.current.currentStart
        };
      } else {
        dropEvent = {
          type: 'scheduleEntry',
          eventId: dragStateRef.current.sourceId,
          techId: dragStateRef.current.currentTechId,
          startTime: dragStateRef.current.currentStart
        };
      }

      onDrop(dropEvent);
    }

    isDraggingRef.current = false;
    dragStateRef.current = null;
    setIsDragging(false);
    setDragState(null);
    setHighlightedSlots(null);

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [onDrop, handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent, event: Omit<IScheduleEntry, 'tenant'>) => {
    // Don't initiate drag if clicking delete button or resize handles
    if ((e.target as HTMLElement).closest('.delete-button') ||
      (e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickPositionX = e.clientX - rect.left;

    const eventDuration = new Date(event.scheduled_end).getTime() - new Date(event.scheduled_start).getTime();
    const totalSlots = eventDuration / (15 * 60 * 1000);
    const slotWidth = rect.width / totalSlots;

    const clickOffset15MinIntervals = Math.floor(clickPositionX / slotWidth);

    const newDragState: DragState = {
      sourceId: event.entry_id,
      sourceType: 'scheduleEntry',
      originalStart: new Date(event.scheduled_start),
      originalEnd: new Date(event.scheduled_end),
      currentStart: new Date(event.scheduled_start),
      currentEnd: new Date(event.scheduled_end),
      currentTechId: event.user_id,
      clickOffset15MinIntervals
    };

    isDraggingRef.current = true;
    dragStateRef.current = newDragState;

    setIsDragging(true);
    setDragState(newDragState);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const generate15MinuteSlots = useCallback((): string[] => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  const handleTimeSlotMouseOver = useCallback((e: React.MouseEvent, timeSlot: string, techId: string) => {
    if (!isDraggingRef.current || !dragStateRef.current) return;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);

    if (dragStateRef.current.sourceType === 'workItem') {
      // Calculate slots to highlight (1 hour duration for work items)
      const slotsToHighlight = new Set<string>();
      for (let i = 0; i < 4; i++) { // 4 15-minute slots = 1 hour
        const slotDate = new Date(slotTime.getTime() + (i * 15 * 60 * 1000));
        const slotHour = slotDate.getHours().toString().padStart(2, '0');
        const slotMinute = slotDate.getMinutes().toString().padStart(2, '0');
        slotsToHighlight.add(`${slotHour}:${slotMinute}`);
      }

      setHighlightedSlots({ techId, slots: slotsToHighlight });

      dragStateRef.current = {
        ...dragStateRef.current,
        currentStart: slotTime,
        currentEnd: new Date(slotTime.getTime() + 60 * 60 * 1000), // 1 hour duration for work items
        currentTechId: techId
      };
      setDragState(dragStateRef.current);
      return;
    }

    // For existing schedule entries
    const newStartTime = new Date(slotTime.getTime() -
      dragStateRef.current.clickOffset15MinIntervals * 15 * 60 * 1000);

    const duration = dragStateRef.current.originalEnd.getTime() -
      dragStateRef.current.originalStart.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    if (newStartTime.getHours() < 0 || newEndTime.getHours() >= 24) {
      return;
    }

    // Calculate slots to highlight for schedule entry
    const slotsToHighlight = new Set<string>();
    let currentTime = new Date(newStartTime);
    while (currentTime < newEndTime) {
      const slotHour = currentTime.getHours().toString().padStart(2, '0');
      const slotMinute = currentTime.getMinutes().toString().padStart(2, '0');
      slotsToHighlight.add(`${slotHour}:${slotMinute}`);
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
    }

    setHighlightedSlots({ techId, slots: slotsToHighlight });

    dragStateRef.current = {
      ...dragStateRef.current,
      currentStart: newStartTime,
      currentEnd: newEndTime,
      currentTechId: techId
    };

    setDragState(dragStateRef.current);

    setLocalEvents(prevEvents =>
      prevEvents.map((event): Omit<IScheduleEntry, 'tenant'> => {
        if (event.entry_id === dragStateRef.current?.sourceId) {
          return {
            ...event,
            scheduled_start: newStartTime,
            scheduled_end: newEndTime,
            user_id: techId
          };
        }
        return event;
      })
    );
  }, [selectedDate]);

  const getEventPosition = useCallback((event: Omit<IScheduleEntry, 'tenant'>) => {
    const startTime = new Date(event.scheduled_start);
    const endTime = new Date(event.scheduled_end);

    const startMinutesTotal = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutesTotal = endTime.getHours() * 60 + endTime.getMinutes();

    const startPercent = (startMinutesTotal / (24 * 60)) * 100;
    const durationMinutes = endMinutesTotal - startMinutesTotal;
    const widthPercent = (durationMinutes / (24 * 60)) * 100;

    return { left: `${startPercent}%`, width: `${widthPercent}%` };
  }, []);

  const timeSlots = useMemo(() => generate15MinuteSlots(), [generate15MinuteSlots]);

  const handleExternalDragStart = useCallback((e: React.DragEvent) => {
    const workItemId = e.dataTransfer.getData('workItemId');
    if (workItemId) {
      const newDragState: DragState = {
        sourceId: workItemId,
        sourceType: 'workItem',
        originalStart: new Date(),
        originalEnd: new Date(),
        currentStart: new Date(),
        currentEnd: new Date(),
        currentTechId: '',
        clickOffset15MinIntervals: 0
      };

      isDraggingRef.current = true;
      dragStateRef.current = newDragState;
      setIsDragging(true);
      setDragState(newDragState);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Initialize drag state if not already set
    if (!isDraggingRef.current) {
      // We can't get the workItemId during dragover due to browser security restrictions
      // Instead, we'll set a flag to indicate we're dragging a work item
      isDraggingRef.current = true;
      dragStateRef.current = {
        sourceId: '', // We'll get this during drop
        sourceType: 'workItem',
        originalStart: new Date(),
        originalEnd: new Date(),
        currentStart: new Date(),
        currentEnd: new Date(),
        currentTechId: '',
        clickOffset15MinIntervals: 0
      };
      setIsDragging(true);
      setDragState(dragStateRef.current);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, timeSlot: string, techId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const workItemId = e.dataTransfer.getData('workItemId');
    if (workItemId) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      onDrop({
        type: 'workItem',
        workItemId,
        techId,
        startTime
      });

      // Clear highlights after drop
      setHighlightedSlots(null);
      isDraggingRef.current = false;
      dragStateRef.current = null;
      setIsDragging(false);
      setDragState(null);
    }
  }, [selectedDate, onDrop]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const workItemId = e.dataTransfer.getData('workItemId');
    if (!isDraggingRef.current && workItemId) {
      isDraggingRef.current = true;
      dragStateRef.current = {
        sourceId: workItemId,
        sourceType: 'workItem',
        originalStart: new Date(),
        originalEnd: new Date(),
        currentStart: new Date(),
        currentEnd: new Date(),
        currentTechId: '',
        clickOffset15MinIntervals: 0
      };
      setIsDragging(true);
      setDragState(dragStateRef.current);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !scheduleGridRef.current?.contains(relatedTarget)) {
      setHighlightedSlots(null);
    }
  }, []);

  const handleTimeSlotDragOver = useCallback((e: React.DragEvent, timeSlot: string, techId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDraggingRef.current && e.dataTransfer.types.includes('workItemId')) {
      isDraggingRef.current = true;
      dragStateRef.current = {
        sourceId: '', // Will be set on drop
        sourceType: 'workItem',
        originalStart: new Date(),
        originalEnd: new Date(),
        currentStart: new Date(),
        currentEnd: new Date(),
        currentTechId: techId,
        clickOffset15MinIntervals: 0
      };
      setIsDragging(true);
      setDragState(dragStateRef.current);
    }

    // Calculate slots to highlight
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);

    const slotsToHighlight = new Set<string>();
    for (let i = 0; i < 4; i++) { // 4 15-minute slots = 1 hour
      const slotDate = new Date(slotTime.getTime() + (i * 15 * 60 * 1000));
      const slotHour = slotDate.getHours().toString().padStart(2, '0');
      const slotMinute = slotDate.getMinutes().toString().padStart(2, '0');
      slotsToHighlight.add(`${slotHour}:${slotMinute}`);
    }

    setHighlightedSlots({ techId, slots: slotsToHighlight });
  }, [selectedDate]);

  return (
    <div
      className="grid grid-cols-[auto,1fr] gap-4"
      onClick={() => setIsGridFocused(true)} 
      tabIndex={0}
      ref={scheduleGridRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Previous JSX remains unchanged until the time slots section */}
      <div className="space-y-4">
        <div className="h-8"></div>
        {technicians.map((tech): JSX.Element => (
          <div key={tech.user_id} className="h-16 flex items-center text-[rgb(var(--color-text-700))]">
            {tech.first_name} {tech.last_name}
          </div>
        ))}
      </div>
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-24 gap-0 mb-4">
          {timeSlots.filter((_, index) => index % 4 === 0).map((slot: string): JSX.Element => {
            const hour = parseInt(slot);
            const isWorking = isWorkingHour(hour);
            return (
              <div
                key={slot}
                className={`text-center text-xs font-semibold ${isWorking ? 'time-header-working' : 'time-header-non-working'}`}
              >
                {slot}
              </div>
            );
          })}
        </div>
        {technicians.map((tech): JSX.Element => (
          <div
            key={tech.user_id}
            className="technician-row mb-4 relative h-16 border border-[rgb(var(--color-border-200))]"
            data-tech-id={tech.user_id}
            onMouseDown={(e) => {
              if (!isGridFocused) {
                setIsGridFocused(true);
              }
            }}
          >
            <div className="grid grid-cols-96 h-full">
              {generate15MinuteSlots().map((timeSlot, index): JSX.Element => {
                const isHourBoundary = index % 4 === 0;
                const isHighlighted = highlightedSlots?.techId === tech.user_id &&
                  highlightedSlots.slots.has(timeSlot);
                const hour = parseInt(timeSlot);
                const isWorkingHour = hour >= 8 && hour < 17;
                
                return (
                  <div
                    key={timeSlot}
                    className={`h-full relative ${isHourBoundary ? 'border-l border-[rgb(var(--color-border-200))]' : ''} 
                    ${isHighlighted ? 'bg-[rgb(var(--color-primary-100))]' : ''} 
                    ${!isWorkingHour ? 'bg-gray-100' : ''} transition-colors duration-150`}
                    data-time={timeSlot}
                    onMouseOver={(e) => handleTimeSlotMouseOver(e, timeSlot, tech.user_id)}
                    onDragOver={(e) => handleTimeSlotDragOver(e, timeSlot, tech.user_id)} 
                    onDrop={(e) => handleDrop(e, timeSlot, tech.user_id)}
                  />
                );
              })}
            </div>

            {localEvents
              .filter(
                (event): boolean =>
                  event.user_id === tech.user_id &&
                  new Date(event.scheduled_start).toDateString() === selectedDate.toDateString()
              )
              .map((event): JSX.Element => {
                const isDraggingThis = isDragging && dragState?.sourceId === event.entry_id;
                const effectiveEvent = isDraggingThis
                  ? {
                    ...event,
                    scheduled_start: dragState.currentStart,
                    scheduled_end: dragState.currentEnd,
                    user_id: dragState.currentTechId
                  }
                  : event;

                const { left, width } = getEventPosition(effectiveEvent);
                const colors = getEventColors(event.work_item_type);

                return (
                  <div
                    key={event.entry_id}
                    className={`text-xs ${colors.bg} ${colors.text} p-1 shadow-md rounded cursor-move ${colors.hover} absolute 
                      ${isDraggingThis ? 'opacity-70 shadow-lg' : ''}`}
                    style={{
                      left,
                      width,
                      top: '0px',
                      height: '100%',
                      zIndex: isDraggingThis ? 1000 : 10,
                      pointerEvents: isDraggingThis ? 'none' : 'auto'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, event)}
                    onMouseEnter={() => setHoveredEventId(event.entry_id)}
                    onMouseLeave={() => setHoveredEventId(null)}
                  >
                    <div className="font-bold relative left-4">{event.title.split(':')[0]}</div>
                    <div className="relative left-4">{event.title.split(':')[1]}</div>
                    <button
                      className={`absolute top-1 right-2 w-4 h-4 text-[rgb(var(--color-text-400))] 
                        hover:text-[rgb(var(--color-text-600))] transition-colors delete-button z-20
                        ${hoveredEventId === event.entry_id ? 'block' : 'hidden'}`}
                      onClick={(e) => handleDelete(e, event.entry_id)}
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
                        handleResizeStart(e, event, 'left');
                      }}
                    ></div>
                    <div
                      className="absolute top-0 bottom-0 right-0 w-2 bg-[rgb(var(--color-border-300))] cursor-ew-resize rounded-r resize-handle"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleResizeStart(e, event, 'right');
                      }}
                    ></div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianScheduleGrid;
