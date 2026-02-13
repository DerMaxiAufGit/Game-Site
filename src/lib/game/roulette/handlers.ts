/**
 * Roulette Socket.IO Handlers
 * Follows existing Blackjack pattern from blackjack/handlers.ts
 */

import type { Socket, Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import { randomInt } from 'node:crypto';
import {
  applyAction,
  startNextRound,
  calculatePlayerPayout,
  type RouletteGameState,
  type RouletteBet,
} from './state-machine.js';

interface RoomManager {
  getRoom: (roomId: string) => any;
}

interface RoulettePlaceBetData {
  roomId: string;
  betType: string;
  numbers: number[];
  amount: number;
}

interface RouletteRemoveBetData {
  roomId: string;
  betIndex: number;
}

interface RouletteSpinData {
  roomId: string;
}

interface RouletteNextRoundData {
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
 * Spin timer management
 */
const spinTimers = new Map<string, NodeJS.Timeout>(); // roomId -> timeout

export function startSpinTimer(
  roomId: string,
  io: Server,
  roomManager: RoomManager,
  prisma: PrismaClient
) {
  clearSpinTimer(roomId);
  const room = roomManager.getRoom(roomId);
  if (!room || !room.gameState || room.gameState.isManualSpin) return;

  const timeout = setTimeout(async () => {
    try {
      await autoSpin(roomId, io, roomManager, prisma);
    } catch (error) {
      console.error('Spin timer auto-spin error:', error);
    }
  }, room.gameState.spinTimerSec * 1000);

  spinTimers.set(roomId, timeout);
}

function clearSpinTimer(roomId: string) {
  const timer = spinTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    spinTimers.delete(roomId);
  }
}

/**
 * Auto-spin when timer expires
 */
async function autoSpin(
  roomId: string,
  io: Server,
  roomManager: RoomManager,
  prisma: PrismaClient
) {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.gameState) return;

  const gameState = room.gameState as RouletteGameState;
  if (gameState.phase !== 'betting') return;

  // Generate winning number using CSPRNG
  const winningNumber = randomInt(0, 37); // 0-36

  // Apply spin action
  const action = { type: 'SPIN' as const, winningNumber };
  const result = applyAction(gameState, action);

  if (result instanceof Error) {
    console.error('Auto-spin error:', result.message);
    return;
  }

  room.gameState = result;

  // Handle per-spin settlement for bet rooms
  await handleRouletteSpinSettlement(room, roomId, result, winningNumber, io, prisma);

  // Emit spin result
  io.to(roomId).emit('roulette:spin-result', {
    winningNumber,
    gameState: result,
  });

  io.to(roomId).emit('game:state-update', { state: result, roomId });
}

/**
 * Handle per-spin settlement for Roulette bet rooms
 * Debit already happened on bet placement; now credit winnings
 */
async function handleRouletteSpinSettlement(
  room: any,
  roomId: string,
  gameState: RouletteGameState,
  winningNumber: number,
  io: Server,
  prisma: PrismaClient
) {
  if (!room.isBetRoom) {
    return;
  }

  try {
    const playerPayouts: Array<{ userId: string; displayName: string; netResult: number }> = [];

    await prisma.$transaction(
      async (tx) => {
        for (const player of gameState.players) {
          const payout = calculatePlayerPayout(player, winningNumber);
          const totalBet = player.totalBetAmount;
          const netResult = payout - totalBet;

          playerPayouts.push({
            userId: player.userId,
            displayName: player.displayName,
            netResult,
          });

          // Credit payout (includes original bet back if won)
          if (payout > 0) {
            const wallet = await tx.wallet.update({
              where: { userId: player.userId },
              data: { balance: { increment: payout } },
            });

            await tx.transaction.create({
              data: {
                type: 'GAME_WIN',
                amount: payout,
                userId: player.userId,
                description: `Roulette Gewinn (${winningNumber})`,
              },
            });

            emitBalanceUpdate(io, player.userId, wallet.balance, payout, 'Roulette Gewinn');
          }
        }
      },
      {
        isolationLevel: 'Serializable',
        maxWait: 5000,
        timeout: 10000,
      }
    );

    io.to(roomId).emit('roulette:spin-settlement', { playerPayouts });

    sendSystemMessage(
      roomId,
      io,
      `Gewinnzahl: ${winningNumber}`,
      { getRoom: () => room } as RoomManager
    );
  } catch (error) {
    console.error('Roulette spin settlement error:', error);
  }
}

/**
 * Register all Roulette Socket.IO handlers
 */
export function registerRouletteHandlers(
  socket: Socket,
  io: Server,
  roomManager: RoomManager,
  prisma: PrismaClient
) {
  /**
   * Handle bet placement — debits wallet for bet rooms
   */
  socket.on('roulette:place-bet', async (data: RoulettePlaceBetData, callback) => {
    const { roomId, betType, numbers, amount } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'roulette') {
      callback?.({ success: false, error: 'Not a roulette game' });
      return;
    }

    const gameState = room.gameState as RouletteGameState;

    if (!gameState || gameState.phase !== 'betting') {
      callback?.({ success: false, error: 'Not in betting phase' });
      return;
    }

    // For bet rooms: validate balance and debit wallet BEFORE applying state
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
            // Re-check balance inside transaction for safety
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
                description: 'Roulette Einsatz',
              },
            });
          },
          {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 10000,
          }
        );

        // Emit balance update
        const updatedWallet = await prisma.wallet.findUnique({
          where: { userId: socket.data.userId },
        });
        if (updatedWallet) {
          emitBalanceUpdate(io, socket.data.userId, updatedWallet.balance, -amount, 'Roulette Einsatz');
        }
      } catch (error) {
        console.error('Roulette bet debit error:', error);
        callback?.({ success: false, error: 'Nicht genug Guthaben' });
        return;
      }
    }

    // Re-read gameState after awaits to avoid stale reference (another handler may have updated it)
    let currentGameState = (room.gameState as RouletteGameState) || gameState;

    // Auto-add player if they're not in the game state (late-join edge case)
    if (!currentGameState.players.some((p) => p.userId === socket.data.userId)) {
      const addResult = applyAction(currentGameState, {
        type: 'ADD_PLAYER',
        userId: socket.data.userId,
        displayName: socket.data.displayName,
      });
      if (!(addResult instanceof Error)) {
        currentGameState = addResult;
        room.gameState = addResult;
      }
    }

    // Apply bet action to state machine
    const bet: RouletteBet = {
      type: betType as any,
      numbers,
      amount,
    };

    const action = { type: 'PLACE_BET' as const, userId: socket.data.userId, bet };
    const result = applyAction(currentGameState, action);

    if (result instanceof Error) {
      // Refund the debit if state machine rejects the bet
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
                  description: 'Roulette Einsatz zurück (ungültig)',
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
          console.error('Roulette bet refund error:', refundError);
        }
      }
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // Emit state update
    io.to(roomId).emit('game:state-update', { state: result, roomId });

    callback?.({ success: true });
  });

  /**
   * Handle bet removal — credits wallet for bet rooms
   */
  socket.on('roulette:remove-bet', async (data: RouletteRemoveBetData, callback) => {
    const { roomId, betIndex } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'roulette') {
      callback?.({ success: false, error: 'Not a roulette game' });
      return;
    }

    const gameState = room.gameState as RouletteGameState;

    if (!gameState || gameState.phase !== 'betting') {
      callback?.({ success: false, error: 'Not in betting phase' });
      return;
    }

    // Get the bet amount BEFORE applying state change (bet gets removed)
    const player = gameState.players.find((p) => p.userId === socket.data.userId);
    const removedBet = player?.bets[betIndex];

    // Apply remove bet action
    const action = { type: 'REMOVE_BET' as const, userId: socket.data.userId, betIndex };
    const result = applyAction(gameState, action);

    if (result instanceof Error) {
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // For bet rooms: credit wallet with removed bet amount
    if (room.isBetRoom && removedBet) {
      try {
        const wallet = await prisma.$transaction(
          async (tx) => {
            const updated = await tx.wallet.update({
              where: { userId: socket.data.userId },
              data: { balance: { increment: removedBet.amount } },
            });

            await tx.transaction.create({
              data: {
                type: 'BET_REFUND',
                amount: removedBet.amount,
                userId: socket.data.userId,
                description: 'Roulette Einsatz zurück',
              },
            });

            return updated;
          },
          { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 }
        );

        emitBalanceUpdate(io, socket.data.userId, wallet.balance, removedBet.amount, 'Einsatz zurück');
      } catch (error) {
        console.error('Roulette bet refund error:', error);
      }
    }

    // Emit state update
    io.to(roomId).emit('game:state-update', { state: result, roomId });

    callback?.({ success: true });
  });

  /**
   * Handle spin (manual trigger by host or auto via timer)
   */
  socket.on('roulette:spin', async (data: RouletteSpinData, callback) => {
    const { roomId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'roulette') {
      callback?.({ success: false, error: 'Not a roulette game' });
      return;
    }

    // Only host can manually trigger spin
    if (room.hostId !== socket.data.userId) {
      callback?.({ success: false, error: 'Only host can spin' });
      return;
    }

    const gameState = room.gameState as RouletteGameState;

    if (!gameState || gameState.phase !== 'betting') {
      callback?.({ success: false, error: 'Not in betting phase' });
      return;
    }

    // Clear any pending spin timer
    clearSpinTimer(roomId);

    // Generate winning number using CSPRNG
    const winningNumber = randomInt(0, 37); // 0-36

    // Apply spin action
    const action = { type: 'SPIN' as const, winningNumber };
    const result = applyAction(gameState, action);

    if (result instanceof Error) {
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // Handle per-spin settlement for bet rooms
    await handleRouletteSpinSettlement(room, roomId, result, winningNumber, io, prisma);

    // Emit spin result
    io.to(roomId).emit('roulette:spin-result', {
      winningNumber,
      gameState: result,
    });

    io.to(roomId).emit('game:state-update', { state: result, roomId });

    callback?.({ success: true });
  });

  /**
   * Handle next round
   */
  socket.on('roulette:next-round', async (data: RouletteNextRoundData, callback) => {
    const { roomId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.gameType !== 'roulette') {
      callback?.({ success: false, error: 'Not a roulette game' });
      return;
    }

    const gameState = room.gameState as RouletteGameState;

    if (!gameState || gameState.phase !== 'settlement') {
      callback?.({ success: false, error: 'Not in settlement phase' });
      return;
    }

    // Start next round
    const result = startNextRound(gameState);

    if (result instanceof Error) {
      callback?.({ success: false, error: result.message });
      return;
    }

    room.gameState = result;

    // Start spin timer if enabled
    if (!result.isManualSpin && result.spinTimerSec > 0) {
      startSpinTimer(roomId, io, roomManager, prisma);
    }

    io.to(roomId).emit('game:state-update', { state: result, roomId });

    callback?.({ success: true });
  });
}
