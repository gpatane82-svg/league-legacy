const data = window.LEAGUE_DATA;
const leagueSelect = document.querySelector("#leagueSelect");
const seasonSelect = document.querySelector("#seasonSelect");
const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const navButtons = [...document.querySelectorAll(".nav-link")];

const state = {
  leagueId: localStorage.getItem("leagueId") || "26757",
  view: location.hash.replace("#", "") || "overview",
  season: null
};

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const pct = value => `${(value * 100).toFixed(1)}%`;
const initials = value => value.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
const currentLeague = () => data[state.leagueId];
const latestSeason = () => Math.max(...currentLeague().seasons);
const seasonRows = () => currentLeague().rows.filter(r => r.season === (state.season || latestSeason()));

function titleFor(view) {
  return ({
    overview: "Corporate Headquarters",
    standings: "Corporate Performance",
    managers: "Personnel Files",
    history: "Executive Hall",
    records: "Records Department",
    transactions: "Import / Export"
  })[view] || "Corporate Headquarters";
}

function sortedStandings(rows) {
  return [...rows].sort((a, b) =>
    a.regularSeasonRank - b.regularSeasonRank ||
    b.wins - a.wins ||
    b.pointsFor - a.pointsFor
  );
}

function standingsTable(rows) {
  const sorted = sortedStandings(rows);
  if (!sorted.length) return `<div class="empty">No performance report is available for this season.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Rank</th><th>Franchise</th><th>Executive</th><th>Record</th><th>Production</th><th>Allowed</th><th>Finish</th></tr></thead>
    <tbody>${sorted.map((r, i) => `<tr>
      <td><span class="rank-cell ${i === 0 ? "first" : ""}">${r.regularSeasonRank || i + 1}</span></td>
      <td><strong>${r.team}</strong></td>
      <td>${r.manager}</td>
      <td>${r.wins}-${r.losses}-${r.ties}</td>
      <td>${fmt.format(r.pointsFor)}</td>
      <td>${fmt.format(r.pointsAgainst)}</td>
      <td>${r.playoffRank ? `#${r.playoffRank}` : "—"}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function overview() {
  const league = currentLeague();
  const latest = latestSeason();
  state.season = state.season || latest;
  const rows = sortedStandings(seasonRows());
  const champion = league.champions.find(c => c.season === state.season) || league.champions[0];
  const leader = rows[0];
  const totalGames = Math.round(league.managers.reduce((sum, m) => sum + m.wins + m.losses + m.ties, 0) / 2);
  const topManagers = [...league.managers].sort((a, b) => b.wins - a.wins).slice(0, 5);
  const maxWins = Math.max(...topManagers.map(m => m.wins), 1);

  return `
    <div class="headquarters-grid">
      <section class="corporate-hero">
        <div class="document-code">Corporate Communications · File AVL-${state.season}</div>
        <h2 class="hero-title">Welcome to the Fantasy Football Division.</h2>
        <p class="hero-copy">The official archive of the ${league.name}: ${league.seasons.length} seasons of championships, personnel decisions, performance reviews and highly questionable asset management.</p>
        <div class="hero-seal">Vandelay<br>Industries<br>Official</div>
      </section>

      <aside class="paper-panel champion-panel">
        <div class="panel-ribbon"><span>Executive of the Year</span><span>${champion?.season || state.season}</span></div>
        <div class="champion-portrait"><div class="portrait-placeholder">${champion ? initials(champion.manager) : "VI"}</div></div>
        <div class="champion-copy">
          <div class="year">Current Champion</div>
          <h2>${champion?.team || "Pending"}</h2>
          <p>${champion ? `${champion.manager} · ${champion.record}` : "Awaiting final certification"}</p>
        </div>
      </aside>
    </div>

    <div class="stats-grid">
      <article class="stat-card"><div class="stat-label">Years in Operation</div><div class="stat-value">${league.seasons.length}</div><div class="stat-note">${league.seasons[0]}–${latest}</div></article>
      <article class="stat-card"><div class="stat-label">Personnel on File</div><div class="stat-value">${league.managers.length}</div><div class="stat-note">Across league history</div></article>
      <article class="stat-card"><div class="stat-label">Recorded Matchups</div><div class="stat-value">${totalGames}</div><div class="stat-note">Regular-season results</div></article>
      <article class="stat-card"><div class="stat-label">${state.season} Performance Leader</div><div class="stat-value" style="font-size:22px">${leader?.team || "—"}</div><div class="stat-note">${leader ? `${leader.wins}-${leader.losses}-${leader.ties} · ${fmt.format(leader.pointsFor)} PF` : ""}</div></article>
    </div>

    <div class="lower-grid">
      <section class="paper-panel memo">
        <div class="panel-heading"><h2>Company Memorandum</h2><span>Form VI-22B</span></div>
        <div class="memo-meta"><strong>TO:</strong><span>All Fantasy Football Division Personnel</span><strong>FROM:</strong><span>Office of the Commissioner</span><strong>RE:</strong><span>${state.season} Annual Performance Review</span></div>
        <p>The ${state.season} records have been reviewed and entered into the permanent corporate archive. ${champion ? `${champion.manager}, representing ${champion.team}, has been formally recognized as Champion.` : "Championship certification remains pending."}</p>
        <p>Personnel are encouraged to review the Corporate Performance report before disputing any historical facts.</p>
      </section>

      <aside class="paper-panel">
        <div class="panel-heading"><h2>Department Directory</h2><span>Extension List</span></div>
        <div class="department-links">
          <button class="department-link" data-go="standings"><span>Corporate Performance</span><span>→</span></button>
          <button class="department-link" data-go="managers"><span>Personnel Files</span><span>→</span></button>
          <button class="department-link" data-go="history"><span>Executive Hall</span><span>→</span></button>
          <button class="department-link" data-go="records"><span>Records Department</span><span>→</span></button>
          <button class="department-link" data-go="transactions"><span>Import / Export</span><span>→</span></button>
        </div>
      </aside>
    </div>

    <section class="paper-panel" style="margin-top:20px">
      <div class="panel-heading"><h2>All-Time Wins</h2><span>Senior Personnel</span></div>
      <div class="bar-chart">${topManagers.map(m => `<div class="bar-row"><span>${m.name}</span><span class="bar-track"><span class="bar-fill" style="width:${m.wins / maxWins * 100}%"></span></span><strong>${m.wins}</strong></div>`).join("")}</div>
    </section>`;
}

function standings() {
  return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season || latestSeason()} Annual Performance Report</h2><span>${currentLeague().name}</span></div>${standingsTable(seasonRows())}</section>`;
}

function managers() {
  const managers = currentLeague().managers;
  return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>Personnel Directory</h2><span>Sorted by Championships, then wins</span></div><div class="table-wrap"><table>
    <thead><tr><th>Employee</th><th>Service</th><th>Career Record</th><th>Success Rate</th><th>Championships</th><th>Playoffs</th><th>Career Production</th></tr></thead>
    <tbody>${managers.map(m => `<tr>
      <td><span class="manager-cell"><span class="employee-badge">${initials(m.name)}</span><span>${m.name}<br><small>${m.firstSeason}–${m.lastSeason}</small></span></span></td>
      <td>${m.seasons} seasons</td><td>${m.wins}-${m.losses}-${m.ties}</td><td>${pct(m.winPct)}</td>
      <td><span class="title-badge">${m.championships} Championship${m.championships === 1 ? "" : "s"}</span></td>
      <td>${m.playoffs}</td><td>${fmt.format(m.pointsFor)}</td>
    </tr>`).join("")}</tbody>
  </table></div></section>`;
}

function history() {
  const champions = currentLeague().champions;
  return `<div class="file-grid">${champions.map(c => `<article class="file-card">
    <div class="document-code">Executive Appointment · ${c.season}</div>
    <div class="champion-portrait" style="height:130px;margin:14px -20px 16px;border-bottom-width:4px"><div class="portrait-placeholder" style="width:86px;height:102px;font-size:30px;border-width:6px">${initials(c.manager)}</div></div>
    <h3>${c.team}</h3><p><strong>${c.manager}</strong></p><p>${c.record} · ${fmt.format(c.pointsFor)} points</p>
    <span class="title-badge" style="margin-top:10px">Champion</span>
  </article>`).join("")}</div>`;
}

function records() {
  const rows = currentLeague().rows;
  const highScore = [...rows].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  const lowScore = [...rows].filter(r => r.pointsFor > 0).sort((a, b) => a.pointsFor - b.pointsFor)[0];
  const bestDiff = [...rows].sort((a, b) => (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst))[0];
  const titles = [...currentLeague().managers].sort((a, b) => b.championships - a.championships || b.wins - a.wins)[0];
  const points = [...currentLeague().managers].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  const longest = [...currentLeague().managers].sort((a, b) => b.seasons - a.seasons)[0];
  const card = (label, value, sub) => `<article class="stat-card record-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${sub}</div></article>`;
  return `<div class="record-grid">
    ${card("Highest Season Production", fmt.format(highScore.pointsFor), `${highScore.team} · ${highScore.season}`)}
    ${card("Lowest Season Production", fmt.format(lowScore.pointsFor), `${lowScore.team} · ${lowScore.season}`)}
    ${card("Best Point Differential", fmt.format(bestDiff.pointsFor - bestDiff.pointsAgainst), `${bestDiff.team} · ${bestDiff.season}`)}
    ${card("Most Championships", titles.championships, `${titles.name} · ${titles.wins} career wins`)}
    ${card("Most Career Points", fmt.format(points.pointsFor), points.name)}
    ${card("Longest Service Record", `${longest.seasons} seasons`, longest.name)}
  </div>`;
}

function transactions() {
  const rows = sortedStandings(seasonRows());
  const totalMoves = rows.reduce((sum, r) => sum + (r.moves || 0), 0);
  const totalTrades = rows.reduce((sum, r) => sum + (r.trades || 0), 0);
  return `<div class="stats-grid" style="grid-template-columns:repeat(2,1fr)">
    <article class="stat-card"><div class="stat-label">Imported Assets</div><div class="stat-value">${totalMoves}</div><div class="stat-note">Waiver and roster moves in ${state.season}</div></article>
    <article class="stat-card"><div class="stat-label">Export Agreements</div><div class="stat-value">${totalTrades}</div><div class="stat-note">Certified trades in ${state.season}</div></article>
  </div>
  <section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Import / Export Ledger</h2><span>Transaction Control</span></div><div class="table-wrap"><table>
    <thead><tr><th>Franchise</th><th>Executive</th><th>Imports</th><th>Exports</th><th>Draft Position</th><th>Final Finish</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><strong>${r.team}</strong></td><td>${r.manager}</td><td>${r.moves || 0}</td><td>${r.trades || 0}</td><td>${r.draftPosition || "—"}</td><td>${r.playoffRank ? `#${r.playoffRank}` : "—"}</td></tr>`).join("")}</tbody>
  </table></div></section>`;
}

function bindInternalLinks() {
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => {
    state.view = button.dataset.go;
    location.hash = state.view;
    render();
  }));
}

function render() {
  const league = currentLeague();
  if (!league.seasons.includes(state.season)) state.season = latestSeason();
  pageTitle.textContent = titleFor(state.view);
  document.title = `${titleFor(state.view)} | Vandelay Industries`;
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === state.view));
  seasonSelect.value = state.season;
  content.innerHTML = ({ overview, standings, managers, history, records, transactions }[state.view] || overview)();
  bindInternalLinks();
}

function populate() {
  leagueSelect.innerHTML = Object.values(data).map(l => `<option value="${l.id}">${l.name}</option>`).join("");
  if (!data[state.leagueId]) state.leagueId = Object.keys(data)[0];
  leagueSelect.value = state.leagueId;
  const league = currentLeague();
  seasonSelect.innerHTML = [...league.seasons].reverse().map(y => `<option value="${y}">${y}</option>`).join("");
  if (!state.season || !league.seasons.includes(state.season)) state.season = latestSeason();
  seasonSelect.value = state.season;
}

leagueSelect.addEventListener("change", event => {
  state.leagueId = event.target.value;
  localStorage.setItem("leagueId", state.leagueId);
  state.season = null;
  populate();
  render();
});
seasonSelect.addEventListener("change", event => { state.season = Number(event.target.value); render(); });
navButtons.forEach(button => button.addEventListener("click", () => {
  state.view = button.dataset.view;
  location.hash = state.view;
  render();
}));
window.addEventListener("hashchange", () => { state.view = location.hash.replace("#", "") || "overview"; render(); });
document.querySelector("#shareButton").addEventListener("click", async () => {
  const button = document.querySelector("#shareButton");
  try {
    await navigator.clipboard.writeText(location.href);
    button.textContent = "File Link Copied";
    setTimeout(() => button.textContent = "Copy File Link", 1400);
  } catch {
    alert("Copy the address from your browser to share this file.");
  }
});

populate();
render();
