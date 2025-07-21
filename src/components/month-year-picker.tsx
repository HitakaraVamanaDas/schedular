
'use client';

import React, { useState } from 'react';
import { format, set } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type MonthYearPickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  fromYear?: number;
  toYear?: number;
};

const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMMM'));

export default function MonthYearPicker({ value, onChange, fromYear, toYear }: MonthYearPickerProps) {
  const [isMonthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setYearDropdownOpen] = useState(false);

  const years = React.useMemo(() => {
    const start = fromYear || new Date().getFullYear() - 70;
    const end = toYear || new Date().getFullYear() + 10;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [fromYear, toYear]);

  const handleMonthChange = (monthIndex: number) => {
    const newDate = set(value, { month: monthIndex });
    onChange(newDate);
    setMonthDropdownOpen(false);
  };

  const handleYearChange = (year: number) => {
    const newDate = set(value, { year });
    onChange(newDate);
    setYearDropdownOpen(false);
  };

  const currentMonth = format(value, 'MMMM');
  const currentYear = value.getFullYear();

  return (
    <div className="flex w-full rounded-md border">
        <DropdownMenu open={isMonthDropdownOpen} onOpenChange={setMonthDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-1/2 rounded-r-none h-11 text-lg font-semibold">
                    {currentMonth}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                {months.map((month, index) => (
                    <DropdownMenuItem key={month} onClick={() => handleMonthChange(index)}>
                        {month}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px bg-border h-11" />
        
        <DropdownMenu open={isYearDropdownOpen} onOpenChange={setYearDropdownOpen}>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="w-1/2 rounded-l-none h-11 text-lg font-semibold">
                    {currentYear}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                {years.map(year => (
                    <DropdownMenuItem key={year} onClick={() => handleYearChange(year)}>
                        {year}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}
