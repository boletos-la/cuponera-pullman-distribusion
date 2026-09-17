"use client";

import { es } from "date-fns/locale/es";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { useMemo } from "react";

registerLocale("es", es);

interface ModernDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  placeholderText?: string;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
}
const getTodayLocalStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const compensateDateForDisplay = (date: Date): Date => {
  const compensated = new Date(date.getTime());
  compensated.setHours(12, 0, 0, 0);
  return compensated;
};

export function ModernDatePicker({
  selected,
  onChange,
  minDate,
  placeholderText = "Seleccionar fecha",
  disabled = false,
  className = "",
  dateFormat = "dd/MM/yyyy",
}: ModernDatePickerProps) {
  const todayForMinDate = useMemo(() => getTodayLocalStart(), []);

  const displaySelected = useMemo(() => {
    return selected ? compensateDateForDisplay(selected) : null;
  }, [selected]);

  const handleInternalChange = (date: Date | null) => {
    onChange(date);
  };

  return (
    <div className="relative">
      <DatePicker
        selected={displaySelected}
        onChange={handleInternalChange}
        // minDate={minDate || todayForMinDate}
        minDate={minDate}
        locale="es"
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        disabled={disabled}
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
          placeholder:text-muted-foreground 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          cursor-pointer
          ${className}
        `}
        wrapperClassName="w-full"
        calendarClassName="!bg-white !border !border-gray-300 !shadow-lg !rounded-md"
        dayClassName={(date) => {
          const hasMin = !!minDate;
          const isDisabled = hasMin && minDate && date < minDate;

          const isSelected =
            selected &&
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear();

          if (isDisabled) {
            return "!text-gray-400 !cursor-not-allowed hover:!bg-transparent";
          }
          if (isSelected) {
            return "!bg-blue-600 !text-white hover:!bg-blue-700";
          }
          return "!text-gray-900 hover:!bg-gray-100";
        }}
        weekDayClassName={() => "!text-gray-600 !font-medium !text-xs"}
        monthClassName={() => "!text-gray-900 !bg-white !p-2"}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-300 rounded-t-md">
            <button
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              type="button"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-900">
              {date.toLocaleDateString("es-CL", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              type="button"
            >
              ›
            </button>
          </div>
        )}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
