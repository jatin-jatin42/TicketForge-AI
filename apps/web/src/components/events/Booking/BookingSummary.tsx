'use client';

import React from 'react';
import { SeatData } from './SeatMapRenderer';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer'; // Provided in your initial file list

interface BookingSummaryProps {
  selectedSeats: SeatData[];
  onCheckout: () => void;
  isProcessing: boolean;
  lockExpiryTime: number | null; // Timestamp
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedSeats,
  onCheckout,
  isProcessing,
  lockExpiryTime
}) => {
  const totalPrice = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);

  // Use the timer hook if we have an expiry time
  const { formattedTime, isExpired } = useTimer(lockExpiryTime ? new Date(lockExpiryTime) : null);

  if (selectedSeats.length === 0) {
    return (
      <div className="p-6 text-center h-full flex flex-col items-center justify-center text-gray-500">
        <div className="bg-surface-light/5 p-4 rounded-full mb-4">
          <Clock size={24} className="text-gray-600 opacity-50" />
        </div>
        <h3 className="font-semibold text-gray-300">Your Selection</h3>
        <p className="text-sm mt-2 max-w-[200px]">Select seats on the map to proceed with booking.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-dark">
      {/* Header - Pinned Top */}
      <div className="p-6 pb-0 flex-shrink-0 z-10 bg-surface-dark">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-white">Your Cart</h3>
          {lockExpiryTime && !isExpired && (
            <div className="flex items-center text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-md text-sm font-medium border border-orange-500/20 shadow-sm">
              <Clock size={14} className="mr-2" />
              {formattedTime}
            </div>
          )}
        </div>
        <div className="h-px w-full bg-gray-800 mb-2"></div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar min-h-0">
        <div className="space-y-3">
          {selectedSeats.map((seat) => (
            <div key={seat.id} className="flex justify-between items-center text-sm py-3 border-b border-gray-800/50 last:border-0 group hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors">
              <div>
                <span className="font-medium text-gray-200 group-hover:text-white transition-colors">Seat {seat.label}</span>
                <div className="text-xs text-gray-500 mt-0.5">General Admission</div>
              </div>
              <span className="text-primary font-medium">{formatPrice(seat.price || 0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Pinned Bottom */}
      <div className="p-6 pt-4 flex-shrink-0 bg-surface-dark border-t border-gray-800 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between font-bold text-xl text-white mb-4">
          <span>Total</span>
          <span data-testid="total-price">{formatPrice(totalPrice)}</span>
        </div>

        <Button
          className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
          onClick={onCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Checkout Now'}
        </Button>
        <p className="text-[10px] text-center text-gray-600 uppercase tracking-wider font-medium mt-4">
          Powered by TicketForge Secure
        </p>
      </div>
    </div>
  );
};