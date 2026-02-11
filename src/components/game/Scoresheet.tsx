'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { PlayerState, DiceValues, ScoreCategory } from '@/types/game'
import { calculateScore, calculateUpperBonus, calculateTotalScore } from '@/lib/game/kniffel-rules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ScoresheetProps {
  players: PlayerState[]
  currentPlayerIndex: number
  currentUserId: string
  dice: DiceValues
  rollsRemaining: number
  onSelectCategory: (category: ScoreCategory) => void
  canScore: boolean
}

type ViewMode = 'compact' | 'full'

export function Scoresheet({
  players,
  currentPlayerIndex,
  currentUserId,
  dice,
  rollsRemaining,
  onSelectCategory,
  canScore
}: ScoresheetProps) {
  const t = useTranslations('scoresheet')
  const [viewMode, setViewMode] = useState<ViewMode>('full')

  const currentPlayer = players.find(p => p.userId === currentUserId)
  const isCurrentTurn = players[currentPlayerIndex]?.userId === currentUserId

  // Upper section categories
  const upperCategories: ScoreCategory[] = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'
  ]

  // Lower section categories
  const lowerCategories: ScoreCategory[] = [
    'threeOfKind', 'fourOfKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'kniffel', 'chance'
  ]

  const renderCategoryRow = (
    category: ScoreCategory,
    player: PlayerState,
    showPotential = false
  ) => {
    const scored = player.scoresheet[category]
    const isAvailable = scored === undefined
    const potentialScore = showPotential && isAvailable && rollsRemaining < 3
      ? calculateScore(category, dice)
      : null
    const isClickable = showPotential && canScore && isAvailable

    return (
      <TableRow
        key={category}
        className={`${
          isClickable
            ? 'cursor-pointer bg-green-600/10 hover:bg-green-600/20'
            : ''
        }`}
        onClick={() => isClickable && onSelectCategory(category)}
      >
        <TableCell className="font-medium text-white">
          {t(category)}
        </TableCell>
        <TableCell className="text-center">
          {scored !== undefined ? (
            <span className="font-semibold text-white">{scored}</span>
          ) : potentialScore !== null ? (
            <span className="font-semibold text-green-400">({potentialScore})</span>
          ) : (
            <span className="text-gray-600">-</span>
          )}
        </TableCell>
      </TableRow>
    )
  }

  const renderFullTable = () => {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Kategorie</TableHead>
              {players.map((player) => (
                <TableHead
                  key={player.userId}
                  className={`text-center ${
                    player.userId === currentUserId ? 'text-green-400' : 'text-gray-300'
                  }`}
                >
                  {player.displayName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Upper Section */}
            {upperCategories.map((category) => (
              <TableRow
                key={category}
                className={
                  isCurrentTurn &&
                  canScore &&
                  currentPlayer?.scoresheet[category] === undefined
                    ? 'cursor-pointer bg-green-600/10 hover:bg-green-600/20'
                    : ''
                }
                onClick={() => {
                  if (
                    isCurrentTurn &&
                    canScore &&
                    currentPlayer?.scoresheet[category] === undefined
                  ) {
                    onSelectCategory(category)
                  }
                }}
              >
                <TableCell className="font-medium text-white">
                  {t(category)}
                </TableCell>
                {players.map((player) => {
                  const scored = player.scoresheet[category]
                  const isAvailable = scored === undefined
                  const showPotential =
                    player.userId === currentUserId &&
                    isCurrentTurn &&
                    rollsRemaining < 3
                  const potentialScore = showPotential && isAvailable
                    ? calculateScore(category, dice)
                    : null

                  return (
                    <TableCell key={player.userId} className="text-center">
                      {scored !== undefined ? (
                        <span className="font-semibold text-white">{scored}</span>
                      ) : potentialScore !== null ? (
                        <span className="font-semibold text-green-400">
                          ({potentialScore})
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}

            {/* Upper Bonus */}
            <TableRow className="border-t-2 border-gray-700 bg-gray-900/30">
              <TableCell className="font-semibold text-white">
                {t('upperBonus')}
              </TableCell>
              {players.map((player) => {
                const bonus = calculateUpperBonus(player.scoresheet)
                return (
                  <TableCell key={player.userId} className="text-center">
                    <span className="font-semibold text-yellow-400">
                      {bonus}
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Upper Total */}
            <TableRow className="border-b-2 border-gray-700 bg-gray-900/50">
              <TableCell className="font-bold text-white">
                {t('upperTotal')}
              </TableCell>
              {players.map((player) => {
                const upperSum = upperCategories.reduce(
                  (sum, cat) => sum + (player.scoresheet[cat] ?? 0),
                  0
                )
                const bonus = calculateUpperBonus(player.scoresheet)
                return (
                  <TableCell key={player.userId} className="text-center">
                    <span className="font-bold text-white">
                      {upperSum + bonus}
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Lower Section */}
            {lowerCategories.map((category) => (
              <TableRow
                key={category}
                className={
                  isCurrentTurn &&
                  canScore &&
                  currentPlayer?.scoresheet[category] === undefined
                    ? 'cursor-pointer bg-green-600/10 hover:bg-green-600/20'
                    : ''
                }
                onClick={() => {
                  if (
                    isCurrentTurn &&
                    canScore &&
                    currentPlayer?.scoresheet[category] === undefined
                  ) {
                    onSelectCategory(category)
                  }
                }}
              >
                <TableCell className="font-medium text-white">
                  {t(category)}
                </TableCell>
                {players.map((player) => {
                  const scored = player.scoresheet[category]
                  const isAvailable = scored === undefined
                  const showPotential =
                    player.userId === currentUserId &&
                    isCurrentTurn &&
                    rollsRemaining < 3
                  const potentialScore = showPotential && isAvailable
                    ? calculateScore(category, dice)
                    : null

                  return (
                    <TableCell key={player.userId} className="text-center">
                      {scored !== undefined ? (
                        <span className="font-semibold text-white">{scored}</span>
                      ) : potentialScore !== null ? (
                        <span className="font-semibold text-green-400">
                          ({potentialScore})
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}

            {/* Lower Total */}
            <TableRow className="border-t-2 border-gray-700 bg-gray-900/30">
              <TableCell className="font-bold text-white">
                {t('lowerTotal')}
              </TableCell>
              {players.map((player) => {
                const lowerSum = lowerCategories.reduce(
                  (sum, cat) => sum + (player.scoresheet[cat] ?? 0),
                  0
                )
                return (
                  <TableCell key={player.userId} className="text-center">
                    <span className="font-bold text-white">{lowerSum}</span>
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Grand Total */}
            <TableRow className="border-t-2 border-gray-700 bg-gray-900/50">
              <TableCell className="font-bold text-white">
                {t('grandTotal')}
              </TableCell>
              {players.map((player) => {
                const total = calculateTotalScore(player.scoresheet)
                return (
                  <TableCell key={player.userId} className="text-center">
                    <span className="text-lg font-bold text-green-400">
                      {total}
                    </span>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderCompactView = () => {
    if (!currentPlayer) return null

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">Kategorie</TableHead>
            <TableHead className="text-center text-gray-300">Punkte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Upper Section */}
          {upperCategories.map((category) =>
            renderCategoryRow(category, currentPlayer, isCurrentTurn)
          )}

          {/* Upper Bonus */}
          <TableRow className="border-t-2 border-gray-700 bg-gray-900/30">
            <TableCell className="font-semibold text-white">
              {t('upperBonus')}
            </TableCell>
            <TableCell className="text-center">
              <span className="font-semibold text-yellow-400">
                {calculateUpperBonus(currentPlayer.scoresheet)}
              </span>
            </TableCell>
          </TableRow>

          {/* Upper Total */}
          <TableRow className="border-b-2 border-gray-700 bg-gray-900/50">
            <TableCell className="font-bold text-white">
              {t('upperTotal')}
            </TableCell>
            <TableCell className="text-center">
              <span className="font-bold text-white">
                {upperCategories.reduce(
                  (sum, cat) => sum + (currentPlayer.scoresheet[cat] ?? 0),
                  0
                ) + calculateUpperBonus(currentPlayer.scoresheet)}
              </span>
            </TableCell>
          </TableRow>

          {/* Lower Section */}
          {lowerCategories.map((category) =>
            renderCategoryRow(category, currentPlayer, isCurrentTurn)
          )}

          {/* Lower Total */}
          <TableRow className="border-t-2 border-gray-700 bg-gray-900/30">
            <TableCell className="font-bold text-white">
              {t('lowerTotal')}
            </TableCell>
            <TableCell className="text-center">
              <span className="font-bold text-white">
                {lowerCategories.reduce(
                  (sum, cat) => sum + (currentPlayer.scoresheet[cat] ?? 0),
                  0
                )}
              </span>
            </TableCell>
          </TableRow>

          {/* Grand Total */}
          <TableRow className="border-t-2 border-gray-700 bg-gray-900/50">
            <TableCell className="font-bold text-white">
              {t('grandTotal')}
            </TableCell>
            <TableCell className="text-center">
              <span className="text-lg font-bold text-green-400">
                {calculateTotalScore(currentPlayer.scoresheet)}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  return (
    <Card className="flex h-full flex-col border-gray-700 bg-gray-800/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-white">Wertungsblatt</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compact')}
            className={
              viewMode === 'compact'
                ? 'bg-green-600'
                : 'border-gray-600 text-gray-300'
            }
          >
            {t('compact')}
          </Button>
          <Button
            variant={viewMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('full')}
            className={
              viewMode === 'full'
                ? 'bg-green-600'
                : 'border-gray-600 text-gray-300'
            }
          >
            {t('fullTable')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {viewMode === 'full' ? renderFullTable() : renderCompactView()}
      </CardContent>
    </Card>
  )
}
