
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { format, getDaysInMonth, set } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type DatePickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  fromYear?: number;
  toYear?: number;
};

const months = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMMM'));

function DateColumn({
  items,
  selectedValue,
  onSelect,
  loop = true,
}: {
  items: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  loop?: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: loop,
    align: 'center',
    containScroll: 'trimSnaps',
  });

  const handleSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    onSelect(items[newIndex]);
  }, [emblaApi, onSelect, items]);

  useEffect(() => {
    if (emblaApi) {
      const initialIndex = items.findIndex((item) => item === selectedValue);
      if (initialIndex !== -1 && initialIndex !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(initialIndex, true);
      }
      emblaApi.on('select', handleSelect);
    }
    return () => {
      emblaApi?.off('select', handleSelect);
    };
  }, [emblaApi, selectedValue, items, handleSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();


  return (
    <div className="h-10 overflow-hidden flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0" ref={emblaRef}>
            <div className="flex h-full flex-col touch-none">
                {items.map((item) => (
                    <div
                        key={item}
                        className='flex h-10 min-h-0 shrink-0 grow-0 basis-full items-center justify-center text-lg font-semibold text-foreground'
                        onClick={() => emblaApi?.scrollTo(items.indexOf(item))}
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default function DatePicker({ value: propDate, onChange, fromYear, toYear }: DatePickerProps) {
  const years = useMemo(() => {
    const start = fromYear || new Date().getFullYear() - 70;
    const end = toYear || new Date().getFullYear() + 10;
    return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
  }, [fromYear, toYear]);

  const [day, setDay] = useState(() => format(propDate, 'dd'));
  const [month, setMonth] = useState(() => format(propDate, 'MMMM'));
  const [year, setYear] = useState(() => format(propDate, 'yyyy'));

  const daysInMonth = useMemo(() => {
    const monthIndex = months.indexOf(month);
    const numDays = getDaysInMonth(new Date(parseInt(year), monthIndex));
    return Array.from({ length: numDays }, (_, i) => (i + 1).toString().padStart(2, '0'));
  }, [month, year]);

  useEffect(() => {
    setDay(format(propDate, 'dd'));
    setMonth(format(propDate, 'MMMM'));
    setYear(format(propDate, 'yyyy'));
  }, [propDate]);
  
  useEffect(() => {
    const currentDayNumber = parseInt(day);
    if (currentDayNumber > daysInMonth.length) {
      setDay(daysInMonth.length.toString().padStart(2, '0'));
    }
  }, [daysInMonth, day]);


  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    const monthIndex = months.indexOf(newMonth);
    const updatedDate = set(propDate, {
      year: parseInt(newYear),
      month: monthIndex,
      date: parseInt(newDay),
    });
    onChange(updatedDate);
  };
  
  const handleDayChange = (newDay: string) => {
    setDay(newDay);
    handleDateChange(newDay, month, year);
  };
  
  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    handleDateChange(day, newMonth, year);
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    handleDateChange(day, month, newYear);
  };

  return (
    <div className="flex items-center justify-between bg-background rounded-md border h-10">
      <DateColumn items={daysInMonth} selectedValue={day} onSelect={handleDayChange} />
      <div className="w-px bg-border h-full" />
      <DateColumn items={months} selectedValue={month} onSelect={handleMonthChange} />
       <div className="w-px bg-border h-full" />
      <DateColumn items={years} selectedValue={year} onSelect={handleYearChange} />
    </div>
  );
}
