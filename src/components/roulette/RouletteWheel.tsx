'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { EUROPEAN_WHEEL_ORDER, getNumberColor } from '@/lib/game/roulette/wheel';

interface RouletteWheelProps {
  winningNumber?: number;
  isSpinning: boolean;
  onSpinComplete?: () => void;
  className?: string;
}

export function RouletteWheel({
  winningNumber,
  isSpinning,
  onSpinComplete,
  className,
}: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    if (isSpinning && winningNumber !== undefined) {
      setHasSpun(true);

      // Calculate target rotation so winning segment center aligns with top indicator.
      // In the SVG, segment at index N has its center at angle:
      //   (N + 0.5) * (360/37) degrees clockwise from the top.
      // CSS rotate(R) rotates clockwise by R degrees.
      // To bring segment N back to the top: rotate by 360 - (N + 0.5) * segmentAngle.
      const wheelOrder = [...EUROPEAN_WHEEL_ORDER] as number[];
      const winningIndex = wheelOrder.indexOf(winningNumber);
      const segmentAngle = 360 / 37;

      // Target remainder: the final rotation mod 360 that puts the segment under the indicator
      const targetRemainder = ((360 - (winningIndex + 0.5) * segmentAngle) % 360 + 360) % 360;

      // Ensure at least 5 full forward spins from current position
      const minSpins = 5 + Math.random() * 3;
      const minFinalRotation = rotation + minSpins * 360;

      // Find next rotation >= minFinalRotation with the correct remainder
      const currentRemainder = minFinalRotation % 360;
      let adjustment = targetRemainder - currentRemainder;
      if (adjustment < 0) adjustment += 360;
      const finalRotation = minFinalRotation + adjustment;

      setRotation(finalRotation);

      // Complete animation after 4 seconds
      const timeout = setTimeout(() => {
        onSpinComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  // Reset tracking
  useEffect(() => {
    if (!isSpinning && hasSpun) {
      setHasSpun(false);
    }
  }, [isSpinning, hasSpun]);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer wheel rim */}
      <div className="absolute inset-0 rounded-full border-8 border-amber-900 shadow-2xl bg-gradient-to-br from-amber-800 to-amber-950" />

      {/* Fixed indicator at top */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-yellow-400 drop-shadow-lg" />
      </div>

      {/* Wheel with numbers */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        }}
      >
        {EUROPEAN_WHEEL_ORDER.map((num, index) => {
          const angle = (index * 360) / 37 - 90; // Start at top
          const nextAngle = ((index + 1) * 360) / 37 - 90;

          const x1 = 200 + 180 * Math.cos((angle * Math.PI) / 180);
          const y1 = 200 + 180 * Math.sin((angle * Math.PI) / 180);
          const x2 = 200 + 180 * Math.cos((nextAngle * Math.PI) / 180);
          const y2 = 200 + 180 * Math.sin((nextAngle * Math.PI) / 180);

          const color = getNumberColor(num);
          const fillColor =
            color === 'green' ? '#10b981' : color === 'red' ? '#dc2626' : '#1a1a1a';

          // Text position (70% radius)
          const textAngle = (angle + nextAngle) / 2;
          const textX = 200 + 130 * Math.cos((textAngle * Math.PI) / 180);
          const textY = 200 + 130 * Math.sin((textAngle * Math.PI) / 180);

          return (
            <g key={num}>
              {/* Segment */}
              <path
                d={`M 200 200 L ${x1} ${y1} A 180 180 0 0 1 ${x2} ${y2} Z`}
                fill={fillColor}
                stroke="#d97706"
                strokeWidth="0.5"
              />
              {/* Number */}
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
              >
                {num}
              </text>
            </g>
          );
        })}

        {/* Outer ring decoration */}
        <circle cx="200" cy="200" r="180" fill="none" stroke="#d97706" strokeWidth="2" />
        <circle cx="200" cy="200" r="80" fill="none" stroke="#d97706" strokeWidth="1" />

        {/* Center hub */}
        <circle cx="200" cy="200" r="40" fill="#fbbf24" stroke="#d97706" strokeWidth="4" />
      </svg>

      {/* Center result display (after spin completes) */}
      {!isSpinning && winningNumber !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-yellow-400 text-gray-900 font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-600 animate-pulse">
            {winningNumber}
          </div>
        </div>
      )}
    </div>
  );
}
