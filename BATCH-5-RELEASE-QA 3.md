# Batch 5 — Release QA and GitHub Package

## Final architecture

- One static League Legacy application and one shared data layer.
- The league dropdown is the single theme switch.
- League `26757` uses the preserved `art-vandelay` presentation.
- League `5119107` uses the independent `florida-man` presentation.
- All routes, manager links, season filters, calculations, archive search, draft data, game data, and awards data remain shared.

## Final-pass fixes

- Theme-aware page title, metadata description, wordmark accessibility label, selector labels, navigation labels, footer copy, and share-button feedback.
- The Florida share control now returns to `Copy Evidence Link` after copying instead of reverting to Vandelay copy.
- All Florida rules and decorative assets remain scoped to the Florida theme.
- Art Vandelay remains the safe default for unknown league IDs.

## Validation performed

- JavaScript syntax validation with Node.
- Static route coverage for all ten primary views in both leagues.
- Manager-detail route coverage in both leagues.
- Generated markup checked for missing local image assets.
- Source HTML/CSS/JavaScript references checked for missing local files.
- Data files parsed and league IDs verified.
- ZIP contents verified after packaging.

## Post-commit test

After uploading and committing to GitHub Pages, hard-refresh the deployed site and test:

1. Switch between Art Vandelay and League of Losers several times.
2. Visit every navigation item in each league.
3. Open a manager file, change seasons, and return to the overview.
4. Test the copy-link control in both themes.
5. Check desktop and mobile widths for any hosted-only asset or caching issue.
