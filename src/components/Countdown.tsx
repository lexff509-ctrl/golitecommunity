"use client";

import { useState, useEffect } from "react";

type Props = {
  targetDate: string;
  title: string;
  message?: string | null;
  compact?: boolean;
};

export default function Countdown({ targetDate, title, message, compact }: Props) {
  const getTimeLeft = (value: string) => {
    const parsedTarget = new Date(value).getTime();
    if (Number.isNaN(parsedTarget)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    const diff = parsedTarget - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate || Number.isNaN(new Date(targetDate).getTime())) {
    return null;
  }

  const blocks = [
    { val: timeLeft.days, label: "Jours" },
    { val: timeLeft.hours, label: "Heures" },
    { val: timeLeft.minutes, label: "Minutes" },
    { val: timeLeft.seconds, label: "Secondes" },
  ];

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-4 text-white">
        <p className="text-xs font-medium opacity-90 mb-2">{title}</p>
        {timeLeft.expired ? (
          <p className="text-lg font-bold">🎉 Programme lancé !</p>
        ) : (
          <div className="flex gap-3">
            {blocks.map((b) => (
              <div key={b.label} className="text-center">
                <div className="text-2xl font-extrabold">{b.val}</div>
                <div className="text-[10px] opacity-80 uppercase">{b.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500 via-blue-500 to-green-600 rounded-3xl p-8 text-white text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative">
        <p className="text-sm font-medium opacity-90 mb-2 uppercase tracking-wider">{title}</p>
        {message && <p className="text-sm opacity-80 mb-6">{message}</p>}
        {timeLeft.expired ? (
          <div>
            <p className="text-3xl font-extrabold mb-2">🎉</p>
            <p className="text-xl font-bold">Programme lancé !</p>
          </div>
        ) : (
          <div className="flex justify-center gap-4 sm:gap-6">
            {blocks.map((b) => (
              <div key={b.label} className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-4 min-w-[70px]">
                <div className="text-3xl sm:text-5xl font-extrabold">{String(b.val).padStart(2, "0")}</div>
                <div className="text-xs opacity-80 mt-1 uppercase">{b.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
