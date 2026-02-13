---
status: diagnosed
phase: 03-virtual-currency-betting
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md, 03-07-SUMMARY.md, 03-08-SUMMARY.md, 03-09-SUMMARY.md
started: 2026-02-12T18:00:00Z
updated: 2026-02-13T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Balance Display in Sidebar
expected: On any page within the app, the sidebar shows your current chip balance with a coin/wallet icon. The balance is formatted with German number formatting (dot separators). Both desktop sidebar and mobile sidebar show the balance.
result: pass

### 2. Wallet Page Overview
expected: Navigating to /wallet shows a page with your current balance prominently displayed, a 30-day balance history chart (line chart), a daily claim section, a transfer section, and a transaction history list on the right side.
result: pass

### 3. Claim Daily Allowance
expected: On the wallet page, a "Tägliches Guthaben" button shows the claimable amount with an activity multiplier (e.g., "100 Chips (1.0x)"). Clicking it credits your balance, shows a success notification, and the button becomes disabled until the next day. Progress toward weekly bonus is shown.
result: pass

### 4. Transaction History with Filters
expected: On the wallet page, the transaction list shows entries grouped by day ("Heute", "Gestern", or date). Filter tabs (Alle, Gewinne, Verluste, Transfers, Admin) switch which transactions are displayed. Each entry shows an icon, description, colored amount (green for credits, red for debits), and time.
result: pass

### 5. Transfer Chips to Another User
expected: On the wallet page, the transfer form lets you search for a user by name. Typing shows matching users in a dropdown. Selecting a recipient and entering an amount, then submitting, deducts from your balance and credits the recipient. Transfer limits (max per transfer, daily total) are displayed.
previous: issue (blocker) — fixed by 03-11
result: pass

### 6. Create a Bet Room
expected: In the room creation dialog, toggling from "Kostenlos" to "Einsatz" reveals bet settings: preset amount buttons (50, 100, 250, 500), a custom amount input, optional min/max bet fields, and payout ratio configuration. Submitting creates a room with those bet settings.
previous: issue (blocker) — fixed by 03-11
result: pass

### 7. Lobby Bet/Free Filters
expected: The lobby shows filter tabs "Alle", "Kostenlos", and "Einsatz" with room counts in parentheses. Bet rooms display an amber chip badge showing the bet amount (e.g., "100 Chips"). Free rooms show a green "Kostenlos" badge. Clicking filter tabs filters the room list accordingly.
result: pass

### 8. Join Bet Room (Buy-in)
expected: Joining a bet room deducts the bet amount from your balance. If your balance is insufficient, you join as spectator instead of player. Your sidebar balance updates immediately after joining.
result: issue
reported: "only takes money from people who join the room. not the creator of the room. also in the transaction history the bet shows twice for user who joins. Einsatz: Table and Einsatz verfallen: Table (total balance is calculated correctly tho)"
severity: major

### 9. Leave Bet Room Before Start (Refund)
expected: Leaving a bet room before the game has started refunds the full bet amount to your balance. Your sidebar balance updates to reflect the refund.
result: pass

### 10. Pot Display During Gameplay
expected: During a bet room game, an animated pot display shows the total pot amount (bet amount x number of players) on the game board with a chip icon and amber/gold styling. Free rooms do not show a pot display.
result: issue
reported: "no, there is no pot showing (i am testing in kniffel)."
severity: major

### 11. Game End Payout Breakdown
expected: After a bet room game ends, the results screen shows a payout breakdown below the podium: each winner's position (with medal icons), their payout amount, and the distribution follows the configured payout ratios (default 60%/30%/10%).
result: skipped
reason: blocked by Test 10 (pot not showing)

### 12. AFK Warning in Bet Rooms
expected: In a bet room, if a player goes inactive, a warning banner appears with a countdown timer and an "Ich bin da!" button. Clicking the button cancels the warning. If the timer expires, the player is kicked and forfeits their bet. In free rooms, AFK kicks happen immediately without warning.
result: issue
reported: "when the timer of a turn runs out, nothing even happens."
severity: major

### 13. Player Card Chip Transfer
expected: In a game room's player list, each other player shows a "Chips senden" button (visible during waiting and ended phases). Clicking it opens the TransferDialog pre-filled with that player as recipient.
result: issue
reported: "no button for sending there also i can't open a user profile or something when clicking the user."
severity: major

### 14. Admin Finance Dashboard
expected: Admin users see a "Finanzen" link with a coin icon in the sidebar. The /admin/finance page shows tabs: Dashboard, Transaktionen, Guthaben, Alarme, Einstellungen. The Dashboard tab shows economy stats (total circulation, average balance, active wallets, daily volume), a 30-day volume chart, transaction type distribution, and top earners/spenders leaderboards.
previous: issue (major) — fixed by 03-12
result: pass

### 15. Admin Transaction Log
expected: The "Transaktionen" tab shows a filterable table of all transactions. A type dropdown filters by transaction type (11 types). A user search field filters by user. Transactions show date, type, user, colored amount, and description. "Mehr laden" button loads more entries.
result: pass

### 16. Admin Balance Adjustment
expected: The "Guthaben" tab lets admin search for a user, see their current balance and frozen status, and adjust their balance (positive or negative) with an optional reason. After adjustment, the affected user's sidebar balance updates in real-time via socket event.
result: pass

### 17. Admin Wallet Freeze/Unfreeze
expected: On the Guthaben tab, after selecting a user, admin can freeze or unfreeze their wallet. A frozen wallet shows a timestamp and tooltip explaining restrictions (can play but cannot bet or transfer). Frozen users cannot make outbound transfers or place bets.
result: pass

### 18. Suspicious Activity Alerts
expected: The "Alarme" tab shows detected suspicious activity: large transfers over threshold, daily limit violations, and rapid balance drops. Alerts are color-coded (amber warning, red critical). When no issues exist, a green "Keine verdächtigen Aktivitäten" card is shown. The tab badge shows alert count when alerts exist.
result: pass

### 19. Admin System Settings
expected: The "Einstellungen" tab shows a form with all economic parameters: currency name, starting balance, daily allowance, weekly bonus, transfer limits, default bet presets, payout ratios (editable table), AFK grace period, and alert thresholds. Saving updates take effect immediately without redeployment.
previous: issue (major) — fixed by 03-12
result: issue
reported: "Ungültiges JSON-Format für Presets oder Auszahlungsquoten. when saving the settings."
severity: major

### 20. Custom Starting Balance on Invite
expected: In the admin invite dialog, an optional "Individuelles Startguthaben" field allows setting a custom starting balance for that invite. The placeholder shows the current default (e.g., "Standard: 1000"). When a user registers via that invite, they receive the custom amount instead of the default.
result: pass

## Summary

total: 20
passed: 14
issues: 5
pending: 0
skipped: 1

## Gaps

- truth: "Room creator should also be charged buy-in, and joining players should not see duplicate transaction entries"
  status: failed
  reason: "User reported: only takes money from people who join the room. not the creator of the room. also in the transaction history the bet shows twice for user who joins. Einsatz: Table and Einsatz verfallen: Table (total balance is calculated correctly tho)"
  severity: major
  test: 8
  root_cause: "Two bugs: (1) room:create handler (server.js ~line 675) has zero escrow/wallet logic — creator never charged. Creator hits room:join on page mount but early-returns at line 731 with rejoined:true, skipping escrow. (2) disconnect handler removes user from room without escrow cleanup, causing duplicate BetEscrow on reconnect/rejoin."
  artifacts:
    - path: "server.js"
      issue: "room:create handler missing escrow creation + wallet debit for creator"
    - path: "server.js"
      issue: "disconnect handler missing escrow handling on socket disconnect"
    - path: "src/app/game/[roomId]/page.tsx"
      issue: "Fires room:join on every mount without guarding against duplicate escrow"
  missing:
    - "Add escrow logic to room:create handler (check balance, debit, create BetEscrow)"
    - "Add idempotency to room:join escrow: check for existing PENDING/LOCKED BetEscrow before creating"
    - "Fix disconnect handler to handle escrow properly based on room status"
  debug_session: ".planning/debug/creator-not-charged-buyin.md"

- truth: "Pot display shows during bet room gameplay"
  status: failed
  reason: "User reported: no, there is no pot showing (i am testing in kniffel)."
  severity: major
  test: 10
  root_cause: "GameBoard rendered in page.tsx without isBetRoom and betAmount props. Props default to false/0, so pot calculation always yields 0 and PotDisplay never renders. Room data has the values, just not forwarded."
  artifacts:
    - path: "src/app/game/[roomId]/page.tsx"
      issue: "isBetRoom and betAmount not passed to <GameBoard> at lines 218-225"
  missing:
    - "Add isBetRoom={room.isBetRoom} betAmount={room.betAmount} to GameBoard render"
  debug_session: ".planning/debug/pot-display-not-showing.md"

- truth: "Turn timer expiry triggers auto-play or AFK warning"
  status: failed
  reason: "User reported: when the timer of a turn runs out, nothing even happens."
  severity: major
  test: 12
  root_cause: "JavaScript scoping bug: autoPlay() and kickPlayerAFK() are at module scope but call sendSystemMessage() which is defined inside the app.prepare().then() closure — ReferenceError crashes silently. Also bet:afk-acknowledge has no server handler."
  artifacts:
    - path: "server.js"
      issue: "autoPlay() at module scope (line 280) calls sendSystemMessage() from inner closure — ReferenceError"
    - path: "server.js"
      issue: "kickPlayerAFK() at module scope (line 446) has same scoping bug"
    - path: "server.js"
      issue: "No socket.on('bet:afk-acknowledge') handler exists"
    - path: "src/components/betting/afk-warning.tsx"
      issue: "Emits bet:afk-acknowledge to server that never listens"
  missing:
    - "Move sendSystemMessage and emitBalanceUpdate to module scope (or move autoPlay/kickPlayerAFK inside closure)"
    - "Add bet:afk-acknowledge socket handler"
    - "Add error handling to setTimeout in startTurnTimer"
  debug_session: ".planning/debug/turn-timer-expiry-does-nothing.md"

- truth: "Player cards in game room show Chips senden button for transfers"
  status: failed
  reason: "User reported: no button for sending there also i can't open a user profile or something when clicking the user."
  severity: major
  test: 13
  root_cause: "Architecturally unreachable dead code. WaitingRoom uses its own inline player list without PlayerList/TransferDialog. Ended phase renders inline results card without PlayerList. PlayerList is only mounted inside GameBoard (playing phase) where gamePhase is never 'waiting' or 'ended'."
  artifacts:
    - path: "src/app/game/[roomId]/page.tsx"
      issue: "Three mutually exclusive render paths; waiting and ended have no TransferDialog"
    - path: "src/components/game/WaitingRoom.tsx"
      issue: "Own inline player list (lines 156-195) without PlayerList component or TransferDialog"
    - path: "src/components/game/PlayerList.tsx"
      issue: "showTransferButton condition unreachable inside GameBoard"
  missing:
    - "Add TransferDialog with Chips senden button to WaitingRoom inline player list"
    - "Add TransferDialog with player list to ended phase render"
  debug_session: ".planning/debug/chips-senden-button-missing.md"

- truth: "Admin system settings save successfully"
  status: failed
  reason: "User reported: Ungültiges JSON-Format für Presets oder Auszahlungsquoten. when saving the settings."
  severity: major
  test: 19
  root_cause: "Duplicate name='defaultBetPresets' on two inputs. Visible <Input> (line 239) and hidden <input> (line 249) both have name='defaultBetPresets'. FormData.get() returns first match (visible input with comma-separated string '10, 25, 50, 100'), not the hidden input's JSON. JSON.parse fails."
  artifacts:
    - path: "src/components/admin/economic-settings.tsx"
      issue: "Visible Input at line 239 has name='defaultBetPresets' — must be removed so only hidden input submits"
  missing:
    - "Remove name='defaultBetPresets' from visible Input at line 239"
  debug_session: ".planning/debug/admin-settings-json-error.md"
