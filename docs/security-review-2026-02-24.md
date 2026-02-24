# Security Review (2026-02-24)

## Scope
- Authentication/session handling
- Admin and wallet server actions
- Socket.IO event authorization
- Invite flow and outbound URL construction

## Findings Summary
- **High**: Invite URL poisoning via untrusted origin input in admin invite flow.
- **Medium**: User enumeration in login flow due to distinct banned-account response.
- **Medium**: Socket event allows spoofed transfer notifications and indirect balance disclosure.

---

## Issue 1: Invite URL poisoning via untrusted `origin` (High)

### Affected code
- `src/lib/actions/admin.ts`

### Description
The admin invite action accepts `origin` from `FormData` and uses it directly to build the registration link returned to UI and sent via email.

A malicious actor who can submit a crafted request in an authenticated admin context could set `origin` to an attacker-controlled domain and generate seemingly legitimate invite emails containing a phishing URL.

### Evidence
```ts
const appUrl = (formData.get('origin') as string) || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
...
const link = `${appUrl}/register?token=${token}`
```

### Impact
- Phishing risk with valid invite tokens attached to attacker-hosted links.
- Trust boundary violation (client input controls server-generated security-sensitive URL).

### Recommendation
- Never trust `origin` from client payloads for security-sensitive URLs.
- Derive base URL from trusted server config only (e.g., `NEXT_PUBLIC_APP_URL`) or request host allowlist validation.
- Optionally store only relative paths in app logic and let frontend resolve display URL.

---

## Issue 2: Login user enumeration via distinct banned response (Medium)

### Affected code
- `src/lib/actions/auth.ts`

### Description
Login returns different messages for invalid credentials and banned accounts. This allows an attacker to test if an email+password pair is valid-but-banned versus simply invalid, improving account discovery and credential-stuffing feedback.

### Evidence
```ts
if (!user) {
  return { message: 'invalidCredentials' }
}
...
if (!passwordMatch) {
  return { message: 'invalidCredentials' }
}
...
if (user.bannedAt) {
  return { message: 'accountBanned' }
}
```

### Impact
- Better oracle for account state probing.
- Increases attack efficiency for credential stuffing and targeted harassment.

### Recommendation
- Return one generic auth failure message for all failures during login.
- Log detailed reason server-side only.
- Add rate limiting / temporary lockout on repeated failed attempts.

---

## Issue 3: Socket transfer notification spoofing & balance disclosure vector (Medium)

### Affected code
- `server.js`

### Description
Any authenticated socket can emit `wallet:transfer-complete` with arbitrary `toUserId` and `amount`. Server then fetches recipient wallet and emits a `balance:updated` event and transfer notification to the target user, without verifying that a real transfer occurred or that sender/amount is legitimate.

### Evidence
```js
socket.on('wallet:transfer-complete', async ({ toUserId, amount }) => {
  if (!toUserId || !amount) return

  const wallet = await getWalletWithUser(toUserId)
  emitBalanceUpdate(io, toUserId, wallet.balance, amount, `Transfer von ${socket.data.displayName}`)
  io.to(`user:${toUserId}`).emit('wallet:transfer-received', {
    fromName: socket.data.displayName,
    amount,
  })
})
```

### Impact
- Notification spoofing/social engineering against other users.
- Indirect disclosure of recipient balance updates over an unauthorized trigger path.
- Event-channel integrity issue.

### Recommendation
- Remove client-triggered transfer-complete event, or gate it with server-side verification (transaction ID ownership + existence + status).
- Emit transfer completion only from trusted server action code path after DB transaction success.
- Add schema validation and authorization checks on all socket events.

---

## Hardening Opportunities (non-blocking)
- Add centralized rate limiting for login and invite creation endpoints.
- Add structured security logging (event type, actor, target, request-id).
- Introduce automated security tests for auth responses and socket event authorization.
