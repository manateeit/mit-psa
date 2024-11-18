'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import TicketCard from './TicketCard';
import { IScheduleEntry } from '@/interfaces/schedule.interfaces';
import { WorkItemType, IWorkItem } from '@/interfaces/workItem.interfaces';
import { IUser } from '@/interfaces/auth.interfaces';
import { getAllUsers } from '@/lib/actions/user-actions/userActions';
import { searchWorkItems } from '@/lib/actions/workItemActions';
import { addScheduleEntry, updateScheduleEntry, getScheduleEntries, deleteScheduleEntry } from '@/lib/actions/scheduleActions';
import CustomSelect from '@/components/ui/CustomSelect';

const getEventColors = (type: WorkItemType) => {
  switch (type) {
    case 'ticket':
      return {
        bg: 'bg-[rgb(var(--color-primary-100))]',
        hover: 'hover:bg-[rgb(var(--color-primary-200))]',
        text: 'text-[rgb(var(--color-text-900))]'
      };
    case 'project_task':
      return {
        bg: 'bg-[rgb(var(--color-secondary-100))]',
        hover: 'hover:bg-[rgb(var(--color-secondary-200))]',
        text: 'text-[rgb(var(--color-text-900))]'
      };
    case 'non_billable_category':
      return {
        bg: 'bg-[rgb(var(--color-accent-100))]',
        hover: 'hover:bg-[rgb(var(--color-accent-200))]',
        text: 'text-[rgb(var(--color-text-900))]'
      };
    default:
      return {
        bg: 'bg-[rgb(var(--color-primary-100))]',
        hover: 'hover:bg-[rgb(var(--color-primary-200))]',
        text: 'text-[rgb(var(--color-text-900))]'
      };
  }
};

const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const TechnicianScheduleGrid: React.FC<{
  technicians: Omit<IUser, 'tenant'>[],
  events: Omit<IScheduleEntry, 'tenant'>[],
  selectedDate: Date,
  onDrop: (e: React.DragEvent<HTMLDivElement>, techId: string, slot: string) => void,
  onResize: (eventId: string, newStart: Date, newEnd: Date) => void,
  onEventDragStart: (e: React.DragEvent<HTMLDivElement>, event: Omit<IScheduleEntry, 'tenant'>) => void,
  onDeleteEvent: (eventId: string) => void
}> = ({ technicians, events, selectedDate, onDrop, onResize, onEventDragStart, onDeleteEvent }) => {
  const timeSlots = useMemo(() => generateTimeSlots(8, 18), []);
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [hourSlotWidth, setHourSlotWidth] = useState<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const latestResizeRef = useRef<{
    eventId: string;
    newStart: Date;
    newEnd: Date;
  } | null>(null);

  const resizingRef = useRef<{
    eventId: string,
    startX: number,
    initialStart: Date,
    initialEnd: Date,
    resizeDirection: 'left' | 'right'
  } | null>(null);

  const [localEvents, setLocalEvents] = useState<Omit<IScheduleEntry, 'tenant'>[]>(events);
  const [dragOverTechId, setDragOverTechId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  useEffect(() => {
    const handleResize = () => {
      if (scheduleGridRef.current) {
        setHourSlotWidth(scheduleGridRef.current.offsetWidth / 10);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDelete = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this schedule entry?')) {
      onDeleteEvent(eventId);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, event: Omit<IScheduleEntry, 'tenant'>, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      eventId: event.entry_id,
      startX: e.clientX,
      initialStart: new Date(event.scheduled_start),
      initialEnd: new Date(event.scheduled_end),
      resizeDirection: direction
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (resizingRef.current && scheduleGridRef.current) {
      const { eventId, startX, initialStart, initialEnd, resizeDirection } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const hourDelta = deltaX / hourSlotWidth;
      const roundedHourDelta = Math.round(hourDelta * 4) / 4;

      let newStart = new Date(initialStart);
      let newEnd = new Date(initialEnd);

      if (resizeDirection === 'left') {
        newStart = new Date(initialStart.getTime() + roundedHourDelta * 3600000);
        if (newStart < newEnd && (newEnd.getTime() - newStart.getTime()) >= 900000) {
          setLocalEvents(prevEvents =>
            prevEvents.map((event): Omit<IScheduleEntry, 'tenant'> =>
              event.entry_id === eventId
                ? { ...event, scheduled_start: newStart, scheduled_end: newEnd }
                : event
            )
          );

          latestResizeRef.current = { eventId, newStart, newEnd };

          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          resizeTimeoutRef.current = setTimeout(() => {
            if (latestResizeRef.current) {
              onResize(
                latestResizeRef.current.eventId,
                latestResizeRef.current.newStart,
                latestResizeRef.current.newEnd
              );
              latestResizeRef.current = null;
            }
          }, 100);
        }
      } else {
        newEnd = new Date(initialEnd.getTime() + roundedHourDelta * 3600000);
        if (newEnd > newStart && (newEnd.getTime() - newStart.getTime()) >= 900000) {
          setLocalEvents(prevEvents =>
            prevEvents.map((event): Omit<IScheduleEntry, 'tenant'> =>
              event.entry_id === eventId
                ? { ...event, scheduled_start: newStart, scheduled_end: newEnd }
                : event
            )
          );

          latestResizeRef.current = { eventId, newStart, newEnd };

          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          resizeTimeoutRef.current = setTimeout(() => {
            if (latestResizeRef.current) {
              onResize(
                latestResizeRef.current.eventId,
                latestResizeRef.current.newStart,
                latestResizeRef.current.newEnd
              );
              latestResizeRef.current = null;
            }
          }, 100);
        }
      }
    }
  }, [hourSlotWidth, onResize]);

  const handleResizeEnd = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const getEventPosition = (event: Omit<IScheduleEntry, 'tenant'>) => {
    const startTime = new Date(event.scheduled_start);
    const endTime = new Date(event.scheduled_end);

    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    const gridStartHour = 8;
    const hourWidth = 10;
    const left = (startHour - gridStartHour + startMinutes / 60) * hourWidth;
    const durationInHours = (endHour - startHour) + (endMinutes - startMinutes) / 60;
    const width = durationInHours * hourWidth;

    return { left: `${left}%`, width: `${width}%` };
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, techId: string, slot: string) => {
    e.preventDefault();
    setDragOverTechId(techId);
    setDragOverSlot(slot);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.tech-row')) {
      setDragOverTechId(null);
      setDragOverSlot(null);
    }
  }, []);

  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      <div className="space-y-4">
        <div className="h-8"></div>
        {technicians.map((tech): JSX.Element => (
          <div key={tech.user_id} className="h-16 flex items-center text-[rgb(var(--color-text-700))]">
            {tech.first_name} {tech.last_name}
          </div>
        ))}
      </div>
      <div className="relative" ref={scheduleGridRef}>
        <div className="grid grid-cols-10 gap-0 mb-4">
          {timeSlots.map((slot): JSX.Element => (
            <div key={slot} className="text-center text-sm font-semibold text-[rgb(var(--color-text-700))]">
              {slot}
            </div>
          ))}
        </div>
        {technicians.map((tech): JSX.Element => (
          <div
            key={tech.user_id}
            className={`tech-row relative grid grid-cols-10 gap-0 mb-4 ${dragOverTechId === tech.user_id ? 'bg-[rgb(var(--color-primary-50))]' : ''
              }`}
          >
            {timeSlots.map((slot): JSX.Element => (
              <div
                key={`${tech.user_id}-${slot}`}
                className="h-16 border border-[rgb(var(--color-border-200))] p-1"
                onDragOver={(e) => handleDragOver(e, tech.user_id, slot)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  setDragOverTechId(null);
                  setDragOverSlot(null);
                  onDrop(e, tech.user_id, slot);
                }}
              >
              </div>
            ))}
            {localEvents
              .filter(event => event.user_id === tech.user_id &&
                new Date(event.scheduled_start).toDateString() === selectedDate.toDateString())
              .map((event): JSX.Element => {
                const { left, width } = getEventPosition(event);
                const colors = getEventColors(event.work_item_type);
                return (
                  <div
                    key={event.entry_id}
                    className={`absolute top-0 text-xs ${colors.bg} ${colors.text} p-1 shadow-md rounded cursor-move group transition-colors ${colors.hover}`}
                    style={{
                      left,
                      width,
                      height: '64px',
                    }}
                    draggable
                    onDragStart={(e) => onEventDragStart(e, event)}
                  >
                    <div className="font-bold relative left-4">{event.title.split(':')[0]}</div>
                    <div className="relative left-4">{event.title.split(':')[1]}</div>
                    <button
                      className="absolute top-1 right-2 w-4 h-4 text-[rgb(var(--color-text-400))] opacity-0 group-hover:opacity-100 hover:text-[rgb(var(--color-text-600))] transition-colors"
                      onClick={(e) => handleDelete(e, event.entry_id)}
                      title="Delete schedule entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    <div
                      className="absolute top-0 bottom-0 left-0 w-2 bg-[rgb(var(--color-border-300))] cursor-ew-resize rounded-l"
                      onMouseDown={(e) => handleResizeStart(e, event, 'left')}
                    ></div>
                    <div
                      className="absolute top-0 bottom-0 right-0 w-2 bg-[rgb(var(--color-border-300))] cursor-ew-resize rounded-r"
                      onMouseDown={(e) => handleResizeStart(e, event, 'right')}>
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

const TechnicianDispatchDashboard: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [technicians, setTechnicians] = useState<Omit<IUser, 'tenant'>[]>([]);
  const [events, setEvents] = useState<Omit<IScheduleEntry, 'tenant'>[]>([]);
  const [workItems, setWorkItems] = useState<Omit<IWorkItem, "tenant">[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<WorkItemType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'ticket', label: 'Tickets' },
    { value: 'project_task', label: 'Project Tasks' },
    { value: 'non_billable_category', label: 'Non-Billable' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Sort by Name' },
    { value: 'type', label: 'Sort by Type' }
  ];

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchParamsRef = useRef({
    selectedType,
    sortBy,
    sortOrder,
    currentPage,
  });

  useEffect(() => {
    searchParamsRef.current = {
      selectedType,
      sortBy,
      sortOrder,
      currentPage,
    };
  }, [selectedType, sortBy, sortOrder, currentPage]);

  const performSearch = useCallback(async (query: string) => {
    try {
      const { selectedType, sortBy, sortOrder, currentPage } = searchParamsRef.current;
      const result = await searchWorkItems({
        searchTerm: query,
        type: selectedType,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize: ITEMS_PER_PAGE
      });

      setWorkItems(result.items);
      setTotalItems(result.total);
    } catch (err) {
      console.error('Error searching work items:', err);
      setError('Failed to search work items');
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const users = await getAllUsers();
        setTechnicians(users);

        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        const scheduleResult = await getScheduleEntries(start, end);
        if (scheduleResult.success && scheduleResult.entries) {
          setEvents(scheduleResult.entries);
        } else {
          setError('Failed to fetch schedule entries');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      }
    };

    fetchInitialData();
  }, [selectedDate]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, selectedType, sortBy, sortOrder, currentPage, debouncedSearch]);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('event_type', 'work_item');
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onEventDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, event: Omit<IScheduleEntry, 'tenant'>) => {
    e.dataTransfer.setData('text/plain', event.entry_id);
    e.dataTransfer.setData('event_type', 'schedule_entry');

    const dragImage = document.createElement('div');
    dragImage.className = 'text-xs bg-white p-1 shadow';
    dragImage.style.width = '100px';
    dragImage.style.height = '50px';
    dragImage.innerHTML = `
      <div class="font-bold">${event.title.split(':')[0]}</div>
      <div>${event.title.split(':')[1]}</div>
    `;

    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 25);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }, []);

  const debouncedSaveSchedule = useCallback(async (
    eventId: string,
    techId: string,
    startTime: Date,
    endTime: Date
  ) => {
    try {
      const result = await updateScheduleEntry(eventId, {
        user_id: techId,
        scheduled_start: startTime,
        scheduled_end: endTime,
        updated_at: new Date()
      });

      if (!result.success) {
        setError('Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule');
    }
  }, []);

  const onEventDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, techId: string, timeSlot: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    const eventType = e.dataTransfer.getData('event_type');
    const event = events.find((e) => e.entry_id === eventId);

    if (event && eventType === 'schedule_entry') {
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(timeSlot.split(':')[0], 10));
      startTime.setMinutes(0);

      const duration = new Date(event.scheduled_end).getTime() - new Date(event.scheduled_start).getTime();
      const endTime = new Date(startTime.getTime() + duration);

      setEvents((prevEvents) =>
        prevEvents.map((e): Omit<IScheduleEntry, 'tenant'> =>
          e.entry_id === eventId
            ? { ...e, user_id: techId, scheduled_start: startTime, scheduled_end: endTime }
            : e
        )
      );

      await debouncedSaveSchedule(eventId, techId, startTime, endTime);
    }
  }, [events, selectedDate, debouncedSaveSchedule]);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, techId: string, slot: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const eventType = e.dataTransfer.getData('event_type');

    if (eventType === 'schedule_entry') {
      await onEventDrop(e, techId, slot);
      return;
    }

    const slotHour = parseInt(slot.split(':')[0], 10);
    const startTime = new Date(selectedDate);
    startTime.setHours(slotHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const workItem = workItems.find((w) => w.work_item_id === id);

    if (workItem) {
      const newEvent: Omit<IScheduleEntry, 'tenant' | 'entry_id' | 'created_at' | 'updated_at'> = {
        work_item_id: id,
        user_id: techId,
        scheduled_start: startTime,
        scheduled_end: endTime,
        status: 'Scheduled',
        title: `${workItem.name}`,
        work_item_type: workItem.type,
      };

      try {
        const result = await addScheduleEntry(newEvent, { useCurrentUser: false });
        if (result.success && result.entry) {
          setEvents((prevEvents) => [...prevEvents, result.entry]);
          setError(null);
        } else {
          setError('Failed to create schedule entry');
        }
      } catch (err) {
        console.error('Error creating schedule entry:', err);
        setError('Failed to create schedule entry');
      }
    } else {
      setError(`Unable to find work item with id: ${id}`);
    }
  }, [workItems, events, selectedDate, debouncedSaveSchedule, onEventDrop]);

  const onResize = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    setEvents((prevEvents) =>
      prevEvents.map((event): Omit<IScheduleEntry, 'tenant'> =>
        event.entry_id === eventId
          ? { ...event, scheduled_start: newStart, scheduled_end: newEnd }
          : event
      )
    );

    await debouncedSaveSchedule(
      eventId,
      events.find(e => e.entry_id === eventId)?.user_id || '',
      newStart,
      newEnd
    );
  }, [events, debouncedSaveSchedule]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      const result = await deleteScheduleEntry(eventId);
      if (result.success) {
        setEvents((prevEvents) => prevEvents.filter(event => event.entry_id !== eventId));
        setError(null);
      } else {
        setError('Failed to delete schedule entry');
      }
    } catch (err) {
      console.error('Error deleting schedule entry:', err);
      setError('Failed to delete schedule entry');
    }
  }, []);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 p-4 bg-[rgb(var(--color-border-50))] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-[rgb(var(--color-text-900))]">Unassigned Work Items</h2>

          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search work items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-[rgb(var(--color-border-200))] rounded bg-white text-[rgb(var(--color-text-900))] placeholder-[rgb(var(--color-text-400))] focus:outline-none focus:border-[rgb(var(--color-primary-400))] focus:ring-1 focus:ring-[rgb(var(--color-primary-400))]"
            />

            <div className="flex gap-2">
              <CustomSelect
                value={selectedType}
                onValueChange={(value: string) => {
                  setSelectedType(value as WorkItemType | 'all');
                  setCurrentPage(1);
                }}
                options={typeOptions}
                className="flex-1"
              />

              <CustomSelect
                value={sortBy}
                onValueChange={(value: string) => {
                  setSortBy(value as 'name' | 'type');
                  setCurrentPage(1);
                }}
                options={sortOptions}
                className="flex-1"
              />

              <button
                onClick={() => {
                  setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
                  setCurrentPage(1);
                }}
                className="p-2 border border-[rgb(var(--color-border-200))] rounded bg-white text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] transition-colors focus:outline-none focus:border-[rgb(var(--color-primary-400))] focus:ring-1 focus:ring-[rgb(var(--color-primary-400))]"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {workItems.map((item):JSX.Element => (
              <div
                key={item.work_item_id}
                draggable
                onDragStart={(e) => onDragStart(e, item.work_item_id)}
                className="p-2 border border-[rgb(var(--color-border-200))] rounded bg-white cursor-move hover:bg-[rgb(var(--color-border-50))] transition-colors"
              >
                <TicketCard
                  title={item.name}
                  description={item.description}
                  type={item.type}
                  isBillable={item.is_billable}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[rgb(var(--color-border-200))] rounded bg-white text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[rgb(var(--color-primary-400))] focus:ring-1 focus:ring-[rgb(var(--color-primary-400))]"
              >
                Previous
              </button>
              <span className="text-[rgb(var(--color-text-700))]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-[rgb(var(--color-border-200))] rounded bg-white text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[rgb(var(--color-primary-400))] focus:ring-1 focus:ring-[rgb(var(--color-primary-400))]"
              >
                Next
              </button>
            </div>
          )}

          <div className="text-sm text-[rgb(var(--color-text-600))] mt-2 text-center">
            Showing {workItems.length} of {totalItems} items
          </div>
        </div>

        <div className="flex-1 p-4 bg-white overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Technician Schedules</h2>
          <TechnicianScheduleGrid
            technicians={technicians}
            events={events}
            selectedDate={selectedDate}
            onDrop={onDrop}
            onResize={onResize}
            onEventDragStart={onEventDragStart}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </div>
    </div>
  );
}

export default TechnicianDispatchDashboard;
