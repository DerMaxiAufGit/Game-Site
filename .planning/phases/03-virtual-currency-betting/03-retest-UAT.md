---
status: complete
phase: 03-virtual-currency-betting
source: 03-13-SUMMARY.md, 03-14-SUMMARY.md, 03-15-SUMMARY.md
started: 2026-02-13T18:00:00Z
updated: 2026-02-13T19:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Join Bet Room (Creator Charged)
expected: When creating a bet room, the room creator is charged the buy-in amount immediately. Their sidebar balance decreases by the bet amount. A single "Einsatz" transaction appears in their history (no duplicates). When another player joins, they are also charged once with a single transaction entry.
result: pass

### 2. Pot Display During Gameplay
expected: During a bet room Kniffel game, an animated pot display shows the total pot amount (bet amount x number of players) on the game board with a chip icon and amber/gold styling. Free rooms do not show a pot display.
result: pass

### 3. Game End Payout Breakdown
expected: After a bet room game ends, the results screen shows a payout breakdown below the podium: each player's position (with medal icons), their payout amount, and the distribution follows the configured payout ratios (default 60%/30%/10%).
result: pass

### 4. Turn Timer & AFK Warning
expected: In a bet room, when a player's turn timer runs out, auto-play triggers (rolls dice if needed, then picks a category automatically). If a player is inactive for multiple turns, an AFK warning banner appears with a countdown and an "Ich bin da!" button. Clicking the button cancels the warning and sends a system message.
result: pass

### 5. Player Card Chip Transfer
expected: In a game room's player list during the waiting phase, each other player shows a "Chips senden" button. Clicking it opens the TransferDialog pre-filled with that player as recipient. The button also appears on the ended/results screen player cards.
result: pass

### 6. Admin System Settings Save
expected: On the admin /admin/finance "Einstellungen" tab, changing economic parameters (currency name, starting balance, daily allowance, bet presets, payout ratios, etc.) and clicking save succeeds without errors. The saved values persist on page reload.
result: pass

### 7. High-Stakes Bet Confirmation
expected: When joining a bet room where the bet amount is more than 25% of your balance, a confirmation dialog appears showing the bet amount, your current balance, and remaining balance after bet. Confirming proceeds to join. Canceling keeps you on the lobby. For free rooms or low-stakes bets (<=25% of balance), no confirmation appears — you join immediately.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
