import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpRight, Loader2 } from 'lucide-react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { taskService } from '../../services/taskService';
import { useNavigate } from 'react-router-dom';

interface CalendarTask {
  id: string | number;
  title: string;
  type: string;
  scheduled_at: string;
  project_id: string | number;
  bucket_id?: string | number;
  status?: string;
  bucket_name?: string;
}

interface ScheduleCalendarProps {
  projectId?: string | number;
  onTaskClick?: (task: CalendarTask) => void;
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    CODE: 'bg-[#3B82F6]',
    REQUIREMENT: 'bg-[#8B5CF6]',
    DESIGN: 'bg-[#EC4899]',
    OTHER: 'bg-[#F59E0B]',
    'NON-CODE': 'bg-[#14B8A6]',
  };
  return colors[type] || 'bg-[#6B7280]';
};

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  projectId,
  onTaskClick,
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Shared hover handlers for the debounce logic
  const handleMouseEnter = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredDayIndex(index);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDayIndex(null);
    }, 300);
  };

  // Get calendar grid for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the starting day of the week (0-6)
    const startingDayOfWeek = firstDay.getDay();

    // Calculate previous month days to fill the grid
    const prevMonthDays = startingDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthStartDay = prevMonthLastDay - prevMonthDays + 1;

    const calendarDays = [];

    // Add previous month days
    for (let i = prevMonthStartDay; i <= prevMonthLastDay; i++) {
      calendarDays.push({
        day: i,
        isCurrent: false,
        date: new Date(year, month - 1, i),
      });
    }

    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      calendarDays.push({
        day: i,
        isCurrent: true,
        date: new Date(year, month, i),
      });
    }

    // Add next month days to fill the grid
    let nextMonthDay = 1;
    while (calendarDays.length % 7 !== 0) {
      calendarDays.push({
        day: nextMonthDay++,
        isCurrent: false,
        date: new Date(year, month + 1, nextMonthDay - 1),
      });
    }

    return calendarDays;
  };

  // Fetch tasks for current month
  useEffect(() => {
    if (!projectId) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const result = await taskService.getCalendarTasks(projectId, startDate, endDate);
        setTasks(result.tasks || []);
      } catch (error) {
        console.error('Failed to fetch calendar tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, currentDate]);

  const getTasksForDay = (date: Date): CalendarTask[] => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.scheduled_at);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = getCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleTaskClick = (task: CalendarTask) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      navigate(`/projects/${task.project_id}`);
    }
  };

  return (
    <SurfaceCard
      title="Schedule Sync"
      subtitle="Global Timeline"
      icon={Calendar}
      className="h-full flex flex-col"
      rightElement={<MoreHorizontal className="text-slate-500 cursor-pointer" size={18} />}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-[#1F2937] rounded transition-colors"
        >
          <ChevronLeft size={18} className="text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-slate-300">{monthYear}</span>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-[#1F2937] rounded transition-colors"
        >
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-[#3B82F6]" size={24} />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-7 gap-px bg-[#374151] border border-[#374151] rounded-xl flex-1 overflow-auto">
          {/* Day labels */}
          {days.map((d, i) => (
            <div
              key={`day-label-${i}`}
              className={`bg-[#1F2937] py-3 text-center text-[10px] text-slate-400 font-bold uppercase ${
                i === 0 ? 'rounded-tl-xl' : ''
              } ${i === 6 ? 'rounded-tr-xl' : ''}`}
            >
              {d}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((d, i) => {
            const dayTasks = d.isCurrent ? getTasksForDay(d.date) : [];
            const today = new Date();
            const isToday =
              d.isCurrent &&
              d.day === today.getDate() &&
              today.getMonth() === currentDate.getMonth() &&
              today.getFullYear() === currentDate.getFullYear();

            return (
              <div
                key={`cal-day-${i}`}
                ref={(el) => { dayRefs.current[i] = el; }}
                onMouseEnter={() => {
                  if (dayTasks.length > 0) {
                    handleMouseEnter(i);
                  } else {
                    // Instantly hide the tooltip if we hover over an empty day
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    setHoveredDayIndex(null);
                  }
                }}
                onMouseLeave={handleMouseLeave}
                className={`bg-[#151A22] p-3 min-h-[90px] relative hover:bg-[#1F2937]/50 transition-colors flex flex-col overflow-visible ${
                  dayTasks.length > 0 ? 'cursor-pointer hover:z-[60]' : ''
                }`}
              >
                <span
                  className={`text-[12px] font-semibold ${
                    isToday
                      ? 'text-[#22C55E]'
                      : d.isCurrent
                        ? 'text-slate-300'
                        : 'text-slate-600'
                  }`}
                >
                  {d.day < 10 ? `0${d.day}` : d.day}
                </span>

                {/* Task indicators */}
                <div className="mt-auto flex flex-col gap-1 w-full pb-1">
                  {dayTasks.length > 0 && (
                    <div className="flex gap-1 w-full px-1 flex-wrap">
                      {dayTasks.slice(0, 3).map((task, idx) => (
                        <div
                          key={idx}
                          className={`h-1 flex-1 rounded-sm ${getTypeColor(task.type)} min-w-[8px]`}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[8px] text-slate-500">+{dayTasks.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip Portal */}
      {hoveredDayIndex !== null && dayRefs.current[hoveredDayIndex] && (() => {
        const calendarDays = getCalendarDays();
        const d = calendarDays[hoveredDayIndex];
        const dayTasks = d.isCurrent ? getTasksForDay(d.date) : [];
        const rect = dayRefs.current[hoveredDayIndex]?.getBoundingClientRect();

        if (!rect || dayTasks.length === 0) return null;

        // Smart Positioning Logic
        const tooltipWidth = 256;
        const padding = 16; // 16px safe margin from screen edges
        
        // 1. Clamp X-Axis (Prevents left/right edge cutoff)
        const cellCenter = rect.left + rect.width / 2;
        let leftPos = cellCenter - (tooltipWidth / 2);
        
        if (leftPos < padding) {
          leftPos = padding; 
        } else if (leftPos + tooltipWidth > window.innerWidth - padding) {
          leftPos = window.innerWidth - tooltipWidth - padding;
        }

        // 2. Smart Y-Axis (Flips below the cell if it gets too close to the top window edge)
        let topPos = rect.top - 12;
        let transform = 'translateY(-100%)';
        
        if (topPos - 200 < 0) { 
          topPos = rect.bottom + 12;
          transform = 'translateY(0)';
        }

        return createPortal(
          <div
            className="fixed bg-[#1F2937] border border-[#374151] rounded-lg p-2 shadow-2xl max-h-48 overflow-y-auto z-[9999]"
            style={{
              top: `${topPos}px`,
              left: `${leftPos}px`,
              transform: transform,
              width: `${tooltipWidth}px`,
            }}
            onMouseEnter={() => handleMouseEnter(hoveredDayIndex)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 px-1 pt-1">
              {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} on {d.day}
            </div>
            {dayTasks.map((task, idx) => (
              <div
                key={idx}
                onClick={() => handleTaskClick(task)}
                className="flex items-start justify-between gap-2 p-2 hover:bg-[#374151] rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full ${getTypeColor(task.type)} mt-1 flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-[11px] font-medium truncate">{task.title}</div>
                    <div className="text-slate-400 text-[9px]">{task.type}</div>
                    <div className="text-[9px] text-slate-500">
                      {new Date(task.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <ArrowUpRight size={12} className="text-slate-400 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>,
          document.body
        );
      })()}
    </SurfaceCard>
  );
};