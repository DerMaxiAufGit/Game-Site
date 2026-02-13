'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getNumberColor } from '@/lib/game/roulette/wheel';
import { getBetNumbers, type RouletteBetType } from '@/lib/game/roulette/bet-validator';
import type { RouletteBet } from '@/lib/game/roulette/state-machine';

interface BettingGridProps {
  onPlaceBet: (betType: RouletteBetType, numbers: number[], amount: number) => void;
  onRemoveBet: (index: number) => void;
  playerBets: RouletteBet[];
  allPlayerBets?: Map<string, RouletteBet[]>;
  disabled: boolean;
  chipValue: number;
  className?: string;
}

const CHIP_VALUES = [1, 5, 25, 100, 500];

// Real roulette table: 3 rows × 12 columns (horizontal / desktop)
// Row 1 (top):    3,  6,  9, 12, 15, 18, 21, 24, 27, 30, 33, 36
// Row 2 (middle): 2,  5,  8, 11, 14, 17, 20, 23, 26, 29, 32, 35
// Row 3 (bottom): 1,  4,  7, 10, 13, 16, 19, 22, 25, 28, 31, 34
const TABLE_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

// Vertical table: 12 rows × 3 columns (mobile)
// Transpose of horizontal: each row is [col3, col2, col1] numbers
const TABLE_VERTICAL = Array.from({ length: 12 }, (_, i) => [
  TABLE_ROWS[0][i],
  TABLE_ROWS[1][i],
  TABLE_ROWS[2][i],
]);

const cellBase =
  'border border-yellow-600/40 text-white font-bold flex items-center justify-center transition-all cursor-pointer select-none';
const cellDisabled = 'opacity-50 cursor-not-allowed';

export function BettingGrid({
  onPlaceBet,
  onRemoveBet,
  playerBets,
  allPlayerBets,
  disabled,
  chipValue: initialChipValue,
  className,
}: BettingGridProps) {
  const [selectedChipValue, setSelectedChipValue] = useState(initialChipValue || 5);

  const handleStraightBet = (num: number) => {
    if (disabled) return;
    onPlaceBet('straight', [num], selectedChipValue);
  };

  const handleOutsideBet = (betType: RouletteBetType) => {
    if (disabled) return;
    onPlaceBet(betType, [], selectedChipValue);
  };

  const handleDozenBet = (dozen: 1 | 2 | 3) => {
    if (disabled) return;
    const identifier = dozen === 1 ? '1st' : dozen === 2 ? '2nd' : '3rd';
    const numbers = getBetNumbers('dozen', identifier);
    onPlaceBet('dozen', numbers, selectedChipValue);
  };

  const handleColumnBet = (column: 1 | 2 | 3) => {
    if (disabled) return;
    const identifier = column === 1 ? '1st' : column === 2 ? '2nd' : '3rd';
    const numbers = getBetNumbers('column', identifier);
    onPlaceBet('column', numbers, selectedChipValue);
  };

  const hasBetOn = (num: number) =>
    playerBets.some((bet) => bet.type === 'straight' && bet.numbers.includes(num));

  const renderNumberCell = (num: number, heightClass: string) => {
    const color = getNumberColor(num);
    return (
      <button
        key={num}
        onClick={() => handleStraightBet(num)}
        disabled={disabled}
        className={cn(
          cellBase,
          `flex-1 ${heightClass} text-sm relative`,
          color === 'red' ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-900 hover:bg-gray-800',
          disabled && cellDisabled
        )}
      >
        {num}
        {hasBetOn(num) && (
          <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-yellow-600" />
        )}
      </button>
    );
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Chip selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-300">Chip:</span>
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setSelectedChipValue(value)}
            disabled={disabled}
            className={cn(
              'w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-lg transition-all',
              selectedChipValue === value
                ? 'ring-2 ring-yellow-400 scale-110'
                : 'opacity-70 hover:opacity-100',
              disabled && 'opacity-30 cursor-not-allowed',
              value === 1 && 'bg-gray-100 text-gray-700 border-gray-400',
              value === 5 && 'bg-red-500 text-white border-red-800',
              value === 25 && 'bg-green-500 text-white border-green-800',
              value === 100 && 'bg-gray-900 text-white border-gray-600',
              value === 500 && 'bg-purple-600 text-white border-purple-800'
            )}
          >
            {value}
          </button>
        ))}

        {/* Placed bets summary inline */}
        {playerBets.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{playerBets.length} Wetten</span>
            <span className="text-xs font-bold text-yellow-400">
              Total: {playerBets.reduce((sum, bet) => sum + bet.amount, 0)}
            </span>
          </div>
        )}
      </div>

      {/* ========== HORIZONTAL layout (desktop md+) ========== */}
      <div className="hidden md:block bg-green-800 border-2 border-yellow-600/50 rounded-lg p-1 w-full">
        <div className="flex">
          {/* Zero */}
          <button
            onClick={() => handleStraightBet(0)}
            disabled={disabled}
            className={cn(
              cellBase,
              'w-10 bg-green-600 hover:bg-green-500 text-lg font-bold rounded-l-md',
              disabled && cellDisabled
            )}
            style={{ minHeight: '100%' }}
          >
            0
          </button>

          {/* Number grid + column bets */}
          <div className="flex-1 flex flex-col">
            {/* 3 rows of numbers */}
            {TABLE_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((num) => renderNumberCell(num, 'h-10'))}
                {/* Column bet (2:1) at end of each row */}
                <button
                  onClick={() => handleColumnBet((3 - rowIndex) as 1 | 2 | 3)}
                  disabled={disabled}
                  className={cn(
                    cellBase,
                    'w-10 bg-green-800 hover:bg-green-700 text-[10px]',
                    disabled && cellDisabled
                  )}
                >
                  2:1
                </button>
              </div>
            ))}

            {/* Dozen bets row */}
            <div className="flex">
              {[1, 2, 3].map((dozen) => (
                <button
                  key={dozen}
                  onClick={() => handleDozenBet(dozen as 1 | 2 | 3)}
                  disabled={disabled}
                  className={cn(
                    cellBase,
                    'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs',
                    disabled && cellDisabled
                  )}
                  style={{ flex: '4 1 0' }}
                >
                  {dozen === 1 ? '1-12' : dozen === 2 ? '13-24' : '25-36'}
                </button>
              ))}
              <div className="w-10" />
            </div>

            {/* Outside bets row */}
            <div className="flex">
              <button onClick={() => handleOutsideBet('low')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
                1-18
              </button>
              <button onClick={() => handleOutsideBet('even')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
                Even
              </button>
              <button onClick={() => handleOutsideBet('red')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-red-700 hover:bg-red-600 text-xs', disabled && cellDisabled)}>
                ◆
              </button>
              <button onClick={() => handleOutsideBet('black')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-gray-900 hover:bg-gray-800 text-xs', disabled && cellDisabled)}>
                ◆
              </button>
              <button onClick={() => handleOutsideBet('odd')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
                Odd
              </button>
              <button onClick={() => handleOutsideBet('high')} disabled={disabled}
                className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
                19-36
              </button>
              <div className="w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== VERTICAL layout (mobile <md) ========== */}
      <div className="md:hidden bg-green-800 border-2 border-yellow-600/50 rounded-lg p-1 w-full">
        {/* Zero - full width at top */}
        <button
          onClick={() => handleStraightBet(0)}
          disabled={disabled}
          className={cn(
            cellBase,
            'w-full h-9 bg-green-600 hover:bg-green-500 text-lg font-bold rounded-t-md',
            disabled && cellDisabled
          )}
        >
          0
        </button>

        {/* Number grid: 12 rows × 3 columns */}
        {TABLE_VERTICAL.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((num) => renderNumberCell(num, 'h-9'))}
          </div>
        ))}

        {/* Column bets (2:1) - left=col3, mid=col2, right=col1 */}
        <div className="flex">
          <button onClick={() => handleColumnBet(3)} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-[10px]', disabled && cellDisabled)}>
            2:1
          </button>
          <button onClick={() => handleColumnBet(2)} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-[10px]', disabled && cellDisabled)}>
            2:1
          </button>
          <button onClick={() => handleColumnBet(1)} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-[10px]', disabled && cellDisabled)}>
            2:1
          </button>
        </div>

        {/* Dozen bets */}
        <div className="flex">
          {[1, 2, 3].map((dozen) => (
            <button
              key={dozen}
              onClick={() => handleDozenBet(dozen as 1 | 2 | 3)}
              disabled={disabled}
              className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}
            >
              {dozen === 1 ? '1-12' : dozen === 2 ? '13-24' : '25-36'}
            </button>
          ))}
        </div>

        {/* Outside bets - 2 rows of 3 for compact mobile */}
        <div className="flex">
          <button onClick={() => handleOutsideBet('low')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
            1-18
          </button>
          <button onClick={() => handleOutsideBet('even')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
            Even
          </button>
          <button onClick={() => handleOutsideBet('red')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-red-700 hover:bg-red-600 text-xs', disabled && cellDisabled)}>
            ◆
          </button>
        </div>
        <div className="flex">
          <button onClick={() => handleOutsideBet('black')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-gray-900 hover:bg-gray-800 text-xs rounded-bl-md', disabled && cellDisabled)}>
            ◆
          </button>
          <button onClick={() => handleOutsideBet('odd')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs', disabled && cellDisabled)}>
            Odd
          </button>
          <button onClick={() => handleOutsideBet('high')} disabled={disabled}
            className={cn(cellBase, 'flex-1 h-8 bg-green-800 hover:bg-green-700 text-xs rounded-br-md', disabled && cellDisabled)}>
            19-36
          </button>
        </div>
      </div>

      {/* Placed bets (compact) */}
      {playerBets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {playerBets.map((bet, index) => (
            <button
              key={index}
              onClick={() => onRemoveBet(index)}
              disabled={disabled}
              className={cn(
                'px-2 py-1 bg-gray-800 hover:bg-red-600 border border-gray-600 hover:border-red-400 rounded text-[10px] text-white transition-all',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {bet.type} ({bet.amount}) ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
