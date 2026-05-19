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
      className={cn('p-1 relative', className)}
      classNames={{
        root: 'p-2 sm:p-3 w-full flex justify-center font-sans',
        months: 'flex flex-col sm:flex-row space-y-2 sm:space-x-3 sm:space-y-0 relative',
        month: 'space-y-2 w-full',
        month_caption: 'flex justify-center pt-1 relative items-center mb-3',
        caption_label: 'text-[11px] sm:text-[12px] font-bold text-white tracking-[0.15em] uppercase font-heading',
        nav: 'flex items-center absolute w-full justify-between left-0 px-1 top-3 sm:top-4 z-50 pointer-events-none',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-6 w-6 sm:h-7 sm:w-7 bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/20 hover:scale-110 hover:border-white/30 p-0 rounded-full transition-all duration-300 flex items-center justify-center pointer-events-auto shadow-xl backdrop-blur-md'
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-6 w-6 sm:h-7 sm:w-7 bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/20 hover:scale-110 hover:border-white/30 p-0 rounded-full transition-all duration-300 flex items-center justify-center pointer-events-auto shadow-xl backdrop-blur-md'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between w-full mb-2',
        weekday: 'text-sky-400 w-7 sm:w-8 font-black text-[7px] sm:text-[8px] uppercase tracking-[0.2em] text-center drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]',
        week: 'flex w-full mt-1 relative z-20 justify-between gap-0.5 sm:gap-1',
        day: 'h-7 w-7 sm:h-8 sm:w-8 text-center text-[11px] sm:text-[12px] p-0 flex items-center justify-center relative transition-all duration-300 [&:has(.rdp-range_end)]:rounded-r-full [&:has(.rdp-range_start)]:rounded-l-full [&:has(.rdp-selected)]:bg-sky-500/15 first:[&:has(.rdp-selected)]:rounded-l-full last:[&:has(.rdp-selected)]:rounded-r-full',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-7 w-7 sm:h-8 sm:w-8 p-0 font-medium hover:bg-white/15 hover:text-white hover:scale-105 rounded-full transition-all duration-300 text-zinc-300 flex items-center justify-center'
        ),
        selected: '!bg-sky-500 text-white font-black rounded-full !opacity-100 shadow-[0_0_15px_rgba(14,165,233,0.5)]',
        range_start: '!bg-sky-500 text-white rounded-full',
        range_end: '!bg-sky-500 text-white rounded-full',
        range_middle: '!bg-transparent text-white !rounded-none !scale-100 !shadow-none',
        today: 'bg-white/5 text-white font-black border border-sky-400/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]',
        outside: 'text-zinc-600 opacity-40',
        disabled: 'text-zinc-600 opacity-40',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') return <ChevronLeft className="h-5 w-5 stroke-[2.5px]" />;
          if (orientation === 'right') return <ChevronRight className="h-5 w-5 stroke-[2.5px]" />;
          return <></>;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
