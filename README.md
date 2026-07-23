# League Legacy

A polished, mobile-friendly static fantasy football history site built from the supplied CSV exports.

## What is included

- One-click switching between **Art Vandelay League** and **League Of Losers**
- Season selector
- League overview
- Historical standings
- Manager career rankings
- Championship timeline
- Record book
- Responsive phone and desktop layouts
- No database, paid hosting, or coding framework required

## Preview locally

Open `index.html` in a browser. Some browsers restrict local JavaScript files. If that happens:

1. Open Terminal or Command Prompt in this folder.
2. Run `python3 -m http.server 8000`
3. Visit `http://localhost:8000`

## Publish free with GitHub Pages

1. Create a free GitHub account.
2. Create a new public repository, such as `league-legacy`.
3. Upload every file and folder from this project.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)`, then save.
7. GitHub will provide a public shareable URL.

## Updating data

The generated site data is stored in `data/league-data.js`. The original cleaned source came from `league_dashboard_standings.csv`.

A future update script can regenerate that file after each fantasy season without redesigning the site.
