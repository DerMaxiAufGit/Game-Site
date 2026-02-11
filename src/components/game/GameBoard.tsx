'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { Socket } from 'socket.io-client'
import dynamic from 'next/dynamic'
import { PlayerList } from './PlayerList'
import { Scoresheet } from './Scoresheet'
import { TurnTimer } from './TurnTimer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { GameState, ScoreCategory } from '@/types/game'

// Dynamically import DiceScene to prevent SSR issues
const DiceScene = dynamic(
  () => import('@/components/3d/DiceScene').then(m => ({ default: m.DiceScene })),
  { ssr: false }
)

interface GameBoardProps {
  gameState: GameState
  roomId: string
  currentUserId: string
  socket: Socket
}

export function GameBoard({ gameState, roomId, currentUserId, socket }: GameBoardProps) {
  const t = useTranslations()
  const [isAnimating, setIsAnimating] = useState(false)
  const [localGameState, setLocalGameState] = useState(gameState)
  const prevDiceRef = useRef(gameState.dice)

  // Update local game state when props change
  useEffect(() => {
    setLocalGameState(gameState)

    // Check if dice values changed (indicates a new roll from server)
    const diceChanged = gameState.dice.some((val, idx) => val !== prevDiceRef.current[idx])
    if (diceChanged && gameState.rollsRemaining < 3) {
      setIsAnimating(true)
    }
    prevDiceRef.current = gameState.dice
  }, [gameState])

  // Listen for game state updates
  useEffect(() => {
    const handleGameStateUpdate = (data: { state: GameState; roomId: string }) => {
      if (data.roomId === roomId) {
        setLocalGameState(data.state)

        // Check if dice changed
        const diceChanged = data.state.dice.some((val, idx) => val !== prevDiceRef.current[idx])
        if (diceChanged && data.state.rollsRemaining < 3) {
          setIsAnimating(true)
        }
        prevDiceRef.current = data.state.dice
      }
    }

    const handleGameError = (data: { message: string }) => {
      console.error('Game error:', data.message)
      // Could show toast here
    }

    socket.on('game:state-update', handleGameStateUpdate)
    socket.on('game:error', handleGameError)

    return () => {
      socket.off('game:state-update', handleGameStateUpdate)
      socket.off('game:error', handleGameError)
    }
  }, [socket, roomId])

  const currentPlayer = localGameState.players[localGameState.currentPlayerIndex]
  const isMyTurn = currentPlayer?.userId === currentUserId

  const handleRollDice = () => {
    if (!isMyTurn || localGameState.rollsRemaining === 0 || isAnimating) return

    socket.emit('game:roll-dice', {
      roomId,
      keptDice: localGameState.keptDice
    })
  }

  const handleDieClick = (index: number) => {
    if (!isMyTurn || localGameState.rollsRemaining === 3 || isAnimating) return

    const newKeptDice = [...localGameState.keptDice]
    newKeptDice[index] = !newKeptDice[index]

    // Update local state optimistically (server will confirm)
    setLocalGameState(prev => ({ ...prev, keptDice: newKeptDice }))
  }

  const handleSelectCategory = (category: ScoreCategory) => {
    if (!isMyTurn || localGameState.rollsRemaining === 3 || isAnimating) return

    socket.emit('game:choose-category', {
      roomId,
      category
    })
  }

  const handleRollComplete = () => {
    setIsAnimating(false)
  }

  const canRoll = isMyTurn && localGameState.rollsRemaining > 0 && !isAnimating
  const canScore = isMyTurn && localGameState.rollsRemaining < 3 && !isAnimating

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Top Bar: Player List */}
      <div className="border-b border-gray-700 p-4">
        <PlayerList
          players={localGameState.players}
          currentPlayerIndex={localGameState.currentPlayerIndex}
          currentUserId={currentUserId}
          spectatorCount={localGameState.spectators.length}
        />
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Left: Dice Scene (~60% on desktop) */}
        <div className="flex flex-1 flex-col gap-4 lg:w-3/5">
          <Card className="flex-1 overflow-hidden border-gray-700 bg-gray-800/50">
            <div className="h-full min-h-[400px]">
              <DiceScene
                dice={localGameState.dice}
                keptDice={localGameState.keptDice}
                isRolling={isAnimating}
                onDieClick={handleDieClick}
                onRollComplete={handleRollComplete}
                disabled={!isMyTurn || localGameState.rollsRemaining === 3}
                canKeep={isMyTurn && localGameState.rollsRemaining < 3}
              />
            </div>
          </Card>

          {/* Game Info & Actions */}
          <Card className="border-gray-700 bg-gray-800/50 p-4">
            <div className="space-y-3">
              {/* Turn Status */}
              <div className="text-center">
                {isMyTurn ? (
                  <p className="text-lg font-bold text-green-400">
                    {t('game.yourTurn')}
                  </p>
                ) : (
                  <p className="text-lg text-gray-400">
                    {t('game.waitingForPlayer', {
                      name: currentPlayer?.displayName || ''
                    })}
                  </p>
                )}
              </div>

              {/* Round & Rolls Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {t('game.round', {
                    current: localGameState.round,
                    total: 13
                  })}
                </span>
                <span className={`font-semibold ${
                  localGameState.rollsRemaining > 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {localGameState.rollsRemaining > 0
                    ? t('game.rollsRemaining', { count: localGameState.rollsRemaining })
                    : t('game.noRollsLeft')
                  }
                </span>
              </div>

              {/* Roll Button */}
              <Button
                onClick={handleRollDice}
                disabled={!canRoll}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {t('game.roll')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Scoresheet (~40% on desktop) */}
        <div className="lg:w-2/5">
          <Scoresheet
            players={localGameState.players}
            currentPlayerIndex={localGameState.currentPlayerIndex}
            currentUserId={currentUserId}
            dice={localGameState.dice}
            rollsRemaining={localGameState.rollsRemaining}
            onSelectCategory={handleSelectCategory}
            canScore={canScore}
          />
        </div>
      </div>

      {/* Bottom: Turn Timer */}
      <div className="border-t border-gray-700 p-4">
        <TurnTimer
          startedAt={localGameState.turnStartedAt}
          duration={localGameState.turnDuration}
          isCurrentPlayer={isMyTurn}
        />
      </div>
    </div>
  )
}
