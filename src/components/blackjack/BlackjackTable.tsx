'use client';

import { type Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { FeltTable } from '@/components/casino/FeltTable';
import { DealerHand } from './DealerHand';
import { PlayerHand } from './PlayerHand';
import { ActionButtons } from './ActionButtons';
import { CardBack } from '@/components/casino/CardBack';
import { ChipStack } from '@/components/casino/ChipStack';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { GameBalance } from '@/components/wallet/game-balance';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BlackjackGameState, PlayerHand as PlayerHandType } from '@/lib/game/blackjack/state-machine';

interface BlackjackTableProps {
  gameState: BlackjackGameState;
  roomId: string;
  currentUserId: string;
  socket: Socket;
  isBetRoom?: boolean;
  betAmount?: number;
}

export function BlackjackTable({
  gameState,
  roomId,
  currentUserId,
  socket,
  isBetRoom = false,
  betAmount = 0,
}: BlackjackTableProps) {
  const router = useRouter();
  const [localBet, setLocalBet] = useState(betAmount || 10);
  const currentPlayer = gameState.players.find(p => p.userId === currentUserId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.userId === currentUserId;

  // Calculate total pot for bet rooms
  const totalPot = isBetRoom
    ? gameState.players.reduce((sum, p) => sum + p.bet, 0)
    : 0;

  // Handle bet placement
  const handlePlaceBet = () => {
    socket.emit('blackjack:place-bet', { roomId, amount: localBet }, (response: any) => {
      if (!response?.success) {
        toast.error(response?.error || 'Einsatz konnte nicht platziert werden');
      }
    });
  };

  // Handle player action
  const handleAction = (action: string) => {
    const data: any = { roomId, action };

    if (action === 'insurance' && currentPlayer) {
      data.insuranceAmount = Math.floor(currentPlayer.bet / 2);
    }

    socket.emit('blackjack:action', data, (response: any) => {
      if (!response?.success) {
        toast.error(response?.error || 'Aktion fehlgeschlagen');
      }
    });
  };

  // Calculate available actions for current hand
  const getAvailableActions = (): string[] => {
    if (!isCurrentTurn || !currentPlayer || gameState.phase !== 'player_turn') {
      return [];
    }

    const hand = currentPlayer.hands[currentPlayer.currentHandIndex];
    if (!hand || hand.status !== 'playing') {
      return [];
    }

    const actions: string[] = ['hit', 'stand'];

    // Can double on initial 2 cards
    if (hand.cards.length === 2) {
      actions.push('double');
      actions.push('surrender');
    }

    // Can split pairs
    if (hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank) {
      actions.push('split');
    }

    // Insurance if dealer shows Ace
    if (gameState.dealer.cards[0]?.rank === 'A' && hand.cards.length === 2) {
      actions.push('insurance');
    }

    return actions;
  };

  // Settlement results
  const getHandResult = (hand: PlayerHandType): string | null => {
    if (gameState.phase !== 'round_end') return null;

    if (hand.status === 'busted') return 'Verloren';
    if (hand.status === 'surrendered') return 'Aufgegeben';
    if (hand.status === 'blackjack') return 'Blackjack!';

    // Compare with dealer
    const dealerValue = gameState.dealer.cards.reduce((sum, card) => {
      const val = card.rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(card.rank) ? 10 : parseInt(card.rank);
      return sum + val;
    }, 0);

    const handValue = hand.cards.reduce((sum, card) => {
      const val = card.rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(card.rank) ? 10 : parseInt(card.rank);
      return sum + val;
    }, 0);

    if (dealerValue > 21 || handValue > dealerValue) return 'Gewonnen';
    if (handValue === dealerValue) return 'Unentschieden';
    return 'Verloren';
  };

  const handleLeave = () => {
    socket.emit('room:leave', { roomId });
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        <h2 className="text-2xl font-bold text-yellow-400">Blackjack</h2>
        <div className="flex items-center gap-3">
          <GameBalance />
          <span className="text-sm text-gray-400">Runde {gameState.roundNumber}</span>
          {isBetRoom && totalPot > 0 && (
            <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full">
              <span className="text-yellow-400 text-sm font-bold">Pot:</span>
              <ChipStack amount={totalPot} size="sm" />
            </div>
          )}
          <Button
            onClick={handleLeave}
            variant="outline"
            size="sm"
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Verlassen
          </Button>
        </div>
      </div>

      {/* Main game area — fills remaining space */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <FeltTable className="w-full max-w-6xl mx-auto h-full">
          <div className="h-full flex gap-6">
            {/* Decorative card deck */}
            <div className="hidden md:flex flex-col items-center justify-center shrink-0">
              <div className="relative w-[70px] h-[98px]">
                <div className="absolute top-0 left-0"><CardBack size="sm" className="shadow-lg" /></div>
                <div className="absolute top-[2px] left-[2px]"><CardBack size="sm" className="shadow-lg" /></div>
                <div className="absolute top-[4px] left-[4px]"><CardBack size="sm" className="shadow-xl" /></div>
              </div>
              <span className="text-xs text-gray-400 mt-1">Stapel</span>
            </div>

            {/* Game content — vertical flex filling height */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
              {/* Dealer Section */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <h3 className="text-lg font-bold text-white">Dealer</h3>
                <DealerHand
                  cards={gameState.dealer.cards}
                  hidden={gameState.dealer.hidden}
                  handValue={0}
                  phase={gameState.phase}
                />
              </div>

              {/* Center: Betting or status */}
              <div className="flex items-center justify-center shrink-0">
                {gameState.phase === 'betting' && currentPlayer && currentPlayer.bet === 0 && (
                  <div className="flex flex-col items-center gap-3">
                    <h3 className="text-lg font-bold text-white">Einsatz setzen</h3>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={localBet}
                        onChange={(e) => setLocalBet(parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-28"
                      />
                      <Button onClick={handlePlaceBet}>Setzen</Button>
                    </div>
                  </div>
                )}
                {gameState.phase === 'round_end' && (
                  <Button
                    onClick={() => socket.emit('blackjack:next-round', { roomId })}
                    size="lg"
                    className="bg-green-600 hover:bg-green-500"
                  >
                    Nächste Runde
                  </Button>
                )}
              </div>

              {/* Player Hands Section — side by side at bottom */}
              <div className="shrink-0">
                <div className="flex flex-wrap justify-center gap-6">
                  {gameState.players.map((player) => {
                    const isThisPlayersTurn =
                      gameState.phase === 'player_turn' &&
                      player.userId === gameState.players[gameState.currentPlayerIndex]?.userId;

                    return (
                      <div key={player.userId} className="flex flex-col items-center gap-1">
                        <h4 className="text-sm font-semibold text-white text-center">
                          {player.displayName}
                          {player.userId === currentUserId && ' (Du)'}
                        </h4>
                        <div className="flex flex-wrap justify-center gap-3">
                          {player.hands.map((hand, handIndex) => {
                            const isActiveHand = isThisPlayersTurn && player.currentHandIndex === handIndex;
                            const isMyTurn = isActiveHand && player.userId === currentUserId;
                            const result = getHandResult(hand);

                            return (
                              <div key={handIndex} className="relative">
                                <PlayerHand
                                  hand={hand}
                                  isActive={isActiveHand}
                                  isMyTurn={isMyTurn}
                                  playerName={player.displayName}
                                  isCurrentUser={player.userId === currentUserId}
                                />
                                {result && (
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                    {result}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                {isCurrentTurn && currentPlayer && (
                  <div className="flex justify-center mt-3">
                    <ActionButtons
                      availableActions={getAvailableActions()}
                      onAction={handleAction}
                      disabled={false}
                      currentBet={currentPlayer.bet}
                      balance={0}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </FeltTable>
      </div>
    </div>
  );
}
