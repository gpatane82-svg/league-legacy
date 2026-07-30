# Batch 1 — League Theme Foundation

## Completed

- Confirmed the two league records:
  - `26757` — Art Vandelay League
  - `5119107` — League Of Losers
- Added a single league-to-theme map in `app.js`.
- Added `currentTheme()` and `applyLeagueTheme()` as the presentation boundary.
- The active league now sets all of the following on every render:
  - `data-league-id` on `<html>` and `<body>`
  - `data-league-theme` on `<html>` and `<body>`
  - exactly one body class: `theme-art-vandelay` or `theme-florida-man`
- Added reserved CSS roots for both themes without introducing visual changes.
- Kept league data, calculations, routes, filters and page-rendering functions shared.

## Expected behavior

Choosing **Art Vandelay League** produces:

```html
<body data-league-id="26757" data-league-theme="art-vandelay" class="theme-art-vandelay">
```

Choosing **League Of Losers** produces:

```html
<body data-league-id="5119107" data-league-theme="florida-man" class="theme-florida-man">
```

The page should look and behave exactly as it did before this batch. The independent Florida Man masthead and navigation begin in Batch 2.
