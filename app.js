
const data = window.LEAGUE_DATA;
const leagueSelect = document.querySelector("#leagueSelect");
const seasonSelect = document.querySelector("#seasonSelect");
const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const navButtons = [...document.querySelectorAll(".nav-link")];

const state = {
  leagueId: localStorage.getItem("leagueId") || Object.keys(data)[0],
  view: location.hash.replace("#", "") || "overview",
  season: null
};

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const pct = value => `${(value * 100).toFixed(1)}%`;
const initials = value => value.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase();

function currentLeague() { return data[state.leagueId]; }
function latestSeason() { return Math.max(...currentLeague().seasons); }
function seasonRows() {
  const target = state.season || latestSeason();
  return currentLeague().rows.filter(r => r.season === target);
}
function titleFor(view) {
  return ({
    overview: "League overview",
    standings: "Season standings",
    managers: "Manager profiles",
    history: "Championship history",
    records: "Record book"
  })[view] || "League overview";
}
function sortedStandings(rows) {
  return [...rows].sort((a,b) =>
    a.regularSeasonRank - b.regularSeasonRank ||
    b.wins - a.wins ||
    b.pointsFor - a.pointsFor
  );
}
function tableStandings(rows) {
  const sorted = sortedStandings(rows);
  if (!sorted.length) return `<div class="empty">No standings found for this season.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Rank</th><th>Team</th><th>Manager</th><th>Record</th><th>PF</th><th>PA</th><th>Finish</th></tr></thead>
    <tbody>${sorted.map((r,i) => `<tr>
      <td><span class="rank ${i === 0 ? "first" : ""}">${r.regularSeasonRank || i+1}</span></td>
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
  const champion = league.champions.find(c => c.season === state.season);
  const totalGames = league.managers.reduce((sum,m) => sum + m.wins + m.losses + m.ties, 0) / 2;
  const leader = rows[0];
  const topManagers = [...league.managers].sort((a,b) => b.wins-a.wins).slice(0,6);
  const maxWins = Math.max(...topManagers.map(m => m.wins),1);
  return `
    <div class="hero">
      <p class="eyebrow">${league.name}</p>
      <h2>${league.seasons.length} seasons of rivalries, titles and questionable decisions.</h2>
      <p>Explore the full history of your league with one-click switching between both leagues. The site is generated from your real exports and works on phones, tablets and desktops.</p>
    </div>
    <div class="grid">
      <article class="card"><div class="card-label">Seasons tracked</div><div class="stat">${league.seasons.length}</div><div class="stat-sub">${league.seasons[0]}–${latest}</div></article>
      <article class="card"><div class="card-label">Managers</div><div class="stat">${league.managers.length}</div><div class="stat-sub">Across league history</div></article>
      <article class="card"><div class="card-label">Matchups recorded</div><div class="stat">${Math.round(totalGames)}</div><div class="stat-sub">Regular-season team results</div></article>
      <article class="card"><div class="card-label">${state.season} leader</div><div class="stat" style="font-size:26px">${leader ? leader.team : "—"}</div><div class="stat-sub">${leader ? `${leader.wins}-${leader.losses}-${leader.ties} · ${fmt.format(leader.pointsFor)} PF` : ""}</div></article>
      <article class="card wide">
        <div class="section-title"><h2>${state.season} standings</h2><span>Regular season</span></div>
        ${tableStandings(rows)}
      </article>
      <article class="card medium">
        <div class="section-title"><h2>Defending champion</h2><span>${state.season}</span></div>
        ${champion ? `<div class="champion-card"><span class="trophy">🏆</span><div><strong>${champion.team}</strong><div class="muted">${champion.manager} · ${champion.record}</div></div></div>` : `<div class="empty">Champion not available</div>`}
        <div class="section-title" style="margin-top:24px"><h2>All-time wins</h2><span>Top six</span></div>
        <div class="bar-chart">${topManagers.map(m => `<div class="bar-row"><span>${m.name}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${m.wins/maxWins*100}%"></span></span><strong>${m.wins}</strong></div>`).join("")}</div>
      </article>
    </div>`;
}
function standings() {
  return `<div class="grid"><article class="card full">
    <div class="section-title"><h2>${state.season || latestSeason()} final table</h2><span>${currentLeague().name}</span></div>
    ${tableStandings(seasonRows())}
  </article></div>`;
}
function managers() {
  const managers = currentLeague().managers;
  return `<div class="grid"><article class="card full">
    <div class="section-title"><h2>All-time manager rankings</h2><span>Sorted by titles, then wins</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Manager</th><th>Seasons</th><th>Record</th><th>Win %</th><th>Titles</th><th>Playoffs</th><th>Points for</th></tr></thead>
      <tbody>${managers.map(m => `<tr>
        <td><span class="manager"><span class="avatar">${initials(m.name)}</span><span>${m.name}<br><small>${m.firstSeason}–${m.lastSeason}</small></span></span></td>
        <td>${m.seasons}</td><td>${m.wins}-${m.losses}-${m.ties}</td><td>${pct(m.winPct)}</td>
        <td><span class="badge">${m.championships} title${m.championships === 1 ? "" : "s"}</span></td>
        <td>${m.playoffs}</td><td>${fmt.format(m.pointsFor)}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </article></div>`;
}
function history() {
  const champions = currentLeague().champions;
  return `<div class="grid"><article class="card full">
    <div class="section-title"><h2>Championship timeline</h2><span>${champions.length} recorded champions</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Season</th><th>Champion</th><th>Manager</th><th>Record</th><th>Points for</th></tr></thead>
      <tbody>${champions.map(c => `<tr><td><strong>${c.season}</strong></td><td>🏆 ${c.team}</td><td>${c.manager}</td><td>${c.record}</td><td>${fmt.format(c.pointsFor)}</td></tr>`).join("")}</tbody>
    </table></div>
  </article></div>`;
}
function records() {
  const rows = currentLeague().rows;
  const highScore = [...rows].sort((a,b) => b.pointsFor-a.pointsFor)[0];
  const lowScore = [...rows].filter(r => r.pointsFor > 0).sort((a,b) => a.pointsFor-b.pointsFor)[0];
  const bestDiff = [...rows].sort((a,b) => (b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst))[0];
  const titles = [...currentLeague().managers].sort((a,b) => b.championships-a.championships || b.wins-a.wins)[0];
  const points = [...currentLeague().managers].sort((a,b) => b.pointsFor-a.pointsFor)[0];
  const card = (label,value,sub) => `<article class="card"><div class="card-label">${label}</div><div class="stat" style="font-size:27px">${value}</div><div class="stat-sub">${sub}</div></article>`;
  return `<div class="grid">
    ${card("Highest season PF", fmt.format(highScore.pointsFor), `${highScore.team} · ${highScore.season}`)}
    ${card("Lowest season PF", fmt.format(lowScore.pointsFor), `${lowScore.team} · ${lowScore.season}`)}
    ${card("Best point differential", fmt.format(bestDiff.pointsFor-bestDiff.pointsAgainst), `${bestDiff.team} · ${bestDiff.season}`)}
    ${card("Most championships", titles.championships, `${titles.name} · ${titles.wins} career wins`)}
    ${card("Most career points", fmt.format(points.pointsFor), points.name)}
    ${card("Longest active span", Math.max(...currentLeague().managers.map(m => m.seasons)), "Seasons managed")}
  </div>`;
}
function render() {
  const league = currentLeague();
  if (!league.seasons.includes(state.season)) state.season = latestSeason();
  pageTitle.textContent = titleFor(state.view);
  navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === state.view));
  seasonSelect.value = state.season;
  content.innerHTML = ({overview, standings, managers, history, records}[state.view] || overview)();
}
function populate() {
  leagueSelect.innerHTML = Object.values(data).map(l => `<option value="${l.id}">${l.name}</option>`).join("");
  leagueSelect.value = state.leagueId;
  const league = currentLeague();
  seasonSelect.innerHTML = [...league.seasons].reverse().map(y => `<option value="${y}">${y}</option>`).join("");
  if (!state.season || !league.seasons.includes(state.season)) state.season = latestSeason();
  seasonSelect.value = state.season;
}
leagueSelect.addEventListener("change", e => {
  state.leagueId = e.target.value;
  localStorage.setItem("leagueId", state.leagueId);
  state.season = null;
  populate(); render();
});
seasonSelect.addEventListener("change", e => { state.season = Number(e.target.value); render(); });
navButtons.forEach(btn => btn.addEventListener("click", () => {
  state.view = btn.dataset.view;
  location.hash = state.view;
  render();
}));
window.addEventListener("hashchange", () => {
  state.view = location.hash.replace("#","") || "overview";
  render();
});
document.querySelector("#shareButton").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    const button = document.querySelector("#shareButton");
    button.textContent = "Link copied";
    setTimeout(() => button.textContent = "Copy page link", 1400);
  } catch {
    alert("Copy the URL from your browser to share this page.");
  }
});
populate();
render();
