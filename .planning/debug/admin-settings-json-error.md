---
status: diagnosed
trigger: "Saving admin system settings shows 'Ungultiges JSON-Format fur Presets oder Auszahlungsquoten'"
created: 2026-02-13T00:00:00Z
updated: 2026-02-13T00:00:00Z
---

## Current Focus

hypothesis: Duplicate form field names cause formData.get() to return the visible input's raw comma-separated string instead of the hidden input's JSON string
test: Trace which value formData.get('defaultBetPresets') returns when two inputs share the name
expecting: formData.get returns the FIRST input (the visible text input with "10, 25, 50, 100"), not the hidden JSON input
next_action: Return diagnosis

## Symptoms

expected: Admin saves economic settings successfully
actual: Error "Ungultiges JSON-Format fur Presets oder Auszahlungsquoten" on every save attempt
errors: JSON.parse fails on non-JSON string (comma-separated text like "10, 25, 50, 100")
reproduction: Open admin finance page, edit any setting, click save
started: Since initial implementation

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-13T00:01:00Z
  checked: economic-settings.tsx lines 238-256 (bet presets form fields)
  found: TWO input elements share name="defaultBetPresets" - a visible text Input (line 239) and a hidden input (line 247-256)
  implication: formData.get() returns value from first matching element in DOM order

- timestamp: 2026-02-13T00:01:30Z
  checked: economic-settings.tsx lines 312-316 (payout ratios hidden input)
  found: defaultPayoutRatios also has duplicate name issue - the payout ratio inputs don't have name attributes on the visible ones, but the hidden input at line 312-316 is the only named one. However defaultBetPresets definitely has two.
  implication: The betPresets field is the primary culprit

- timestamp: 2026-02-13T00:02:00Z
  checked: admin-finance.ts lines 245 and 268
  found: formData.get('defaultBetPresets') retrieves a string, then JSON.parse is called on it at line 268
  implication: If the retrieved string is "10, 25, 50, 100" (from visible input) instead of "[10,25,50,100]" (from hidden input), JSON.parse will throw

- timestamp: 2026-02-13T00:02:30Z
  checked: HTML spec for duplicate name attributes
  found: formData.get() returns the value of the FIRST element with the given name in DOM order. formData.getAll() would return all values.
  implication: The visible text input at line 238-246 comes BEFORE the hidden input at line 247-256, so formData.get returns the human-readable comma-separated string, NOT the JSON string

## Resolution

root_cause: In economic-settings.tsx, there are two <input> elements with name="defaultBetPresets". The visible text input (line 239) contains a human-readable comma-separated string like "10, 25, 50, 100". The hidden input (lines 247-256) contains the properly serialized JSON string like "[10,25,50,100]". Because the visible input appears FIRST in DOM order, formData.get('defaultBetPresets') returns the comma-separated string. The server action (admin-finance.ts line 268) then calls JSON.parse("10, 25, 50, 100") which throws a SyntaxError, caught at line 270, producing the error message at line 271.

fix: (not yet applied)
verification: (not yet verified)
files_changed: []
