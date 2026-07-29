# Batch 2 — Home + Standings

Implemented on top of the uploaded `league-legacy-main-5-3` project.

## Home
- Rebuilt the League of Losers front page around certified champion and Sacko facts.
- Removed the Power Desk, Scoring Bureau, and Playoff Panic Meter filler blocks.
- Added a compact season standings snapshot and archive totals.
- Reworked “Who Owns the Swamp?” as a championship ledger.
- Clarified the archive philosophy: permanent owners, historical team identities, immutable facts, derived statistics.

## Standings
- Recalculated games played, W-L-T, PF, PA, win percentage, and average PF from the matchup ledger.
- Added GP and summary metrics.
- Preserved Overall and Playoff views.
- Added sortable Rank, Owner, Record, Win %, PF, and PA columns.
- Added champion and Sacko row markers using certified award facts.
- Added responsive layouts for desktop, tablet, and mobile.

## Shared
- League of Losers is the first-load default league.
- Initial document metadata and visible fallback copy now use League of Losers branding.
- Existing routes, data files, owner links, season selection, and the alternate Vandelay league remain intact.
