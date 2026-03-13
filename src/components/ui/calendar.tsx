'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center mb-2',
        caption_label: 'text-base font-semibold text-white tracking-wide',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-white/5 border-white/10 p-0 hover:bg-white/20 hover:text-white transition-colors rounded-full text-zinc-300'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex mb-2',
        head_cell: 'text-zinc-400 rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wider',
        row: 'flex w-full mt-2',
        cell: 'h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full [&:has([aria-selected])]:bg-sky-500/20 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-sky-500/30 hover:text-white rounded-full transition-all text-zinc-200'
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-sky-500 font-bold text-white hover:bg-sky-400 hover:text-white focus:bg-sky-500 focus:text-white rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)] !opacity-100',
        day_today: 'bg-white/10 text-white font-bold',
        day_outside: 'day-outside text-zinc-600 opacity-50 aria-selected:bg-sky-500/10 aria-selected:text-zinc-300 aria-selected:opacity-70',
        day_disabled: 'text-zinc-600 opacity-50',
        day_range_middle: 'bg-sky-500/20 text-white !rounded-none !shadow-none',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
