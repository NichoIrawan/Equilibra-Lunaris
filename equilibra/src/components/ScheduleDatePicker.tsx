import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, X } from 'lucide-react';

interface ScheduleDatePickerProps {
  value?: string; // ISO format datetime
  onChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
}

export const ScheduleDatePicker: React.FC<ScheduleDatePickerProps> = ({
  value,
  onChange,
  label = 'Schedule Task',
  placeholder = 'Select date & time',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRef, setTriggerRef] = useState<HTMLButtonElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    value ? new Date(value).toISOString().split('T')[0] : ''
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? new Date(value).toISOString().split('T')[1].slice(0, 5) : '09:00'
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate) {
      const dateTime = `${newDate}T${selectedTime}:00`;
      onChange(new Date(dateTime).toISOString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    if (selectedDate) {
      const dateTime = `${selectedDate}T${newTime}:00`;
      onChange(new Date(dateTime).toISOString());
    }
  };

  const handleClear = () => {
    setSelectedDate('');
    setSelectedTime('09:00');
    onChange(undefined);
  };

  const formatDisplayValue = (): string => {
    if (!value) return placeholder;
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dropdownPosition = triggerRef ? {
    top: (triggerRef.getBoundingClientRect().bottom + window.scrollY) + 8,
    left: triggerRef.getBoundingClientRect().left + window.scrollX,
    width: triggerRef.getBoundingClientRect().width,
  } : null;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Calendar size={14} />
          {label}
        </label>
      )}

      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          ref={setTriggerRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full px-3 py-2 bg-[#151A22] border border-[#374151] rounded-lg text-left text-sm text-slate-300 hover:border-[#3B82F6] transition-colors flex items-center justify-between"
        >
          <span className={value ? 'text-white' : 'text-slate-500'}>{formatDisplayValue()}</span>
          <Calendar size={14} className="text-slate-400" />
        </button>

        {isOpen && dropdownPosition && createPortal(
          <div 
            className="fixed bg-[#1F2937] border border-[#374151] rounded-lg p-4 z-[9999] shadow-lg space-y-3"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Date Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  e.stopPropagation();
                  handleDateChange(e);
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-2 bg-[#151A22] border border-[#374151] rounded text-sm text-white focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Time Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Clock size={12} /> Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTimeChange(e);
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-2 bg-[#151A22] border border-[#374151] rounded text-sm text-white focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium rounded transition-colors"
              >
                Done
              </button>
              {value && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="flex-1 px-3 py-2 bg-[#374151] hover:bg-[#4B5563] text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {value && (
        <div className="text-xs text-slate-400">
          Scheduled for: <span className="text-[#3B82F6] font-medium">{formatDisplayValue()}</span>
        </div>
      )}

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />,
        document.body
      )}
    </div>
  );
};
