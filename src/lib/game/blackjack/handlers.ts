/**
 * Blackjack Socket.IO Handlers
 * Follows existing Kniffel pattern from server.js
 */

import type { Socket, Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import {
  applyBlackjackAction,
  dealerStep,
  type BlackjackGameState,
  type BlackjackPlayer,
  type PlayerHand,
} from './state-machine.js';
import { getBestValue } from './engine-wrapper.js';
import { calculatePayouts } from '../../wallet/payout.js';

interface RoomManager {
  getRoom: (roomId: string) => any;
}

interface BlackjackBetData {
  roomId: string;
  amount: number;
}

interface BlackjackActionData {
  roomId: string;
  action: 'hit' | 'stand' | 'double' | 'split' | 'insurance' | 'surrender';
  insuranceAmount?: number;
}

interface NextRoundData {
  roomId: string;
}

/**
 * Helper: Send system messages to room
 */
function sendSystemMessage(
  roomId: string,
  io: Server,
  content: string,
  roomManager: RoomManager
) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const message = {
    id: Math.random().toString(36).substring(7),
    roomId,
    userId: 'system',
    displayName: 'System',
    content,
    isSystem: true,
    timestamp: Date.now(),
  };

  room.chat = room.chat || [];
  room.chat.push(message);
  if (room.chat.length > 100) room.chat.shift();

  io.to(roomId).emit('chat:message', message);
}

/**
 * Helper: Emit balance updates
 */
function emitBalanceUpdate(
  io: Server,
  userId: string,
  newBalance: number,
  change: number,
  description: string
) {
  io.to(`user:${userId}`).emit('balance:updated', {
    newBalance,
    change,
    description,
  });
}

/**
 * Build Blackjack settlement: each player vs dealer
 */
function buildBlackjackSettlement(
  gameState: BlackjackGameState
): Array<{ userId: string; winAmount: number; displayName: string }> {
  const dealerValue = getBestValue(gameState.dealer.cards);
  const dealerBusted = dealerValue > 21;

  const settlements: Array<{ userId: string; winAmount: number; displayName: string }> = [];

  for (const player of gameState.players) {
    let totalWin = 0;

    for (const hand of player.hands) {
      if (hand.status === 'surrendered') {
        // Get half bet back
        totalWin += Math.floor(hand.bet / 2);
        continue;
      }

      if (hand.status === 'busted') {
        // Lose bet (already deducted)
        continue;
      }

      const playerValue = getBestValue(hand.cards);

      if (hand.status === 'blackjack' && !dealerBusted && dealerValue !== 21) {
        // Blackjack pays 3:2
        totalWin += hand.bet + Math.floor(hand.bet * 1.5);
      } else if (dealerBusted || playerValue > dealerValue) {
        // Win: get bet back + equal amount
        totalWin += hand.bet * 2;
      } else if (playerValue === dealerValue) {
        // Push: get bet back
        totalWin += hand.bet;
      }
      // else: lose (already deducted)
    }

    // Insurance payout
    if (player.insurance > 0 && dealerValue === 21) {
      totalWin += player.insurance * 3; // Insurance pays 2:1 (plus original back)
    }

    settlements.push({
      userId: player.userId,
      winAmount: totalWin,
      displayName: player.displayName,
    });
  }

  return settlements;
}

/**
 * Handle settlement and payouts for Blackjack
 */
async function handleBlackjackSettlement(
  room: any,
  roomId: string,
  gameState: BlackjackGameState,
  io: Server,
  prisma: PrismaClient
) {
  if (!room.isBetRoom) {
    // Free room: just show results
    return null;
  }

  try {
    // Get locked escrows
    const escrows = await prisma.betEscrow.findMany({
      where: { roomId, status: 'LOCKED' },
    });

    const totalPot = escrows.reduce((sum, e) => sum + e.amount, 0);

    // Build Blackjack-specific settlement
    const settlements = buildBlackjackSettlement(gameState);

    // Execute payouts in transaction
    await prisma.$transaction(
      async (tx) => {
        for (const settlement of settlements) {
          if (settlement.winAmount > 0) {
            const wallet = await tx.wallet.update({
              where: { userId: settlement.userId },
              data: { balance: { increment: settlement.winAmount } },
            });

            await tx.transaction.create({
              data: {
                type: 'GAME_WIN',
                amount: settlement.winAmount,
                userId: settlement.userId,
                description: `${room.name} gewonnen (Blackjack)`,
              },
            });

            // Emit balance update with actual new balance
            emitBalanceUpdate(
              io,
              settlement.userId,
              wallet.balance,
              settlement.winAmount,
              `${room.name} gewonnen`
            );
          }
        }

        // Release all escrows
        await tx.betEscrow.updateMany({
          where: { roomId, status: 'LOCKED' },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
          },
        });
      },
      {
        isolationLevel: 'Serializable',
        maxWait: 5000,
        timeout: 10000,
      }
    );

    // Build payout data for client
    const payoutData = settlements.map((s) => ({
      userId: s.userId,
      displayName: s.displayName,
      amount: s.winAmount,
      position: 0, // Not ranked in Blackjack
    }));

    return payoutData;
  } catch (error) {
    console.error('Blackjack payout error:', error);
    return null;
  }
}

/**
 * Register all Blackjack Socket.IO handlers
 */
export function registerBlackjackHandlers(
  socket: Socket,
  io: Server,
  roomManager: RoomManager,
  prisma: PrismaClient
) {
  /**
   * Handle bet placement
   */
  socket.on('blackjack:place-bet', async (data: BlackjackBetData, callback) => {
    const { roomId, amount } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'blackjack') {
      callback?.({ success: false, error: 'Not a blackjack game' });
      return;
    }

    const gameState = room.gameState as BlackjackGameState;

    if (!gameState || gameState.phase !== 'betting') {
      callback?.({ success: false, error: 'Not in betting phase' });
      return;
    }

    // For bet rooms: validate balance and debit wallet
    if (room.isBetRoom) {
      try {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: socket.data.userId },
        });

        if (!wallet || wallet.balance < amount) {
          callback?.({ success: false, error: 'Nicht genug Guthaben' });
          return;
        }

        if (wallet.frozenAt !== null) {
          callback?.({ success: false, error: 'Wallet ist eingefroren' });
          return;
        }

        await prisma.$transaction(
          async (tx) => {
            const current = await tx.wallet.findUnique({
              where: { userId: socket.data.userId },
            });
            if (!current || current.balance < amount) {
              throw new Error('Insufficient balance');
            }

            await tx.wallet.update({
              where: { userId: socket.data.userId },
              data: { balance: { decrement: amount } },
            });

            await tx.transaction.create({
              data: {
                type: 'BET_PLACED',
                amount,
                userId: socket.data.userId,
                description: 'Blackjack Einsatz',
              },
            });
          },
          { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 }
        );

        const updatedWallet = await prisma.wallet.findUnique({
          where: { userId: socket.data.userId },
        });
        if (updatedWallet) {
          emitBalanceUpdate(io, socket.data.userId, updatedWallet.balance, -amount, 'Blackjack Einsatz');
        }
      } catch (error) {
        console.error('Blackjack bet debit error:', error);
        callback?.({ success: false, error: 'Nicht genug Guthaben' });
        return;
      }
    }

    // Re-read gameState after awaits to avoid stale reference (another handler may have updated it)
    let currentGameState = (room.gameState as BlackjackGameState) || gameState;

    // Auto-add player if they're not in the game state (late-join edge case)
    if (!currentGameState.players.some((p) => p.userId === socket.data.userId)) {
      const addResult = applyBlackjackAction(currentGameState, {
        type: 'ADD_PLAYER',
        payload: { userId: socket.data.userId, displayName: socket.data.displayName },
      }, socket.data.userId);
      if (!(addResult instanceof Error)) {
        currentGameState = addResult;
        room.gameState = addResult;
      }
    }

    // Apply bet action
    const action = { type: 'PLACE_BET' as const, payload: { amount } };
    const result = applyBlackjackAction(currentGameState, action, socket.data.userId);

    if (result instanceof Error) {
      // Refund if state machine rejects
      if (room.isBetRoom) {
        try {
          await prisma.$transaction(
            async (tx) => {
              await tx.wallet.update({
                where: { userId: socket.data.userId },
                data: { balance: { increment: amount } },
              });
              await tx.transaction.create({
                data: {
                  type: 'BET_REFUND',
                  amount,
                  userId: socket.data.userId,
                  description: 'Blackjack Einsatz zurück (ungültig)',
                },
              });
            },
            { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 }
          );
          const refundedWallet = await prisma.wallet.findUnique({
            where: { userId: socket.data.userId },
          });
          if (refundedWallet) {
            emitBalanceUpdate(io, socket.data.userId, refundedWallet.balance, amount, 'Einsatz zurück');
          }
        } catch (refundError) {
          console.error('Blackjack bet refund error:', refundError);
        }
      }
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // Emit state update
    io.to(roomId).emit('game:state-update', { state: result, roomId });

    // If dealing phase started, emit card dealt animations
    if (result.phase === 'player_turn') {
      setTimeout(() => {
        io.to(roomId).emit('blackjack:cards-dealt');
      }, 100);
    }

    callback?.({ success: true });
  });

  /**
   * Handle player actions (hit, stand, double, split, insurance, surrender)
   */
  socket.on('blackjack:action', async (data: BlackjackActionData, callback) => {
    const { roomId, action, insuranceAmount } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'blackjack') {
      callback?.({ success: false, error: 'Not a blackjack game' });
      return;
    }

    const gameState = room.gameState as BlackjackGameState;

    if (!gameState) {
      callback?.({ success: false, error: 'Game not started' });
      return;
    }

    // Map string action to state machine action
    let stateAction: any;

    switch (action) {
      case 'hit':
        stateAction = { type: 'HIT' };
        break;
      case 'stand':
        stateAction = { type: 'STAND' };
        break;
      case 'double':
        stateAction = { type: 'DOUBLE' };
        break;
      case 'split':
        stateAction = { type: 'SPLIT' };
        break;
      case 'insurance':
        stateAction = { type: 'INSURANCE', payload: { amount: insuranceAmount || 0 } };
        break;
      case 'surrender':
        stateAction = { type: 'SURRENDER' };
        break;
      default:
        callback?.({ success: false, error: 'Invalid action' });
        return;
    }

    // For bet rooms: debit additional costs for double/split/insurance
    if (room.isBetRoom && (action === 'double' || action === 'split' || action === 'insurance')) {
      const player = gameState.players.find((p: BlackjackPlayer) => p.userId === socket.data.userId);
      if (!player) {
        callback?.({ success: false, error: 'Player not found' });
        return;
      }

      let extraCost = 0;
      if (action === 'double') {
        extraCost = player.hands[player.currentHandIndex]?.bet || 0;
      } else if (action === 'split') {
        extraCost = player.hands[player.currentHandIndex]?.bet || 0;
      } else if (action === 'insurance') {
        extraCost = insuranceAmount || 0;
      }

      if (extraCost > 0) {
        try {
          await prisma.$transaction(
            async (tx) => {
              const wallet = await tx.wallet.findUnique({
                where: { userId: socket.data.userId },
              });
              if (!wallet || wallet.balance < extraCost) {
                throw new Error('Insufficient balance');
              }
              await tx.wallet.update({
                where: { userId: socket.data.userId },
                data: { balance: { decrement: extraCost } },
              });
              await tx.transaction.create({
                data: {
                  type: 'BET_PLACED',
                  amount: extraCost,
                  userId: socket.data.userId,
                  description: `Blackjack ${action === 'double' ? 'Double' : action === 'split' ? 'Split' : 'Insurance'}`,
                },
              });
            },
            { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 }
          );

          const updatedWallet = await prisma.wallet.findUnique({
            where: { userId: socket.data.userId },
          });
          if (updatedWallet) {
            emitBalanceUpdate(io, socket.data.userId, updatedWallet.balance, -extraCost, `Blackjack ${action}`);
          }
        } catch (error) {
          callback?.({ success: false, error: 'Nicht genug Guthaben' });
          return;
        }
      }
    }

    // Apply action
    const result = applyBlackjackAction(gameState, stateAction, socket.data.userId);

    if (result instanceof Error) {
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // Emit state update
    io.to(roomId).emit('game:state-update', { state: result, roomId });

    // If dealer turn started, animate dealer cards one by one
    if (result.phase === 'dealer_turn' && gameState.phase !== 'dealer_turn') {
      // Emit reveal of hole card first
      io.to(roomId).emit('blackjack:dealer-reveal');

      // Step through dealer hits with delays
      const animateDealerTurn = async () => {
        let currentState = room.gameState as BlackjackGameState;
        const CARD_DELAY = 1200; // 1.2s between each card

        // Wait for reveal animation
        await new Promise(resolve => setTimeout(resolve, CARD_DELAY));

        // Step through dealer draws
        while (currentState.phase === 'dealer_turn') {
          const stepped = dealerStep(currentState);
          room.gameState = stepped;
          io.to(roomId).emit('game:state-update', { state: stepped, roomId });

          if (stepped.phase === 'settlement') {
            // Dealer done — handle settlement
            const payoutData = await handleBlackjackSettlement(
              room,
              roomId,
              stepped,
              io,
              prisma
            );

            room.gameState = { ...stepped, phase: 'round_end' as any };
            io.to(roomId).emit('game:state-update', { state: room.gameState, roomId });
            io.to(roomId).emit('blackjack:round-settled', { payouts: payoutData });
            break;
          }

          currentState = stepped;
          // Wait between cards
          await new Promise(resolve => setTimeout(resolve, CARD_DELAY));
        }
      };

      animateDealerTurn().catch(err => console.error('Dealer animation error:', err));
    }

    // Handle immediate settlement (all players busted — no dealer turn needed)
    if (result.phase === 'settlement' && gameState.phase !== 'dealer_turn') {
      const payoutData = await handleBlackjackSettlement(
        room,
        roomId,
        result,
        io,
        prisma
      );

      room.gameState = { ...result, phase: 'round_end' as any };
      io.to(roomId).emit('game:state-update', { state: room.gameState, roomId });
      io.to(roomId).emit('blackjack:round-settled', { payouts: payoutData });
    }

    callback?.({ success: true });
  });

  /**
   * Handle next round
   */
  socket.on('blackjack:next-round', async (data: NextRoundData, callback) => {
    const { roomId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'blackjack') {
      callback?.({ success: false, error: 'Not a blackjack game' });
      return;
    }

    const gameState = room.gameState as BlackjackGameState;

    if (!gameState || gameState.phase !== 'round_end') {
      callback?.({ success: false, error: 'Not in round_end phase' });
      return;
    }

    // Reset to betting phase
    const newState: BlackjackGameState = {
      ...gameState,
      phase: 'betting',
      dealer: {
        cards: [],
        hidden: true,
      },
      roundNumber: gameState.roundNumber + 1,
      currentPlayerIndex: 0,
      players: gameState.players.map(p => ({
        ...p,
        hands: [
          {
            cards: [],
            bet: 0,
            status: 'playing',
            isDoubled: false,
            isSplit: false,
          },
        ],
        currentHandIndex: 0,
        bet: 0,
        insurance: 0,
      })),
    };

    room.gameState = newState;

    io.to(roomId).emit('game:state-update', { state: newState, roomId });

    callback?.({ success: true });
  });
}
