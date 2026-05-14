'use client';

import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  className?: string;
  onUpdate: (range: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({ className, onUpdate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onUpdate({ from: newDate?.from, to: newDate?.to });
    
    // Auto-close when both dates are selected
    if (newDate?.from && newDate?.to) {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={1}
            className="p-3 sm:p-5"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
export function DatePicker({ value, onChange, placeholder = 'Pick a date', className }: { value?: string; onChange: (date: string) => void; placeholder?: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-medium bg-[#050505] border-white/10 rounded-xl py-6 hover:bg-white/5 transition-all",
            !date && "text-zinc-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-400" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'));
              setIsOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
