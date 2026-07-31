# Batch 3B — Full-Site QA and Regression Report

## Baseline

QA was performed against the signed-off Batch 3A build:

`league-of-losers-v0.9-batch-3A-RIVALRY-ACTIVE-ALL-FIXED-QA.zip`

No feature changes or historical-data changes were introduced during this pass.

## Automated route and responsive checks

The application was rendered in a Chromium-based static test harness at three viewport sizes:

- Desktop: 1440 × 1000
- Tablet: 768 × 1024
- Mobile: 390 × 844

The following eleven primary routes were rendered at each viewport, for 33 route/viewport checks:

- Home
- Standings
- The Suspects
- Champions
- Record Book
- Transactions
- Draft Board
- Game Day
- Trophy Case
- Archive Search
- Commissioner’s Office

Results:

- Every route produced populated page content.
- No uncaught application exceptions were detected.
- No duplicate DOM IDs were detected.
- No unlabeled select controls were detected.
- No empty unlabeled buttons were detected.
- No page-level horizontal overflow was detected at the tested viewport widths.

The browser sandbox blocks direct loading of local image files. Asset existence was therefore verified separately against the packaged file tree rather than treating those sandbox-only browser messages as product defects.

## Syntax and source validation

- `app.js` passes `node --check`.
- Every JavaScript file in `data/` passes `node --check`.
- `styles.css` parses without CSS syntax errors.
- `index.html` contains no duplicate static IDs.
- No `TODO`, `FIXME`, `console.log`, or `debugger` statements remain in the production shell files.

## Asset and package validation

- All concrete local HTML, CSS, and JavaScript asset references resolve to packaged files.
- Template-generated portrait references were excluded from the literal-reference scan and their target portrait files are present in the asset tree.
- The release manifest contains 152 entries.
- Every manifest hash matches its packaged file.
- No manifest-listed files are missing.
- No unmanifested files are present before regeneration.
- ZIP integrity passes after packaging.

## Data-integrity validation

- Canonical game coverage remains exactly **686 games**.
- Coverage remains 1,372 team performances across nine seasons.
- Nine championship games remain present.
- No data file was changed during Batch 3B.

## Regression scope

The pass retained the signed-off work from prior batches, including:

- Competition ranking on Suspects and Dynasty Index.
- Rivalry Case File calculations.
- Champion and Sacko stamp treatment.
- Record Book Top 10 rules and Week 17 aggregate exclusion.
- Sortable Owner Scoring Almanac.
- Draft Board rating-card treatment.
- Commissioner workflow, unlimited game entry, and Consolation game type.
- Rivalry Grid Active Owners / All Owners behavior and active/archive color treatment.

## Remaining confirmation

Automated QA found no blocking code, data, package, or responsive-overflow defect. Final visual confirmation should still be performed in the deployed browser environment because the QA sandbox cannot validate hosted caching, MIME delivery, or pixel-level image appearance.

## Batch 3B result

**PASS — ready for user sign-off and Batch 4 artwork.**
