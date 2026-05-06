"use client";

import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatPrice } from '@/lib/utils';

interface EventCardProps {
  id: string;
  name: string;
  date: string | number | Date;
  imageUrl?: string | null;
  venue: {
    name: string;
    location: string;
  };
  minPrice?: number;
  className?: string;
}

const DEFAULT_EVENT_IMAGE = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2670&auto=format&fit=crop";

export function EventCard({
  id,
  name,
  date,
  imageUrl,
  venue,
  minPrice,
  className
}: EventCardProps) {
  // Determine display image: use provided URL if valid, otherwise default
  const displayImage = imageUrl && imageUrl.trim().length > 0 ? imageUrl : DEFAULT_EVENT_IMAGE;

  // Safe date formatting
  const formattedDate = (() => {
    try {
      const d = new Date(Number(date) || date);
      if (isNaN(d.getTime())) return 'Date TBA';
      return format(d, 'EEE, MMM d • h:mm a');
    } catch (e) {
      return 'Date TBA';
    }
  })();

  return (
    <Link href={`/events/${id}`} className={cn("group block h-full", className)}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full flex flex-col">
        {/* Image Container */}
        <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            // Add a simple error handler to fallback if the URL breaks
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
            }}
          />

          {/* Price Tag Overlay */}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
            {minPrice ? `From ${formatPrice(minPrice)}` : 'Tickets Available'}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          <div className="mt-auto space-y-2">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>

            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="truncate">{venue.name}, {venue.location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}