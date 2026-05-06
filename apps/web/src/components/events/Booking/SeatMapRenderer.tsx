'use client';

import React, { useMemo, memo, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';

// --- Types ---
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'RESERVED';

export interface SeatData {
  id: string;
  x?: number | null;
  y?: number | null;
  row?: string | null;
  number: string;
  status: SeatStatus;
  label: string;
  price?: number;
}

interface SeatMapRendererProps {
  backgroundImage?: string | null;
  seats: SeatData[];
  selectedSeatIds: string[];
  onSeatClick: (seat: SeatData) => void;
}

// --- Constants ---
const SEAT_SIZE = 50;
const SEAT_RADIUS = 12; // Border radius for semi-squared
const GRID_GAP_X = 66;
const GRID_GAP_Y = 76;
const CANVAS_SIZE = 2000;
const STAGE_Y_OFFSET = 200; // Push seats down to make room for stage
const VISUAL_CENTER_OFFSET = 180; // Shift content slightly left as requested

// --- Helper: Layout Calculation ---
// Extracted to keep component clean. 
// Ideally this lives in a utils/layout.ts file
const calculateLayout = (seats: SeatData[]) => {
  const rows = Array.from(new Set(seats.map(s => s.row || 'GA'))).sort();

  // Extract all seat numbers to find range
  const seatNumbers = seats.map(s => {
    const match = s.number.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  });

  const minSeatNum = seatNumbers.length > 0 ? Math.min(...seatNumbers) : 1;
  const maxSeatNum = seatNumbers.length > 0 ? Math.max(...seatNumbers) : 1;

  // Calculate grid dimensions
  const colSpan = maxSeatNum - minSeatNum + 1;
  // [FIX] Use (colSpan - 1) to calculate center-to-center width for perfect alignment
  const gridWidth = Math.max(0, (colSpan - 1)) * GRID_GAP_X;

  // Dynamic Canvas Size
  // Ensure it's at least the default size, but expand if grid is huge
  const contentWidth = Math.max(1200, gridWidth + 400);
  const contentHeight = STAGE_Y_OFFSET + (rows.length * GRID_GAP_Y) + 300;

  // Center the grid: ContentCenter - HalfGridWidth
  const startX = (contentWidth / 2) - (gridWidth / 2);

  const processedSeats = seats.map(seat => {
    // 1. Use DB Coordinates if available
    // if (typeof seat.x === 'number' && typeof seat.y === 'number') {
    //   return { ...seat, renderX: seat.x, renderY: seat.y };
    // }

    // 2. Fallback: Auto-Grid Layout
    const rowIdx = rows.indexOf(seat.row || 'GA');
    const seatNumMatch = seat.number.match(/\d+/);
    const seatNum = seatNumMatch ? parseInt(seatNumMatch[0], 10) : 1;

    // Normalize x position based on minSeatNum
    return {
      ...seat,
      renderX: startX + ((seatNum - minSeatNum) * GRID_GAP_X) - VISUAL_CENTER_OFFSET,
      renderY: STAGE_Y_OFFSET + (rowIdx * GRID_GAP_Y)
    };
  });

  return { processedSeats, contentWidth, contentHeight };
};

const Seat = memo(({ seat, isSelected, isDisabled, onClick }: {
  seat: SeatData & { renderX: number, renderY: number },
  isSelected: boolean,
  isDisabled: boolean,
  onClick: (s: SeatData) => void
}) => {
  // Determine Visual Style
  const colorClass = useMemo(() => {
    if (isSelected) return 'fill-primary stroke-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]';
    if (seat.status === 'BOOKED') return 'fill-gray-900 stroke-gray-700 opacity-60 pointer-events-none';
    if (seat.status === 'LOCKED') return 'fill-[#b45309]/20 stroke-[#f97316] pointer-events-none'; // Orange-500 equivalent
    if (seat.status === 'RESERVED') return 'fill-[#b45309]/20 stroke-[#f97316] pointer-events-none';

    // Default Available
    return 'fill-[#24303d] stroke-[#364659] hover:fill-primary/20 hover:stroke-primary cursor-pointer hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)]'; // Added glow on hover
  }, [seat.status, isSelected]);

  // Keyboard Handler for Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(seat);
    }
  };

  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((seat.price || 0) / 100);

  return (
    <g
      transform={`translate(${seat.renderX}, ${seat.renderY})`}
      onClick={() => !isDisabled && onClick(seat)}
      className="transition-transform duration-200 focus:outline-none"
      role="button"
      aria-label={`Seat ${seat.label}, Price ${priceFormatted}, Status ${seat.status}`}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <rect
        width={SEAT_SIZE}
        height={SEAT_SIZE}
        x={-SEAT_SIZE / 2}
        y={-SEAT_SIZE / 2}
        rx={SEAT_RADIUS}
        strokeWidth={2}
        className={cn("transition-all duration-200", colorClass)}
      />

      {/* Seat Label */}
      <text
        y={1}
        textAnchor="middle"
        alignmentBaseline="middle"
        className={cn(
            "pointer-events-none font-bold select-none font-sans",
            seat.label.length > 2 ? "text-[14px]" : "text-[16px]", // Scale down if label is long
            isSelected ? "fill-white" : (seat.status === 'BOOKED' ? 'fill-gray-600' : "fill-slate-200")
        )}
      >
        {seat.label}
      </text>

      <title>{`Row ${seat.row || '-'} Seat ${seat.number} • ${priceFormatted}`}</title>
    </g>
  );
});

Seat.displayName = 'Seat';

export const SeatMapRenderer: React.FC<SeatMapRendererProps> = memo(({
  backgroundImage,
  seats,
  selectedSeatIds,
  onSeatClick
}) => {

  // Memoize layout calculation to prevent re-calc on every selection change
  // Only re-calc if the *list* of seats changes (e.g. switching sections)
  const { processedSeats, contentWidth, contentHeight } = useMemo(() => calculateLayout(seats), [seats]);

  // Generate a key to force reset transform when map changes
  const canvasKey = useMemo(() => {
    if (seats.length === 0) return 'empty';
    // Combine first seat ID and length as a proxy for section change
    return `${seats[0].id}-${seats.length}`;
  }, [seats]);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to calculate fit scale and center
  const zoomToFit = () => {
    if (!transformRef.current || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    // Calculate ratios
    // Scale down if content is bigger than container
    // Scale up if content is smaller (up to max 1.0 or user preference)
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;

    // Use the smaller scale to ensure it fits both dimensions
    // 0.9 factor adds a 5% padding on each side
    const fitScale = Math.min(scaleX, scaleY) * 0.9;

    // Don't zoom in crazy amounts on massive screens, but ensure we see everything
    // And don't go below reasonable visibility
    const finalScale = Math.min(Math.max(fitScale, 0.2), 1.5);

    transformRef.current.centerView(finalScale, 0); // 0 duration for instant sync or default
  };

  // Force center view when data changes
  useEffect(() => {
    if (transformRef.current && seats.length > 0) {
      const timer = setTimeout(() => {
        zoomToFit();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [canvasKey, seats.length, contentWidth, contentHeight]);

  // Handle window resize with ResizeObserver for true responsiveness (handles split views etc)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Debounce slightly to smooth out updates or run immediately?
      // For smoother resizing, maybe minimal debounce or RequestAnimationFrame
      requestAnimationFrame(() => zoomToFit());
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [contentWidth, contentHeight]);

  if (seats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-gray-500 bg-surface-dark">
        <p>No seats available in this section.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-surface-dark bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]"
    >
      <TransformWrapper
        ref={transformRef}
        key={canvasKey}
        initialScale={0.8}
        minScale={0.2}
        maxScale={4}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
          <div
            style={{ width: contentWidth, height: contentHeight }}
            className="relative bg-surface-dark shadow-sm origin-top-left"
          >
            {/* Background Image Layer */}
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt="Venue Map"
                className="absolute inset-0 w-full h-full object-contain opacity-30 pointer-events-none select-none"
              />
            )}

            {/* Interactive SVG Layer */}
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              {/* Stage Indicator */}
              <path
                d={`M ${contentWidth / 2 - VISUAL_CENTER_OFFSET - 400} 100 Q ${contentWidth / 2 - VISUAL_CENTER_OFFSET} 150 ${contentWidth / 2 - VISUAL_CENTER_OFFSET + 400} 100`}
                className="stroke-primary fill-none opacity-50"
                strokeWidth="4"
              />
              <text
                x={contentWidth / 2 - VISUAL_CENTER_OFFSET}
                y={80}
                textAnchor="middle"
                className="fill-gray-500 text-2xl font-bold uppercase tracking-[0.5em]"
              >
                Stage
              </text>
              <defs>
                <linearGradient id="screen-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M ${contentWidth / 2 - VISUAL_CENTER_OFFSET - 380} 110 Q ${contentWidth / 2 - VISUAL_CENTER_OFFSET} 160 ${contentWidth / 2 - VISUAL_CENTER_OFFSET + 380} 110 L ${contentWidth / 2 - VISUAL_CENTER_OFFSET + 450} 300 L ${contentWidth / 2 - VISUAL_CENTER_OFFSET - 450} 300 Z`}
                fill="url(#screen-glow)"
                className="opacity-50 pointer-events-none"
              />

              {processedSeats.map((seat) => (
                <Seat
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatIds.includes(seat.id)}
                  isDisabled={seat.status === 'BOOKED' || seat.status === 'LOCKED'}
                  onClick={onSeatClick}
                />
              ))}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 bg-surface-dark/95 backdrop-blur px-4 py-3 rounded-xl shadow-2xl border border-gray-700 text-xs font-medium flex gap-6 pointer-events-none z-10 select-none">
        <LegendItem color="border-gray-600 bg-[#24303d]" label="Available" />
        <LegendItem color="bg-primary border-primary shadow-lg shadow-primary/30" label="Selected" />
        <LegendItem color="bg-orange-500/20 border-orange-500 text-orange-400" label="Reserved" />
        <LegendItem color="bg-gray-800 border-gray-700" label="Sold" />
      </div>
    </div>
  );
});

SeatMapRenderer.displayName = 'SeatMapRenderer';

// Sub-component for Legend
const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={cn("w-4 h-4 rounded-md border", color)} />
    <span className="text-gray-400">{label}</span>
  </div>
);