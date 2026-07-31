# League of Losers — Function Pass v2

## Commissioner review fixes

- Trophy Case owner-link mapping now resolves Will to the William owner profile.
- Canonical display names are used in League of Losers views (Peter instead of Azn; Joe instead of Jos).
- Standings now include an Overall / Playoffs toggle for both all-time and season scopes.
- Standings columns now include PF, PA, Avg PF, and Sackos.
- Game Day selections and grid clicks update in place without sending the browser to the top.
- Active owners are emphasized; former owners are muted while remaining clickable.
- Record Book restores the scoring leaderboard beneath the summary cards with Avg PF, Avg PA, Game High, and Game Low.
- Scoring leaderboard columns are sortable.

## Commissioner’s Office

- JSON season import preview.
- Manual keeper entry.
- Manual championship and Sacko confirmation.
- Commissioner override entry with timestamped audit records.
- Local draft storage in the browser.
- Merged JSON backup export.
- Local draft reset control.

Local Commissioner’s Office changes do not automatically modify a deployed website. Export the merged JSON backup and use it as the canonical file for the next deployment.
