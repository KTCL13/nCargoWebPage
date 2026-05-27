import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DateTimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  isDateInvalid?: boolean;
  errorMessage?: string;
  startLabel?: string;
  endLabel?: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** Formats a Date to a datetime-local string: YYYY-MM-DDTHH:mm */
function toDateTimeLocal(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Earliest allowed start: 1 month before today */
function getMinStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return toDateTimeLocal(d);
}

/** Latest allowed end when a start is selected: start + 1 year */
function getMaxEnd(startTime: string): string | undefined {
  if (!startTime) return undefined;
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return undefined;
  d.setFullYear(d.getFullYear() + 1);
  return toDateTimeLocal(d);
}

// ── Main component ────────────────────────────────────────────────────────────

export function DateTimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  isDateInvalid = false,
  errorMessage = 'La fecha de fin no puede ser anterior a la de inicio.',
  startLabel = 'Inicio',
  endLabel = 'Deadline',
}: DateTimeRangePickerProps) {
  const minStart = getMinStart();
  const maxEnd = getMaxEnd(startTime);

  const errorInputClass = isDateInvalid
    ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
    : '';

  const handleInputChange = (
    value: string,
    onChangeFn: (value: string) => void,
    inputElement: EventTarget & HTMLInputElement
  ) => {
    onChangeFn(value);
    if (value.length >= 16) {
      inputElement.blur();
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">

        {/* ── Start ── */}
        <div className="space-y-0.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Calendar size={14} className="text-[var(--color-primary)]" />
            {startLabel}
          </label>
          <input
            type="datetime-local"
            value={startTime}
            min={minStart}
            onChange={(e) => handleInputChange(e.target.value, onStartTimeChange, e.target)}
            className={`form-input w-full transition-colors ${errorInputClass}`}
          />
        </div>

        {/* ── End ── */}
        <div className="space-y-0.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
            <Clock size={14} className="text-[var(--color-primary)]" />
            {endLabel}
          </label>
          <input
            type="datetime-local"
            value={endTime}
            min={startTime || minStart}
            max={maxEnd}
            onChange={(e) => handleInputChange(e.target.value, onEndTimeChange, e.target)}
            className={`form-input w-full transition-colors ${errorInputClass}`}
          />
        </div>

      </div>

      {/* ── Validation banner ── */}
      {isDateInvalid && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-[var(--radius-md)] border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[11px] font-bold leading-tight">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
