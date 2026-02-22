'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string | Date;
  label?: string;
  compact?: boolean;
}

export default function CountdownTimer({ endDate, label = 'Offer ends in', compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) { setExpired(true); return; }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return null;

  const urgent = timeLeft.days === 0 && timeLeft.hours < 6;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${urgent ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
        <Timer className="h-3 w-3" />
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 border ${urgent ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
      <p className={`text-xs font-medium mb-2 flex items-center gap-1 ${urgent ? 'text-red-500' : 'text-orange-500'}`}>
        <Timer className="h-3.5 w-3.5" />{label}
      </p>
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>{timeLeft.days}</div>
            <div className="text-[10px] text-gray-500">DAYS</div>
          </div>
        )}
        <div className="text-center">
          <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-500">HRS</div>
        </div>
        <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>:</div>
        <div className="text-center">
          <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-500">MIN</div>
        </div>
        <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>:</div>
        <div className="text-center">
          <div className={`text-lg font-bold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-500">SEC</div>
        </div>
      </div>
    </div>
  );
}
