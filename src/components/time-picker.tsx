
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  date?: Date;
};

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const ampm = ['AM', 'PM'];

function TimeColumn({
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

  return (
     <div className="h-10 overflow-hidden flex-1" ref={emblaRef}>
      <div className="flex h-full flex-col touch-none">
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              'flex h-10 min-h-0 shrink-0 grow-0 basis-full items-center justify-center text-lg font-semibold text-foreground'
            )}
            onClick={() => emblaApi?.scrollTo(items.indexOf(item))}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimePicker({ value, onChange, date: propDate }: TimePickerProps) {
  const date = propDate || new Date();
  
  const parsedDate = useMemo(() => parse(value, 'HH:mm', date), [value, date]);
  
  const [hour, setHour] = useState(() => format(parsedDate, 'hh'));
  const [minute, setMinute] = useState(() => format(parsedDate, 'mm'));
  const [period, setPeriod] = useState(() => format(parsedDate, 'aa').toUpperCase());

  useEffect(() => {
    const newParsedDate = parse(value, 'HH:mm', date);
    setHour(format(newParsedDate, 'hh'));
    setMinute(format(newParsedDate, 'mm'));
    setPeriod(format(newParsedDate, 'aa').toUpperCase());
  }, [value, date]);

  const handleTimeChange = (newHour: string, newMinute: string, newPeriod: string) => {
    const timeString12hr = `${newHour}:${newMinute} ${newPeriod}`;
    const newDate = parse(timeString12hr, 'hh:mm aa', new Date());
    onChange(format(newDate, 'HH:mm'));
  };

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    handleTimeChange(newHour, minute, period);
  };
  
  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    handleTimeChange(hour, newMinute, period);
  };
  
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    handleTimeChange(hour, minute, newPeriod);
  };


  return (
    <div className="flex items-center justify-between rounded-md border bg-background p-0 h-10">
      <TimeColumn items={hours} selectedValue={hour} onSelect={handleHourChange} />
      <div className="text-xl font-semibold text-foreground self-center h-full flex items-center">:</div>
      <TimeColumn items={minutes} selectedValue={minute} onSelect={handleMinuteChange} />
      <div className="w-px bg-border h-full" />
      <TimeColumn items={ampm} selectedValue={period} onSelect={handlePeriodChange} loop={false} />
    </div>
  );
}
