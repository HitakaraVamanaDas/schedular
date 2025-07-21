'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

type PivotProps = {
  titles: string[];
  children: React.ReactNode;
};

export default function Pivot({ titles, children }: PivotProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const headerRef = React.useRef<HTMLDivElement>(null);

  const handleTitleClick = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (emblaApi) {
      setActiveIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const activeTitleEl = headerRef.current?.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
    if (activeTitleEl) {
      activeTitleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Pivot Header */}
      <div className="overflow-x-auto whitespace-nowrap no-scrollbar pl-4">
        <div ref={headerRef} className="inline-block">
          {titles.map((title, index) => (
            <button
              key={title}
              data-index={index}
              onClick={() => handleTitleClick(index)}
              className={cn(
                'text-4xl font-light lowercase mr-6 pb-2 transition-all duration-300 ease-in-out',
                activeIndex === index ? 'text-foreground font-semibold scale-110' : 'text-muted-foreground/60'
              )}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Pivot Content */}
      <div className="flex-1 w-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              className={cn(
                'w-full flex-shrink-0 min-w-0 overflow-y-auto no-scrollbar',
                index === activeIndex && 'animate-content-slide-in'
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
