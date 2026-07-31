# QA Batch 2 — Standings Sorting

Implemented only the approved carryover sorting fixes for the Standings table:

- Avg PF
- Titles
- Sackos
- Playoff Appearances

Each heading now uses the existing sortable-table behavior, numeric comparison, direction toggling, sort indicator, and scroll-position preservation.

Validation:
- `app.js` passes `node --check`.
- No Global, Home, Suspects, Trophy Case, Record Book, Game Day, Draft Board, or Commissioner’s Office content was intentionally changed.
