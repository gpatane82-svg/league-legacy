# Standings sort scroll fix

- Sorting a standings column now preserves the current page scroll position.
- The standings view re-renders without invoking the global scroll-to-top behavior.
- The exact horizontal and vertical window position is restored on the next animation frame.
- No other page behavior was changed.
