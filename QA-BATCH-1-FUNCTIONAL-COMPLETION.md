# QA — Canonical Backlog Batch 1

## Suspects
- Replaced sequential file numbering with competition ranking.
- Ties share a rank and the next rank skips the occupied positions (1, 1, 3).
- Ranking keys follow the selected sort metric.
- Most Wanted all-time ranking treats titles, wins, and points as the composite ranking key.
- Seasonal Most Wanted ranking follows certified season rank.
- Filtering and search recalculate ranks for the displayed result set.

## Game Day
- Removed the Score Desk Notes panel.
- Added a Rivalry Case File containing:
  - Largest Victory
  - Longest Winning Streak
  - Highest Combined Score
  - Last Meeting
  - Series Status narrative
- Rivalry facts derive only from the selected immutable matchup records.
- Win streaks are calculated chronologically and reset on ties.
- Responsive layout collapses from four columns to two and then one.

## Validation
- `node --check app.js` passes.
- No remaining `Score Desk Notes` text exists in `app.js` or `styles.css`.
- Canonical game-data coverage remains 686 games.
- No Record Book artwork work was included; that remains deferred to Batch 4.

## Browser QA Boundary
Automated Chromium rendering was attempted in the container but did not complete reliably. Final visual interaction QA should therefore be performed on the packaged ZIP before Batch 1 is formally signed off by the user.

## QA correction — Suspects competition ranking

- Corrected the all-seasons **Most Wanted** rank key to use championship count alone.
- Secondary sorting by career wins and points still determines card order within a tied rank, but no longer breaks the displayed tie.
- Owners with equal title totals now share the same rank (for example, two owners with two titles both display `#1`, and the next rank is `#3`).
## Final profile ranking correction
- Individual Suspect profile ranking now uses true competition ranking.
- Tied values share the same rank and the next rank skips accordingly (1, 1, 3).
- Directory and profile pages now use consistent tie behavior.
- Batch 1 signed off after syntax and ranking regression checks.

