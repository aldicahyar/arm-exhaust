'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';

export interface DateWheelPickerProps {
  readonly value?: Date;
  readonly onChange: (date: Date) => void;
  readonly minYear?: number;
  readonly maxYear?: number;
  readonly disabled?: boolean;
  readonly className?: string;
}

const ITEM_HEIGHT = 38;
const VISIBLE_ITEMS = 5;
const PERSPECTIVE_ORIGIN = ITEM_HEIGHT * 2;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface WheelItemProps {
  readonly item: string | number;
  readonly index: number;
  readonly y: MotionValue<number>;
  readonly itemHeight: number;
  readonly visibleItems: number;
  readonly centerOffset: number;
  readonly isSelected: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

function WheelItem({
  item,
  index,
  y,
  itemHeight,
  visibleItems,
  centerOffset,
  isSelected,
  disabled,
  onClick,
}: Readonly<WheelItemProps>) {
  const itemY = useTransform(y, (latest) => index * itemHeight + latest + centerOffset);

  const rotateX = useTransform(
    itemY,
    [0, centerOffset, itemHeight * visibleItems],
    [40, 0, -40]
  );

  const scale = useTransform(
    itemY,
    [0, centerOffset, itemHeight * visibleItems],
    [0.85, 1, 0.85]
  );

  const opacity = useTransform(
    itemY,
    [
      0,
      centerOffset * 0.5,
      centerOffset,
      centerOffset * 1.5,
      itemHeight * visibleItems,
    ],
    [0.25, 0.6, 1, 0.6, 0.25]
  );

  return (
    <motion.div
      className="flex select-none items-center justify-center cursor-pointer"
      style={{
        height: itemHeight,
        rotateX,
        scale,
        opacity,
        transformStyle: 'preserve-3d',
        transformOrigin: `center center -${PERSPECTIVE_ORIGIN}px`,
      }}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      <span
        className={`font-medium transition-colors text-[14px] ${
          isSelected ? 'text-white' : 'text-[#8A8F98]'
        }`}
      >
        {item}
      </span>
    </motion.div>
  );
}

interface WheelColumnProps {
  readonly items: readonly (string | number)[];
  readonly value: number;
  readonly onChange: (index: number) => void;
  readonly itemHeight: number;
  readonly visibleItems: number;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly ariaLabel: string;
}

function WheelColumn({
  items,
  value,
  onChange,
  itemHeight,
  visibleItems,
  disabled,
  className = '',
  ariaLabel,
}: Readonly<WheelColumnProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(-value * itemHeight);
  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const itemsLengthRef = useRef(items.length);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    itemsLengthRef.current = items.length;
  });

  useEffect(() => {
    animate(y, -value * itemHeight, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [value, itemHeight, y]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled) return;

    const currentY = y.get();
    const velocity = info.velocity.y;
    const projectedY = currentY + velocity * 0.2;

    let newIndex = Math.round(-projectedY / itemHeight);
    newIndex = Math.max(0, Math.min(items.length - 1, newIndex));

    onChange(newIndex);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const direction = e.deltaY > 0 ? 1 : -1;
      const currentValue = valueRef.current;
      const maxIndex = itemsLengthRef.current - 1;
      const newIndex = Math.max(0, Math.min(maxIndex, currentValue + direction));

      if (newIndex !== currentValue) {
        onChangeRef.current(newIndex);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const maxIndex = items.length - 1;
    let newIndex = value;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = Math.max(0, value - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = Math.min(maxIndex, value + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = maxIndex;
    } else {
      return;
    }

    if (newIndex !== value) {
      onChange(newIndex);
    }
  };

  const dragConstraints = useMemo(
    () => ({
      top: -(items.length - 1) * itemHeight,
      bottom: 0,
    }),
    [items.length, itemHeight]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden outline-none ${
        disabled ? 'pointer-events-none opacity-40' : ''
      } ${className}`}
      style={{ height: itemHeight * visibleItems }}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-valuetext={String(items[value] ?? '')}
      aria-disabled={disabled}
    >
      {/* Top 3D gradient fade overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none"
        style={{
          height: centerOffset,
          background: 'linear-gradient(to bottom, #141416 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom 3D gradient fade overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 select-none"
        style={{
          height: centerOffset,
          background: 'linear-gradient(to top, #141416 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Center Active Selection Indicator Bar */}
      <div
        className="pointer-events-none absolute inset-x-0 border-y border-[#2B2B30] bg-[#1E1E21]/40"
        style={{
          top: centerOffset,
          height: itemHeight,
        }}
        aria-hidden="true"
      />

      {/* Scrollable / Draggable Wheel Column */}
      <motion.div
        className="cursor-grab active:cursor-grabbing"
        style={{
          y,
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
        }}
        drag="y"
        dragConstraints={dragConstraints}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        {items.map((item, index) => (
          <WheelItem
            key={`${item}-${index}`}
            item={item}
            index={index}
            y={y}
            itemHeight={itemHeight}
            visibleItems={visibleItems}
            centerOffset={centerOffset}
            isSelected={index === value}
            disabled={disabled}
            onClick={() => onChange(index)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function DateWheelPicker({
  value,
  onChange,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  disabled = false,
  className = '',
}: Readonly<DateWheelPickerProps>) {
  const months = MONTH_NAMES;

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  const [dateState, setDateState] = useState(() => {
    const currentDate = value ?? new Date(1998, 9, 14); // Default: 14 Oct 1998
    return {
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    };
  });

  const isInternalChange = useRef(false);

  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(dateState.year, dateState.month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [dateState.month, dateState.year]);

  const handleDayChange = useCallback((dayIndex: number) => {
    isInternalChange.current = true;
    setDateState((prev) => ({ ...prev, day: dayIndex + 1 }));
  }, []);

  const handleMonthChange = useCallback((monthIndex: number) => {
    isInternalChange.current = true;
    setDateState((prev) => {
      const daysInNewMonth = getDaysInMonth(prev.year, monthIndex);
      const adjustedDay = Math.min(prev.day, daysInNewMonth);
      return { ...prev, month: monthIndex, day: adjustedDay };
    });
  }, []);

  const handleYearChange = useCallback(
    (yearIndex: number) => {
      isInternalChange.current = true;
      setDateState((prev) => {
        const newYear = years[yearIndex] ?? prev.year;
        const daysInNewMonth = getDaysInMonth(newYear, prev.month);
        const adjustedDay = Math.min(prev.day, daysInNewMonth);
        return { ...prev, year: newYear, day: adjustedDay };
      });
    },
    [years]
  );

  useEffect(() => {
    if (isInternalChange.current) {
      const newDate = new Date(dateState.year, dateState.month, dateState.day);
      onChange(newDate);
      isInternalChange.current = false;
    }
  }, [dateState, onChange]);

  useEffect(() => {
    if (value && !isInternalChange.current) {
      const valDay = value.getDate();
      const valMonth = value.getMonth();
      const valYear = value.getFullYear();

      if (
        valDay !== dateState.day ||
        valMonth !== dateState.month ||
        valYear !== dateState.year
      ) {
        setDateState({
          day: valDay,
          month: valMonth,
          year: valYear,
        });
      }
    }
  }, [value, dateState.day, dateState.month, dateState.year]);

  const yearIndex = years.indexOf(dateState.year);

  return (
    <div
      className={`bg-[#141416] border border-[#1E1E21] p-3 flex items-center justify-center gap-3 select-none ${className}`}
      style={{ perspective: '1000px' }}
      role="group"
      aria-label="Date wheel picker"
    >
      {/* Day Wheel */}
      <WheelColumn
        items={days}
        value={dateState.day - 1}
        onChange={handleDayChange}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        disabled={disabled}
        className="w-14"
        ariaLabel="Select day"
      />

      {/* Month Wheel */}
      <WheelColumn
        items={months}
        value={dateState.month}
        onChange={handleMonthChange}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        disabled={disabled}
        className="w-28 text-center"
        ariaLabel="Select month"
      />

      {/* Year Wheel */}
      <WheelColumn
        items={years}
        value={yearIndex >= 0 ? yearIndex : 0}
        onChange={handleYearChange}
        itemHeight={ITEM_HEIGHT}
        visibleItems={VISIBLE_ITEMS}
        disabled={disabled}
        className="w-16"
        ariaLabel="Select year"
      />
    </div>
  );
}
