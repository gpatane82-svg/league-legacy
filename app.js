const data = window.LEAGUE_DATA;
const archive = window.LEAGUE_ARCHIVE || { index: { siteManagerToOwnerId: {} }, ownerPages: [], seasonPages: [] };
const draftArchive = window.LEAGUE_DRAFT || { coverage: {}, seasons: [], draftOrders: [], ownerDraftSummary: [], keeperSummary: {}, pickLedger: [] };
const gameArchive = window.LEAGUE_GAMES || { coverage: {}, seasons: [], weeks: [], games: [], records: {}, ownerGameSummary: [], milestoneDefinitions: [] };
const awardsArchive = window.LEAGUE_AWARDS || { coverage: {}, championships: [], sackos: [], ownerHall: [], annualAwards: [] };
const searchArchive = window.LEAGUE_SEARCH || { coverage: {}, records: [] };
const loserRaw = window.LEAGUE_OF_LOSERS_RAW || { games: [], standings: [], keepers: [], championships: [], sackos: [] };

// Permanent owner identity is resolved by Manager ID, never by a guessed name match.
// These two IDs represent separate historical entities:
//   Matt     -> Matthew
//   Matthew  -> Matt/Alex
// The source IDs remain unchanged so all career facts stay attached correctly.
(function normalizeLeagueOfLosersManagerIdentity() {
  const league = data?.["5119107"];
  if (!league) return;
  const displayByManagerId = Object.freeze({
    Matt: "Matthew",
    Matthew: "Matt/Alex",
    Jos: "Joe",
    Azn: "Peter",
    Stephen: "Steven"
  });
  league.managers?.forEach(manager => {
    if (displayByManagerId[manager.id]) manager.name = displayByManagerId[manager.id];
  });
  league.rows?.forEach(row => {
    if (displayByManagerId[row.managerId]) row.manager = displayByManagerId[row.managerId];
  });
})();
const archiveOwnerForManager = managerId => {
  const ownerId = archive.index?.siteManagerToOwnerId?.[managerId];
  return archive.ownerPages?.find(owner => owner.ownerId === ownerId) || null;
};
const leagueSelect = document.querySelector("#leagueSelect");
const seasonSelect = document.querySelector("#seasonSelect");
const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const navButtons = [...document.querySelectorAll(".nav-link")];
const utilityBrand = document.querySelector("#utilityBrand");
const utilityTagline = document.querySelector("#utilityTagline");
const brandTitle = document.querySelector("#brandTitle");
const brandSubtitle = document.querySelector("#brandSubtitle");
const pageKicker = document.querySelector("#pageKicker");
const footerBrand = document.querySelector("#footerBrand");
const footerTagline = document.querySelector("#footerTagline");
const shareButton = document.querySelector("#shareButton");
const siteDescription = document.querySelector("#siteDescription");
const wordmarkLink = document.querySelector("#wordmarkLink");
const leagueSelectLabel = document.querySelector("#leagueSelectLabel");
const seasonSelectLabel = document.querySelector("#seasonSelectLabel");

// League presentation is intentionally isolated from the shared archive data.
// Batch 1 establishes the boundary; later batches supply the independent shells.
const LEAGUE_THEMES = Object.freeze({
  "26757": "art-vandelay",
  "5119107": "florida-man"
});
const DEFAULT_THEME = "art-vandelay";
const currentTheme = () => LEAGUE_THEMES[state.leagueId] || DEFAULT_THEME;
const SHELL_COPY = Object.freeze({
  "art-vandelay": {
    utilityBrand: "Vandelay Industries, Inc.",
    utilityTagline: "Fantasy Football Division · Internal Use",
    brandTitle: "Vandelay Industries",
    brandSubtitle: "Fantasy Football Division",
    kicker: "Official corporate archive",
    share: "Copy File Link",
    footerBrand: "Vandelay Industries · Fantasy Football Division",
    footerTagline: "Importing Championships. Exporting Excuses.",
    titleSuffix: "Vandelay Industries",
    description: "Vandelay Industries Fantasy Football Division — official league archive.",
    homeLabel: "Vandelay Industries home",
    leagueLabel: "League File",
    seasonLabel: "Fiscal Season",
    copied: "File Link Copied",
    nav: {
      overview: "League History", standings: "Corporate Performance", managers: "Personnel Files",
      history: "Executive Hall", records: "Records Department", transactions: "League Transactions",
      draft: "Draft Center", games: "Game Center", awards: "Awards Center", search: "Archive Search", office: "Data Office"
    }
  },
  "florida-man": {
    utilityBrand: "League of Losers · Est. 2017",
    utilityTagline: "Sunshine State Fantasy Football · Questionable Decisions Daily",
    brandTitle: "Florida Man",
    brandSubtitle: "Fantasy Football League",
    kicker: "Official Sunshine State incident report",
    share: "Copy Evidence Link",
    footerBrand: "League of Losers · Florida Man Fantasy Football",
    footerTagline: "Stay classy. Play fantasy. Talk trash.",
    titleSuffix: "League of Losers",
    description: "League of Losers — the Florida Man fantasy football archive of champions, Sackos, records, drafts, games, and questionable decisions.",
    homeLabel: "League of Losers home",
    leagueLabel: "League",
    seasonLabel: "Season",
    copied: "Evidence Link Copied",
    nav: {
      overview: "Home Base", standings: "Standings", managers: "The Suspects",
      history: "Champions", records: "Record Book", transactions: "Commissioner’s Office",
      draft: "Draft Board", games: "Game Day", awards: "Trophy Case", search: "Case Search", office: "Commissioner’s Office"
    }
  }
});
function shellCopy() { return SHELL_COPY[currentTheme()] || SHELL_COPY[DEFAULT_THEME]; }
function applyLeagueTheme() {
  const theme = currentTheme();
  const copy = shellCopy();
  document.documentElement.dataset.leagueId = state.leagueId;
  document.documentElement.dataset.leagueTheme = theme;
  document.body.dataset.leagueId = state.leagueId;
  document.body.dataset.leagueTheme = theme;
  document.body.classList.toggle("theme-art-vandelay", theme === "art-vandelay");
  document.body.classList.toggle("theme-florida-man", theme === "florida-man");
  utilityBrand.textContent = copy.utilityBrand;
  utilityTagline.textContent = copy.utilityTagline;
  brandTitle.textContent = copy.brandTitle;
  brandSubtitle.textContent = copy.brandSubtitle;
  pageKicker.textContent = copy.kicker;
  shareButton.textContent = copy.share;
  footerBrand.textContent = copy.footerBrand;
  footerTagline.textContent = copy.footerTagline;
  if (siteDescription) siteDescription.setAttribute("content", copy.description);
  if (wordmarkLink) wordmarkLink.setAttribute("aria-label", copy.homeLabel);
  if (leagueSelectLabel) leagueSelectLabel.textContent = copy.leagueLabel;
  if (seasonSelectLabel) seasonSelectLabel.textContent = copy.seasonLabel;
  navButtons.forEach(button => {
    const isFlorida = theme === "florida-man";
    const hidden = (isFlorida && ["transactions", "history"].includes(button.dataset.view))
      || (!isFlorida && button.dataset.view === "office");
    button.hidden = hidden;
    button.textContent = copy.nav[button.dataset.view] || button.textContent;
    button.setAttribute("aria-hidden", hidden ? "true" : "false");
  });
}

const state = {
  leagueId: localStorage.getItem("leagueId") || "26757",
  view: "overview",
  managerId: null,
  season: "all",
  performanceSort: { key: "overallRank", direction: "asc" },
  searchQuery: "",
  searchType: "all",
  officeMessage: "",
  standingsMode: "regular",
  gameTeamA: "",
  gameTeamB: "",
  keeperFilters: { year: "all", owner: "all", position: "all", rating: "all" },
  recordSort: { key: "avgPF", direction: "desc" }
};

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const pct = value => `${(value * 100).toFixed(1)}%`;
const currentLeague = () => data[state.leagueId];
const latestSeason = () => Math.max(...currentLeague().seasons);
const isAllSeasons = () => state.season === "all";
const selectedSeason = () => isAllSeasons() ? "All Seasons" : (state.season ?? latestSeason());
const seasonRows = () => isAllSeasons() ? currentLeague().rows : currentLeague().rows.filter(r => r.season === state.season);
const managerById = id => currentLeague().managers.find(m => m.id === id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const slug = value => String(value || "manager").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const customPortraits = {
  "John (Energy)":"assets/portraits/custom/john-energy.jpg",
  "John (Pigskin)":"assets/portraits/custom/john-pigskin.jpg",
  "Rod":"assets/portraits/custom/rod.jpg",
  "Jeff":"assets/portraits/custom/jeffrey.jpg",
  "Jeffrey":"assets/portraits/custom/jeffrey.jpg",
  "Jimmy":"assets/portraits/custom/jimmy.jpg",
  "Garrett":"assets/portraits/custom/garrett.jpg",
  "granny":"assets/portraits/custom/granny.jpg",
  "Granny":"assets/portraits/custom/granny.jpg",
  "Chandler":"assets/portraits/custom/chandler.jpg",
  "Brian":"assets/portraits/custom/brian.jpg"
};
const themedPortraits = new Set([
  "tina","stanley","dan","gabriella","jos","richard","marianne","debbie",
  "andrew","tom","billy","david","elliott","jonathan","mike","jon","merritt"
]);
const customPortraitLookup = Object.fromEntries(
  Object.entries(customPortraits).map(([name, path]) => [String(name).toLowerCase(), path])
);
const portraitPath = managerId => {
  const normalizedId = String(managerId || "").toLowerCase();
  return customPortraitLookup[normalizedId] || (themedPortraits.has(normalizedId)
    ? `assets/portraits/seinfeld/${slug(normalizedId)}.webp`
    : `assets/portraits/${slug(normalizedId)}.svg`);
};
const hallPortraitPath = managerId => customPortraits[managerId] || portraitPath(managerId);


const managerHref = managerId => `#manager/${encodeURIComponent(managerId)}`;
const managerLink = (managerId, label, className = "manager-link") => `<a class="${className}" href="${managerHref(managerId)}" data-manager-id="${esc(managerId)}">${esc(label)}</a>`;
const portrait = (managerId, name, className = "executive-portrait") => `<img class="${className}" src="${portraitPath(managerId)}" alt="Executive portrait of ${esc(name)}">`;

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "overview";
  if (raw.startsWith("manager/")) {
    state.view = "manager";
    state.managerId = decodeURIComponent(raw.slice(8));
  } else {
    const validViews = new Set(["overview", "standings", "managers", "history", "records", "transactions", "draft", "games", "awards", "search", "office"]);
    state.view = validViews.has(raw) ? raw : "overview";
    state.managerId = null;
  }
}

function titleFor(view) {
  const florida = currentTheme() === "florida-man";
  if (view === "manager") {
    const name = managerById(state.managerId)?.name;
    return name ? `${name} ${florida ? "Rap Sheet" : "Personnel File"}` : (florida ? "Manager Rap Sheet" : "Personnel File");
  }
  const titles = florida
    ? {overview:"Welcome to the Swamp",standings:"Standings",managers:"The Suspects",history:"Champions & Sackos",records:"Florida Record Book",transactions:"Commissioner’s Office",draft:"Draft Board",games:"Game Day",awards:"The Trophy Case",search:"Case Search"}
    : {overview:"League History",standings:"Corporate Performance",managers:"Personnel Files",history:"Executive Hall",records:"Records Department",transactions:"League Transactions",draft:"Draft Center",games:"Game Center",awards:"Awards Center",search:"Archive Search"};
  return titles[view] || (florida ? "League of Losers" : "Corporate Headquarters");
}

function sortedStandings(rows) {
  return [...rows].sort((a,b)=>(a.overallRank??a.regularSeasonRank??999)-(b.overallRank??b.regularSeasonRank??999)||b.wins-a.wins||b.ties-a.ties||b.pointsFor-a.pointsFor);
}
function performanceValue(row,key){const games=row.wins+row.losses+row.ties;return {overallRank:row.overallRank??row.regularSeasonRank??999,team:row.team||"",manager:row.manager||"",record:(row.wins*10000)+(row.ties*100)-row.losses,winPct:games?(row.wins+row.ties*.5)/games:0,pointsFor:Number(row.pointsFor)||0,pointsAgainst:Number(row.pointsAgainst)||0,playoffRank:row.playoffRank??999}[key];}
function sortedPerformance(rows){const {key,direction}=state.performanceSort,m=direction==="asc"?1:-1;return [...rows].sort((a,b)=>{const av=performanceValue(a,key),bv=performanceValue(b,key);if(typeof av==="string"||typeof bv==="string")return String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:"base"})*m||(performanceValue(a,"overallRank")-performanceValue(b,"overallRank"));return ((av-bv)*m)||(performanceValue(a,"overallRank")-performanceValue(b,"overallRank"));});}
function sortableHeading(label,key){const active=state.performanceSort.key===key,direction=active?state.performanceSort.direction:"none",arrow=active?(direction==="asc"?"▲":"▼"):"↕";return `<th class="sortable-th" data-sort-key="${key}" aria-sort="${active?(direction==="asc"?"ascending":"descending"):"none"}"><button type="button" class="sort-button">${label}<span aria-hidden="true">${arrow}</span></button></th>`;}

function standingsTable(rows){const sorted=sortedPerformance(rows);if(!sorted.length)return `<div class="empty">No performance report is available for this season.</div>`;return `<div class="table-wrap"><table class="sortable-table"><thead><tr>${sortableHeading("Overall Rank","overallRank")}${sortableHeading("Franchise","team")}${sortableHeading("Executive","manager")}${sortableHeading("Record","record")}${sortableHeading("Win %","winPct")}${sortableHeading("Production","pointsFor")}${sortableHeading("Allowed","pointsAgainst")}${sortableHeading("Final Finish","playoffRank")}</tr></thead><tbody>${sorted.map(r=>{const games=r.wins+r.losses+r.ties,rate=games?(r.wins+r.ties*.5)/games:0;return `<tr><td><span class="rank-cell ${r.overallRank===1?"first":""}">${r.overallRank??r.regularSeasonRank??"—"}</span></td><td><strong>${esc(r.team)}</strong></td><td>${managerLink(r.managerId,r.manager)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(rate)}</td><td>${fmt.format(r.pointsFor)}</td><td>${fmt.format(r.pointsAgainst)}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td></tr>`}).join("")}</tbody></table></div>`;}

function aggregateManagers(){return currentLeague().managers.map(m=>({managerId:m.id,manager:m.name,team:m.teams.join(" · "),wins:m.wins,losses:m.losses,ties:m.ties,pointsFor:m.pointsFor,pointsAgainst:m.pointsAgainst,overallRank:0,playoffRank:m.championships,moves:currentLeague().rows.filter(r=>r.managerId===m.id).reduce((a,r)=>a+(r.moves||0),0),trades:currentLeague().rows.filter(r=>r.managerId===m.id).reduce((a,r)=>a+(r.trades||0),0),seasons:m.seasons,championships:m.championships,playoffs:m.playoffs})).sort((a,b)=>b.wins-a.wins||b.pointsFor-a.pointsFor).map((r,i)=>({...r,overallRank:i+1}));}
function floridaOverview(){
 const league=currentLeague(),all=isAllSeasons(),season=all?latestSeason():state.season,rows=sortedStandings(league.rows.filter(r=>r.season===season)),champion=league.champions.find(c=>c.season===season),bottom=rows[rows.length-1],totalGames=Math.round(league.managers.reduce((s,m)=>s+m.wins+m.losses+m.ties,0)/2),top=[...league.managers].sort((a,b)=>b.wins-a.wins).slice(0,5),max=Math.max(...top.map(m=>m.wins),1);
 return `<section class="florida-hero-scene"><div class="florida-hero-copy"><span class="sunshine-tag">SUNSHINE STATE INCIDENT REPORT · ${league.seasons[0]}–${latestSeason()}</span><h2>${all?"WELCOME TO THE SWAMP":`${season} DISASTER REVIEW`}</h2><p>${all?`Every title, collapse, waiver crime and deeply suspicious managerial decision from ${league.seasons.length} seasons of ${esc(league.name)}.`:`The official ${season} evidence file. Facts certified. Excuses rejected.`}</p><div class="florida-hero-actions">${[["standings","VIEW THE DAMAGE"],["awards","TROPHY CASE"],["managers","MEET THE SUSPECTS"]].map(([go,label])=>`<button class="florida-action" data-go="${go}">${label}</button>`).join("")}</div></div><img class="hero-gator" src="assets/florida/gator-mascot.svg" alt="Cartoon alligator mascot holding a football"></section>
 <div class="florida-alert-ticker"><strong>BREAKING:</strong><span>${champion?`${esc(champion.team)} somehow escaped ${season} with the trophy.`:"Championship investigation remains open."}</span><span>Weather: hot, humid, and terrible for roster decisions.</span></div>
 <div class="florida-feature-grid"><article class="florida-postcard champion-postcard"><img src="assets/florida/trophy.svg" alt=""><div><span class="postcard-label">Greetings from the top</span><h2>${esc(champion?.team||"Pending")}</h2><p>${champion?`${managerLink(champion.managerId,champion.manager)} · ${champion.record}`:"Awaiting final certification"}</p><b>${season} LEAGUE CHAMPION</b></div></article><article class="florida-postcard danger-postcard"><img src="assets/florida/toilet.svg" alt=""><div><span class="postcard-label">Bottom-feeder watch</span><h2>${esc(bottom?.team||"Unknown")}</h2><p>${bottom?`${managerLink(bottom.managerId,bottom.manager)} · ${bottom.wins}-${bottom.losses}-${bottom.ties}`:"Evidence unavailable"}</p><b>DO NOT FEED AFTER MIDNIGHT</b></div></article></div>
 <div class="stats-grid"><article class="stat-card"><div class="stat-label">Years of Bad Ideas</div><div class="stat-value">${league.seasons.length}</div><div class="stat-note">${league.seasons[0]}–${latestSeason()}</div></article><article class="stat-card"><div class="stat-label">Trophies Recovered</div><div class="stat-value">${league.champions.length}</div><div class="stat-note">Mostly intact</div></article><article class="stat-card"><div class="stat-label">Known Suspects</div><div class="stat-value">${league.managers.length}</div><div class="stat-note">Aliases included</div></article><article class="stat-card"><div class="stat-label">Recorded Incidents</div><div class="stat-value">${totalGames}</div><div class="stat-note">Regular-season matchups</div></article></div>
 <div class="florida-news-grid"><section class="paper-panel florida-newspaper"><div class="newspaper-flag">THE LOSER LEDGER</div><div class="newspaper-date">Established under questionable circumstances · Permanent archive</div><h2>${all?"LOCAL MEN CONTINUE FANTASY FOOTBALL LEAGUE DESPITE YEARS OF EVIDENCE":"COMMISSIONER CERTIFIES ANOTHER SEASON OF CHAOS"}</h2><p class="newspaper-deck">Officials confirm the records are real. The management decisions remain difficult to explain.</p><div class="newspaper-columns"><p>${all?`The archive combines ${league.seasons.length} seasons into one searchable public record. Every champion, franchise identity, manager and matchup remains attached to the original season.`:`The ${season} records have been reviewed and entered into evidence. Attempts to blame injuries, weather or “bad luck” were denied.`}</p><p>${champion?`${managerLink(champion.managerId,champion.manager)}, operating under the alias ${esc(champion.team)}, was last seen carrying the league trophy away from the scene.`:"The championship file remains unresolved."}</p></div><span class="evidence-stamp">CERTIFIED FLORIDA NONSENSE</span></section><aside class="paper-panel evidence-locker"><div class="panel-heading"><h2>Evidence Locker</h2><span>Choose your next bad decision</span></div><div class="department-links">${[["standings","Standings Crime Scene"],["managers","Suspect Lineup"],["records","Record Book"],["draft","Draft Board"],["games","Game Day"],["awards","Trophy Case"]].map(([go,label],i)=>`<button class="department-link" data-go="${go}"><span><b>${String(i+1).padStart(2,"0")}</b>${label}</span><span>→</span></button>`).join("")}</div></aside></div>
 <section class="paper-panel survival-board"><div class="panel-heading"><h2>Swamp Survival Rankings</h2><span>All-time wins</span></div><div class="bar-chart">${top.map((m,i)=>`<div class="bar-row"><span><b class="survival-rank">${i+1}</b>${managerLink(m.id,m.name)}</span><span class="bar-track"><span class="bar-fill" style="width:${m.wins/max*100}%"></span></span><strong>${m.wins}</strong></div>`).join("")}</div></section>`;
}

function overview(){if(currentTheme()==="florida-man")return floridaOverview();const league=currentLeague(),all=isAllSeasons(),season=all?latestSeason():state.season,rows=sortedStandings(league.rows.filter(r=>r.season===season)),champion=league.champions.find(c=>c.season===season),leader=rows[0],totalGames=Math.round(league.managers.reduce((s,m)=>s+m.wins+m.losses+m.ties,0)/2),top=[...league.managers].sort((a,b)=>b.wins-a.wins).slice(0,5),max=Math.max(...top.map(m=>m.wins),1),titleCount=league.champions.length;return `<div class="headquarters-grid"><section class="corporate-hero"><div class="document-code">Permanent Corporate Archive · ${league.seasons[0]}–${latestSeason()}</div><h2 class="hero-title">${all?"League History":"Annual League Review"}</h2><p class="hero-copy">${all?`The complete history of the ${esc(league.name)} across ${league.seasons.length} seasons, including every champion, franchise, executive, transaction and performance record.`:`The certified ${season} record for the ${esc(league.name)}.`}</p><div class="hero-seal">Vandelay<br>Industries<br>Official</div></section><aside class="paper-panel champion-panel"><div class="panel-ribbon"><span>${all?"Most Recent Champion":"Executive of the Year"}</span><span>${season}</span></div><div class="champion-portrait">${champion?portrait(champion.managerId,champion.manager,"champion-photo"):'<div class="portrait-placeholder">VI</div>'}</div><div class="champion-copy"><div class="year">League Champion</div><h2>${esc(champion?.team||"Pending")}</h2><p>${champion?`${managerLink(champion.managerId,champion.manager)} · ${champion.record}`:"Awaiting final certification"}</p></div></aside></div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Years in Operation</div><div class="stat-value">${league.seasons.length}</div><div class="stat-note">${league.seasons[0]}–${latestSeason()}</div></article><article class="stat-card"><div class="stat-label">Certified Champions</div><div class="stat-value">${titleCount}</div><div class="stat-note">Every title in Executive Hall</div></article><article class="stat-card"><div class="stat-label">Personnel on File</div><div class="stat-value">${league.managers.length}</div><div class="stat-note">Unique Manager Adjust IDs</div></article><article class="stat-card"><div class="stat-label">Recorded Matchups</div><div class="stat-value">${totalGames}</div><div class="stat-note">Regular-season results</div></article></div><div class="lower-grid"><section class="paper-panel memo"><div class="panel-heading"><h2>Company Memorandum</h2><span>Permanent Record</span></div><div class="memo-meta"><strong>TO:</strong><span>All Fantasy Football Division Personnel</span><strong>FROM:</strong><span>Office of the Commissioner</span><strong>RE:</strong><span>${all?"Complete League History":`${season} Annual Performance Review`}</span></div><p>${all?`This archive combines all ${league.seasons.length} seasons into one permanent corporate record. Use the Fiscal Season selector to isolate any individual year.`:`The ${season} records have been reviewed and entered into the permanent corporate archive.`}</p><p>${champion?`${managerLink(champion.managerId,champion.manager)}, representing ${esc(champion.team)}, is the ${season} League Champion.`:"Championship certification remains pending."}</p></section><aside class="paper-panel"><div class="panel-heading"><h2>Department Directory</h2><span>Extension List</span></div><div class="department-links">${[["standings","Corporate Performance"],["managers","Personnel Files"],["history","Executive Hall"],["records","Records Department"],["transactions","League Transactions"],["draft","Draft Center"],["games","Game Center"],["awards","Awards Center"]].map(([go,label])=>`<button class="department-link" data-go="${go}"><span>${label}</span><span>→</span></button>`).join("")}</div></aside></div><section class="paper-panel all-time-panel"><div class="panel-heading"><h2>All-Time Wins</h2><span>Senior Personnel</span></div><div class="bar-chart">${top.map(m=>`<div class="bar-row"><span>${managerLink(m.id,m.name)}</span><span class="bar-track"><span class="bar-fill" style="width:${m.wins/max*100}%"></span></span><strong>${m.wins}</strong></div>`).join("")}</div></section>`;}
function legacyStandings(){if(!isAllSeasons())return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Annual Performance Report</h2><span>${esc(currentLeague().name)}</span></div>${standingsTable(seasonRows())}</section>`;const rows=aggregateManagers();return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>All-Time Corporate Performance</h2><span>Complete league history</span></div><div class="table-wrap"><table><thead><tr><th>Career Rank</th><th>Executive</th><th>Career Record</th><th>Win %</th><th>Seasons</th><th>Playoffs</th><th>Championships</th><th>Production</th></tr></thead><tbody>${rows.map(r=>{const games=r.wins+r.losses+r.ties;return `<tr><td><span class="rank-cell ${r.overallRank===1?"first":""}">${r.overallRank}</span></td><td>${managerLink(r.managerId,r.manager)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(games?(r.wins+r.ties*.5)/games:0)}</td><td>${r.seasons}</td><td>${r.playoffs}</td><td>${r.championships}</td><td>${fmt.format(r.pointsFor)}</td></tr>`}).join("")}</tbody></table></div></section>`;}
function managers(){if(isAllSeasons()){const rows=[...currentLeague().managers].sort((a,b)=>b.wins-a.wins);return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>Complete Personnel Directory</h2><span>All executives across every season</span></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Active Years</th><th>Career Record</th><th>Success Rate</th><th>Playoffs</th><th>Championships</th><th>Production</th></tr></thead><tbody>${rows.map(m=>`<tr><td><a class="manager-cell manager-card-link" href="${managerHref(m.id)}"><span><strong>${esc(m.name)}</strong><br><small>${m.teams.length} franchise name${m.teams.length===1?"":"s"}</small></span></a></td><td>${m.firstSeason}–${m.lastSeason}</td><td>${m.wins}-${m.losses}-${m.ties}</td><td>${pct(m.winPct)}</td><td>${m.playoffs}</td><td>${m.championships}</td><td>${fmt.format(m.pointsFor)}</td></tr>`).join("")}</tbody></table></div></section>`;}const rows=sortedStandings(seasonRows());return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Personnel Directory</h2><span>Click any employee to open the complete file</span></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Franchise</th><th>Season Record</th><th>Success Rate</th><th>Overall Rank</th><th>Final Finish</th><th>Production</th></tr></thead><tbody>${rows.map(r=>{const m=managerById(r.managerId),games=r.wins+r.losses+r.ties,rate=games?(r.wins+r.ties*.5)/games:0;return `<tr><td><a class="manager-cell manager-card-link" href="${managerHref(r.managerId)}"><span><strong>${esc(r.manager)}</strong><br><small>${m?.firstSeason||state.season}–${m?.lastSeason||state.season}</small></span></a></td><td><strong>${esc(r.team)}</strong></td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(rate)}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td></tr>`}).join("")}</tbody></table></div></section>`;}
function championPlaque(c){return `<article class="champion-plaque"><div class="hall-frame"><a href="${managerHref(c.managerId)}"><img class="hall-portrait" src="${hallPortraitPath(c.managerId)}" alt="${esc(c.manager)} — League Champion ${c.season}"></a></div><div class="hall-nameplate"><h3>${esc(c.manager)}</h3><div class="hall-rule"></div><p class="hall-title">League Champion · ${c.season}</p><p class="hall-team">${esc(c.team)}</p><p class="hall-record">Record: ${esc(c.record)} · Season Points: ${fmt.format(c.pointsFor)}</p></div></article>`;}
function history(){
  const champions=[...currentLeague().champions]
    .filter(c=>isAllSeasons()||c.season===state.season)
    .sort((a,b)=>a.season-b.season);
  if(!champions.length)return `<div class="empty">No championship record is available for this season.</div>`;
  return `<section class="executive-hall"><header class="hall-masthead"><span></span><div><h2>Executive Hall</h2><p>${isAllSeasons()?"Where Legends Are Recognized":`${state.season} League Champion`}</p></div><span></span></header><div class="hall-gallery ${champions.length===1?"single":""}">${champions.map(championPlaque).join("")}</div></section>`;
}

function recordCard(label,value,note,managerId=null){const linkedNote=managerId?managerLink(managerId,note,"record-manager-link"):esc(note);return `<article class="stat-card record-card"><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${linkedNote}</div></article>`;}
function scoringRows(){
  const games=selectedLoserGames(), map=new Map();
  const ensure=n=>{n=loserCanonicalName(n);if(!map.has(n))map.set(n,{owner:n,pf:0,pa:0,games:0,high:-Infinity,low:Infinity});return map.get(n)};
  games.forEach(g=>{const a=ensure(g.teamA),b=ensure(g.teamB),sa=Number(g.scoreA)||0,sb=Number(g.scoreB)||0;for(const [r,pf,pa] of [[a,sa,sb],[b,sb,sa]]){r.pf+=pf;r.pa+=pa;r.games++;r.high=Math.max(r.high,pf);r.low=Math.min(r.low,pf)}});
  const rows=[...map.values()].map(r=>({...r,avgPF:r.games?r.pf/r.games:0,avgPA:r.games?r.pa/r.games:0,high:Number.isFinite(r.high)?r.high:0,low:Number.isFinite(r.low)?r.low:0}));
  const {key,direction}=state.recordSort, mult=direction==="asc"?1:-1;
  return rows.sort((a,b)=>{const av=a[key],bv=b[key];return typeof av==="string"?mult*av.localeCompare(bv):mult*(av-bv)});
}
function records(){
  if(currentTheme()!=="florida-man"){const rows=seasonRows();if(!rows.length)return `<div class="empty">No records are available.</div>`;const high=[...rows].sort((a,b)=>b.pointsFor-a.pointsFor)[0],low=[...rows].filter(r=>r.pointsFor>0).sort((a,b)=>a.pointsFor-b.pointsFor)[0],diff=[...rows].sort((a,b)=>(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst))[0];return `<div class="record-grid">${recordCard("Highest Production",fmt.format(high.pointsFor),`${high.season} · ${high.team} · ${high.manager}`,high.managerId)}${recordCard("Lowest Production",fmt.format(low.pointsFor),`${low.season} · ${low.team} · ${low.manager}`,low.managerId)}${recordCard("Best Point Differential",fmt.format(diff.pointsFor-diff.pointsAgainst),`${diff.season} · ${diff.team} · ${diff.manager}`,diff.managerId)}</div>`;}
  const games=selectedLoserGames();if(!games.length)return `<div class="empty">No records are available.</div>`;
  const performances=games.flatMap(g=>[{name:loserCanonicalName(g.teamA),score:Number(g.scoreA),opp:Number(g.scoreB),year:g.year,week:g.week},{name:loserCanonicalName(g.teamB),score:Number(g.scoreB),opp:Number(g.scoreA),year:g.year,week:g.week}]);
  const high=[...performances].sort((a,b)=>b.score-a.score)[0],low=[...performances].sort((a,b)=>a.score-b.score)[0],blow=[...games].map(g=>({g,margin:Math.abs(Number(g.scoreA)-Number(g.scoreB))})).sort((a,b)=>b.margin-a.margin)[0],avg=performances.reduce((a,x)=>a+x.score,0)/performances.length;
  const map=new Map();performances.forEach(x=>{const r=map.get(x.name)||{name:x.name,pf:0,pa:0,games:0,high:-Infinity,low:Infinity};r.pf+=x.score;r.pa+=x.opp;r.games++;r.high=Math.max(r.high,x.score);r.low=Math.min(r.low,x.score);map.set(x.name,r);});const rows=[...map.values()].map(r=>({...r,avgPf:r.pf/r.games,avgPa:r.pa/r.games})).sort((a,b)=>b.avgPf-a.avgPf);
  return `<div class="record-grid">${recordCard("Highest Score",fmt.format(high.score),`${high.name} · ${high.year} Wk ${high.week}`,loserManagerId(high.name))}${recordCard("Lowest Score",fmt.format(low.score),`${low.name} · ${low.year} Wk ${low.week}`,loserManagerId(low.name))}${recordCard("Biggest Blowout",fmt.format(blow.margin),`${loserCanonicalName(blow.g.teamA)} ${fmt.format(blow.g.scoreA)} – ${fmt.format(blow.g.scoreB)} ${loserCanonicalName(blow.g.teamB)}`)}${recordCard("League Avg Score",fmt.format(avg),`across ${performances.length} team-games`)}</div><section class="paper-panel table-panel"><div class="panel-heading"><h2>Scoring</h2><span>${isAllSeasons()?"All seasons":state.season} · sorted by Avg PF</span></div><div class="table-wrap"><table><thead><tr><th><button type="button" data-record-sort="0" data-type="text">Owner</button></th><th><button type="button" data-record-sort="1">Avg PF</button></th><th><button type="button" data-record-sort="2">Avg PA</button></th><th><button type="button" data-record-sort="3">Game High</button></th><th><button type="button" data-record-sort="4">Game Low</button></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${loserOwnerLink(r.name)}</td><td>${fmt.format(r.avgPf)}</td><td>${fmt.format(r.avgPa)}</td><td>${fmt.format(r.high)}</td><td>${fmt.format(r.low)}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function transactions(){if(isAllSeasons()){const rows=aggregateManagers().sort((a,b)=>b.moves-a.moves||b.trades-a.trades),totalMoves=rows.reduce((s,r)=>s+r.moves,0),totalTrades=rows.reduce((s,r)=>s+r.trades,0);return `<div class="stats-grid two-stats"><article class="stat-card"><div class="stat-label">Total Roster Moves</div><div class="stat-value">${totalMoves}</div><div class="stat-note">Across all recorded seasons</div></article><article class="stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${totalTrades}</div><div class="stat-note">Across all recorded seasons</div></article></div><section class="paper-panel table-panel"><div class="panel-heading"><h2>All-Time Corporate Transaction Ledger</h2><span>League Transactions · Complete History</span></div><div class="table-wrap"><table><thead><tr><th>Executive</th><th>Seasons</th><th>Roster Moves</th><th>Trades</th><th>Career Record</th><th>Championships</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${managerLink(r.managerId,r.manager)}</td><td>${r.seasons}</td><td>${r.moves}</td><td>${r.trades}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${r.championships}</td></tr>`).join("")}</tbody></table></div></section>`;}const rows=sortedStandings(seasonRows()),totalMoves=rows.reduce((s,r)=>s+(r.moves||0),0),totalTrades=rows.reduce((s,r)=>s+(r.trades||0),0);return `<div class="stats-grid two-stats"><article class="stat-card"><div class="stat-label">Roster Moves</div><div class="stat-value">${totalMoves}</div><div class="stat-note">Waiver and roster moves in ${state.season}</div></article><article class="stat-card"><div class="stat-label">Trades</div><div class="stat-value">${totalTrades}</div><div class="stat-note">Certified trades in ${state.season}</div></article></div><section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Corporate Transaction Ledger</h2><span>League Transactions · Transaction Control</span></div><div class="table-wrap"><table><thead><tr><th>Franchise</th><th>Executive</th><th>Roster Moves</th><th>Trades</th><th>Draft Position</th><th>Final Finish</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.team)}</strong></td><td>${managerLink(r.managerId,r.manager)}</td><td>${r.moves||0}</td><td>${r.trades||0}</td><td>${r.draftPosition||"—"}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td></tr>`).join("")}</tbody></table></div></section>`;}
function legacyDraftCenter(){
  const coverage=draftArchive.coverage||{};
  const season=isAllSeasons()?null:draftArchive.seasons.find(s=>s.season===state.season);
  const keeperRating=k=>{if(k.ratingOverride)return k.ratingOverride;const a=Number(k.keptRank),b=Number(k.finish);if(!a||!b)return "Unrated";if(b<=a-3)return "Good";if(b>=a+8)return "Bad";return "Neutral";};
  const orderRows=season?.draftOrder||[];
  const keeperRows=season?.keepers||[];
  if(!isAllSeasons())return `<div class="draft-source-note"><strong>Certified source boundary:</strong> Draft order and keeper selections are on file. Pick-by-pick player selections are awaiting a trustworthy source and are not inferred.</div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Draft Slots</div><div class="stat-value">${orderRows.length}</div><div class="stat-note">${state.season} order entries</div></article><article class="stat-card"><div class="stat-label">Keepers</div><div class="stat-value">${keeperRows.length}</div><div class="stat-note">Immutable imported facts</div></article><article class="stat-card"><div class="stat-label">Pick Ledger</div><div class="stat-value">—</div><div class="stat-note">Awaiting source</div></article></div><div class="draft-grid"><section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Draft Order</h2><span>Opening position registry</span></div>${orderRows.length?`<div class="draft-board">${orderRows.map(r=>`<article class="draft-slot"><span class="draft-number">${r.draftPosition}</span><div><strong>${esc(r.franchiseName)}</strong><small>${managerLink(r.siteManagerId,r.manager)}</small></div><span class="draft-finish">Finish ${r.finalFinish?`#${r.finalFinish}`:"—"}</span></article>`).join("")}</div>`:`<div class="empty">No draft-order record is available for this season.</div>`}</section><section class="paper-panel table-panel florida-keeper-registry"><div class="panel-heading"><h2>${state.season} Keeper Registry</h2><span>${keeperRows.length} selections</span></div>${keeperRows.length?`<div class="table-wrap"><table><thead><tr><th>Executive</th><th>Franchise</th><th>Player</th><th>Pos.</th><th>Kept Rank</th><th>Finish</th><th>Rating</th></tr></thead><tbody>${keeperRows.map(k=>`<tr><td>${k.ownerId&&archive.index?.ownerIdToSiteManager?.[k.ownerId]?managerLink(archive.index.ownerIdToSiteManager[k.ownerId],k.canonicalName):esc(k.canonicalName||k.sourceName)}</td><td>${esc(k.franchiseName||"Unmatched historical branding")}</td><td><strong>${esc(k.player)}</strong></td><td>${esc(k.position||"—")}</td><td>${k.keptRank??"—"}</td><td>${k.finish??"—"}</td><td><span class="keeper-rating ${keeperRating(k).toLowerCase()}">${keeperRating(k)}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No keeper selections are recorded for this season.</div>`}</section></div>`;
  const owners=[...(draftArchive.ownerDraftSummary||[])].sort((a,b)=>a.averageDraftPosition-b.averageDraftPosition||b.seasonsWithDraftSlot-a.seasonsWithDraftSlot);
  const positions=Object.entries(draftArchive.keeperSummary?.positionCounts||{}).sort((a,b)=>b[1]-a[1]);
  return `<div class="draft-source-note"><strong>Archive status:</strong> ${coverage.draftOrderEntries||0} draft-slot facts and ${coverage.keeperEntries||0} keeper facts are certified. The pick-by-pick ledger is ready for a future trustworthy import but remains empty.</div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Draft Seasons</div><div class="stat-value">${coverage.draftOrderSeasons||0}</div><div class="stat-note">Annual order boards</div></article><article class="stat-card"><div class="stat-label">Draft Slots</div><div class="stat-value">${coverage.draftOrderEntries||0}</div><div class="stat-note">Certified entries</div></article><article class="stat-card"><div class="stat-label">Keeper Seasons</div><div class="stat-value">${coverage.keeperSeasons||0}</div><div class="stat-note">${coverage.keeperEntries||0} selections</div></article><article class="stat-card"><div class="stat-label">Draft Picks</div><div class="stat-value">0</div><div class="stat-note">Awaiting source import</div></article></div><div class="draft-grid"><section class="paper-panel table-panel"><div class="panel-heading"><h2>All-Time Draft Position Ledger</h2><span>Permanent owner rollup</span></div><div class="table-wrap"><table><thead><tr><th>Executive</th><th>Seasons</th><th>Average Slot</th><th>Best Slot</th><th>First Overall</th><th>Top Three</th><th>Keepers</th></tr></thead><tbody>${owners.map(o=>`<tr><td>${o.siteManagerId?managerLink(o.siteManagerId,o.displayName):esc(o.displayName)}</td><td>${o.seasonsWithDraftSlot}</td><td>${o.averageDraftPosition.toFixed(2)}</td><td>#${o.bestDraftPosition}</td><td>${o.firstOverallSlots}</td><td>${o.topThreeSlots}</td><td>${o.keeperCount}</td></tr>`).join("")}</tbody></table></div></section><aside class="paper-panel"><div class="panel-heading"><h2>Keeper Position Mix</h2><span>All recorded selections</span></div><div class="keeper-position-list">${positions.map(([pos,count])=>`<div><strong>${esc(pos)}</strong><span>${count}</span></div>`).join("")}</div><div class="panel-heading secondary-heading"><h2>Repeat Keepers</h2><span>Players kept more than once</span></div><div class="tag-list">${(draftArchive.keeperSummary?.repeatPlayers||[]).slice(0,12).map(p=>`<span>${esc(p.player)} · ${p.count}</span>`).join("")||"<span>None</span>"}</div></aside></div>`;
}

function initials(name){return String(name||"").split(/\s+|&/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();}
function archiveOwnerPanel(managerId){const owner=archiveOwnerForManager(managerId);if(!owner)return "";const a=owner.accolades||{},r=owner.topRivalries?.[0],keeperCount=owner.keepers?.length||0;const rival=r?(r.opponentSiteManagerId?managerLink(r.opponentSiteManagerId,r.opponentSiteManagerId):esc(r.opponentOwnerId.replace(/^owner_/,""))):"—";return `<section class="paper-panel archive-owner-panel"><div class="panel-heading"><h2>Historical Archive Index</h2><span>Permanent owner ID · ${esc(owner.ownerId)}</span></div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Certified Titles</div><div class="stat-value">${a.championships?.count||0}</div><div class="stat-note">${(a.championships?.years||[]).join(" · ")||"None on file"}</div></article><article class="stat-card"><div class="stat-label">Sackos</div><div class="stat-value">${a.sackos?.count||0}</div><div class="stat-note">${(a.sackos?.years||[]).join(" · ")||"None on file"}</div></article><article class="stat-card"><div class="stat-label">Keeper Facts</div><div class="stat-value">${keeperCount}</div><div class="stat-note">Immutable imported records</div></article><article class="stat-card"><div class="stat-label">Most Frequent Rival</div><div class="stat-value">${r?r.games:"—"}</div><div class="stat-note">${rival}${r?` · ${r.wins}-${r.losses}-${r.ties}`:""}</div></article></div></section>`;}

function legacyManagerFile(){const m=managerById(state.managerId);if(!m)return `<div class="empty">This personnel file could not be located.</div>`;const career=currentLeague().rows.filter(r=>r.managerId===m.id).sort((a,b)=>b.season-a.season),selected=isAllSeasons()?null:career.find(r=>r.season===state.season),titles=currentLeague().champions.filter(c=>c.managerId===m.id).sort((a,b)=>b.season-a.season),best=[...career].sort((a,b)=>(a.overallRank??999)-(b.overallRank??999)||b.pointsFor-a.pointsFor)[0];return `<section class="personnel-dossier"><div class="dossier-header paper-panel"><a class="dossier-portrait-link" href="${portraitPath(m.id)}" target="_blank" rel="noopener">${portrait(m.id,m.name,"dossier-portrait")}</a><div class="dossier-identity"><div class="document-code">Confidential Personnel Record · ID ${esc(m.id)}</div><h2>${esc(m.name)}</h2><p>Fantasy Football Division Executive</p><div class="dossier-badges"><span>${m.firstSeason}–${m.lastSeason}</span><span>${m.seasons} Seasons</span><span>${m.championships} Championship${m.championships===1?"":"s"}</span></div></div><div class="dossier-stamp">PERSONNEL<br>FILE</div></div><div class="stats-grid dossier-stats"><article class="stat-card"><div class="stat-label">Career Record</div><div class="stat-value">${m.wins}-${m.losses}-${m.ties}</div><div class="stat-note">${pct(m.winPct)} success rate</div></article><article class="stat-card"><div class="stat-label">Career Production</div><div class="stat-value">${fmt.format(m.pointsFor)}</div><div class="stat-note">${fmt.format(m.pointsAgainst)} allowed</div></article><article class="stat-card"><div class="stat-label">Playoff Appearances</div><div class="stat-value">${m.playoffs}</div><div class="stat-note">Across ${m.seasons} seasons</div></article><article class="stat-card"><div class="stat-label">Best Overall Rank</div><div class="stat-value">#${best?.overallRank??"—"}</div><div class="stat-note">${best?.season||"—"} · ${esc(best?.team||"")}</div></article></div><div class="dossier-grid"><section class="paper-panel"><div class="panel-heading"><h2>${isAllSeasons()?"Career Summary":`${state.season} Assignment`}</h2><span>${isAllSeasons()?"All seasons combined":"Season-controlled view"}</span></div>${isAllSeasons()?`<div class="assignment-card"><h3>${m.seasons} seasons on file</h3><p><strong>${m.wins}-${m.losses}-${m.ties}</strong> career record · ${m.playoffs} playoff appearances · ${m.championships} championship${m.championships===1?"":"s"}</p><p>${fmt.format(m.pointsFor)} career points · ${career.reduce((a,r)=>a+(r.moves||0),0)} roster moves · ${career.reduce((a,r)=>a+(r.trades||0),0)} trades</p></div>`:selected?`<div class="assignment-card"><h3>${esc(selected.team)}</h3>${selected.manager!==m.name?`<p class="co-owner-line"><strong>Ownership:</strong> ${esc(selected.manager)}</p>`:""}<p><strong>${selected.wins}-${selected.losses}-${selected.ties}</strong> · Overall Rank #${selected.overallRank} · Final Finish ${selected.playoffRank?`#${selected.playoffRank}`:"—"}</p><p>${fmt.format(selected.pointsFor)} points for · ${fmt.format(selected.pointsAgainst)} allowed · ${selected.moves||0} moves · ${selected.trades||0} trades</p></div>`:`<div class="empty compact">No active assignment for ${state.season}.</div>`}<div class="panel-heading secondary-heading"><h2>Known Franchises</h2><span>${m.teams.length} names on file</span></div><div class="tag-list">${m.teams.map(t=>`<span>${esc(t)}</span>`).join("")}</div></section><section class="paper-panel"><div class="panel-heading"><h2>Executive Appointments</h2><span>Championship certifications</span></div>${titles.length?titles.map(c=>`<a class="appointment-row" href="#history" data-season-jump="${c.season}"><strong>${c.season}</strong><span>${esc(c.team)}</span><span>${c.record}</span></a>`).join(""):`<div class="empty compact">No championship appointments on file.</div>`}</section></div><section class="paper-panel table-panel career-ledger"><div class="panel-heading"><h2>Career Performance Ledger</h2><span>All seasons · newest first</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Franchise / Ownership</th><th>Record</th><th>Overall Rank</th><th>Final Finish</th><th>Production</th><th>Transactions</th></tr></thead><tbody>${career.map(r=>`<tr class="${!isAllSeasons()&&r.season===state.season?"selected-season-row":""}"><td><button class="season-jump" data-season-jump="${r.season}">${r.season}</button></td><td><strong>${esc(r.team)}</strong>${r.manager!==m.name?`<br><small>${esc(r.manager)}</small>`:""}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td><td>${r.moves||0} moves · ${r.trades||0} trades</td></tr>`).join("")}</tbody></table></div></section>${archiveOwnerPanel(m.id)}</section>`;}


const loserAlias = Object.freeze({ Azn: "Peter", Jos: "Joe", Slay: "Steven", Stephen: "Steven", Matt: "Matthew" });
const loserManagerAlias = Object.freeze({ Peter: "Azn", Joe: "Jos", Steven: "Stephen", Slay: "Stephen", "Matt/Alex": "Matthew", Matthew: "Matt", Matt: "Matt", Will: "William", Dan: "Daniel", Gabi: "Gabriella" });
function loserCanonicalName(name){ return loserAlias[name] || name || "Unknown"; }
function loserManagerId(name){
  const canonical=loserCanonicalName(name);
  const league=currentLeague();
  const managerName=loserManagerAlias[canonical]||canonical;
  return league.managers.find(m=>m.id===managerName || m.name===managerName || m.id===canonical || m.name===canonical || m.id===name || m.name===name)?.id || null;
}
function loserOwnerLink(name){
  const id=loserManagerId(name);
  return id?managerLink(id,loserCanonicalName(name)):esc(loserCanonicalName(name));
}
function parseScorePair(score){
  const parts=String(score||"").match(/-?\d+(?:\.\d+)?/g)||[];
  return [Number(parts[0]||0),Number(parts[1]||0)];
}
function rankOf(list,id,valueFn,descending=true){
  const sorted=[...list].sort((a,b)=>descending?valueFn(b)-valueFn(a):valueFn(a)-valueFn(b));
  const index=sorted.findIndex(x=>x.id===id);
  return index<0?"—":index+1;
}

function activeLoserOwners(){
  const latest=Math.max(...loserRaw.standings.map(r=>Number(r.year)||0),...loserRaw.games.map(g=>Number(g.year)||0));
  return new Set(loserRaw.standings.filter(r=>Number(r.year)===latest).map(r=>loserCanonicalName(r.team)));
}
function ownerStatusClass(name){ return activeLoserOwners().has(loserCanonicalName(name))?"active-owner":"former-owner"; }
function statusOwnerLink(name){ return `<span class="${ownerStatusClass(name)}">${loserOwnerLink(name)}</span>`; }
function standingsGameRows(playoffsOnly=false){
  const games=loserRaw.games.filter(g=>(isAllSeasons()||Number(g.year)===Number(state.season))&&(!playoffsOnly||g.isPlayoff));
  const map=new Map();
  const ensure=n=>{n=loserCanonicalName(n);if(!map.has(n))map.set(n,{owner:n,wins:0,losses:0,ties:0,pf:0,pa:0,games:0});return map.get(n)};
  games.forEach(g=>{const a=ensure(g.teamA),b=ensure(g.teamB),sa=Number(g.scoreA)||0,sb=Number(g.scoreB)||0;a.pf+=sa;a.pa+=sb;a.games++;b.pf+=sb;b.pa+=sa;b.games++;if(sa===sb){a.ties++;b.ties++;}else if(sa>sb){a.wins++;b.losses++;}else{b.wins++;a.losses++;}});
  const sackos=loserRaw.sackos.filter(x=>isAllSeasons()||Number(x.year)===Number(state.season));
  sackos.forEach(x=>{const n=loserCanonicalName(x.winner),r=ensure(n);r.sackos=(r.sackos||0)+1});
  return [...map.values()].map(r=>({...r,winPct:r.games?(r.wins+r.ties*.5)/r.games:0,avgPF:r.games?r.pf/r.games:0,sackos:r.sackos||0}))
    .sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins||b.pf-a.pf);
}
function standings(){
  if(currentTheme()!=="florida-man") return legacyStandings();
  const mode=state.standingsMode;
  const scopeGames=loserRaw.games.filter(g=>isAllSeasons()||g.year===state.season).filter(g=>mode!=="playoff"||g.isPlayoff||g.isChampionship||g.isSacko||g.gameType==="sacko");
  const statMap=new Map();
  scopeGames.forEach(g=>{const a=loserCanonicalName(g.teamA),b=loserCanonicalName(g.teamB),sa=Number(g.scoreA)||0,sb=Number(g.scoreB)||0;for(const n of [a,b])if(!statMap.has(n))statMap.set(n,{name:n,wins:0,losses:0,ties:0,pf:0,pa:0,games:0});const A=statMap.get(a),B=statMap.get(b);A.pf+=sa;A.pa+=sb;A.games++;B.pf+=sb;B.pa+=sa;B.games++;if(sa===sb){A.ties++;B.ties++;}else if(sa>sb){A.wins++;B.losses++;}else{B.wins++;A.losses++;}});
  const sackoCounts={};loserRaw.sackos.filter(x=>isAllSeasons()||x.year===state.season).forEach(x=>{const n=loserCanonicalName(x.winner);sackoCounts[n]=(sackoCounts[n]||0)+1;});
  const rows=[...statMap.values()].map(r=>{
    const manager=managerById(loserManagerId(r.name));
    const seasonStanding=loserRaw.standings.find(x=>Number(x.year)===Number(state.season)&&loserCanonicalName(x.team)===r.name);
    const titles=isAllSeasons()
      ? loserRaw.championships.filter(c=>loserCanonicalName(c.winner)===r.name).length
      : loserRaw.championships.filter(c=>Number(c.year)===Number(state.season)&&loserCanonicalName(c.winner)===r.name).length;
    const playoffAppearances=isAllSeasons()
      ? (manager?.playoffs||0)
      : ((Number(seasonStanding?.regularSeasonRank||seasonStanding?.divisionRank||999)<=6)?1:0);
    return {...r,winPct:r.games?(r.wins+r.ties*.5)/r.games:0,avgPf:r.games?r.pf/r.games:0,sackos:sackoCounts[r.name]||0,titles,playoffAppearances};
  }).sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins||b.pf-a.pf||a.name.localeCompare(b.name));
  return `<div class="view-toggle" role="group" aria-label="Standings view"><button class="${mode==="regular"?"active":""}" data-standings-mode="regular">Overall</button><button class="${mode==="playoff"?"active":""}" data-standings-mode="playoff">Playoffs</button></div><section class="paper-panel table-panel"><div class="panel-heading"><h2>${isAllSeasons()?"All-Time":state.season} ${mode==="playoff"?"Playoff":"Overall"} Standings</h2><span>${scopeGames.length} games in this view</span></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Owner</th><th>Record</th><th>Win %</th><th>PF</th><th>PA</th><th>Avg PF</th><th>Titles</th><th>Playoff Appearances</th><th>Sackos</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><span class="rank-cell ${i===0?"first":""}">${i+1}</span></td><td>${loserOwnerLink(r.name)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(r.winPct)}</td><td>${fmt.format(r.pf)}</td><td>${fmt.format(r.pa)}</td><td>${fmt.format(r.avgPf)}</td><td>${r.titles}</td><td>${r.playoffAppearances}</td><td>${r.sackos}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No records are available for this view.</div>`}</section>`;
}
function bindStandingsMode(){
  document.querySelectorAll("[data-standings-mode]").forEach(btn=>btn.addEventListener("click",()=>{
    state.standingsMode=btn.dataset.standingsMode;
    render();
  }));
}

function keeperRating(k){
  if(String(k.ratingOverride||"").trim()) return String(k.ratingOverride).trim();
  const kept=Number(k.keptRank), finish=Number(k.finish);
  if(!kept||!finish) return "Neutral";
  if(finish<=kept-3) return "Good";
  if(finish>=kept+8) return "Bad";
  return "Neutral";
}
function draftCenter(){
  if(currentTheme()!=="florida-man") return legacyDraftCenter();
  const years=[...new Set(loserRaw.keepers.map(k=>k.year))].sort((a,b)=>b-a);
  const owners=[...new Set(loserRaw.keepers.map(k=>loserCanonicalName(k.team)))].sort();
  const positions=[...new Set(loserRaw.keepers.map(k=>k.pos).filter(Boolean))].sort();
  if(!isAllSeasons()) state.keeperFilters.year=String(state.season);
  const f=state.keeperFilters;
  const rows=loserRaw.keepers.filter(k=>
    (f.year==="all"||String(k.year)===String(f.year)) &&
    (f.owner==="all"||loserCanonicalName(k.team)===f.owner) &&
    (f.position==="all"||k.pos===f.position) &&
    (f.rating==="all"||keeperRating(k)===f.rating)
  ).sort((a,b)=>b.year-a.year||loserCanonicalName(a.team).localeCompare(loserCanonicalName(b.team))||a.player.localeCompare(b.player));
  const allForScope=loserRaw.keepers.filter(k=>f.year==="all"||String(k.year)===String(f.year));
  const counts={Good:0,Neutral:0,Bad:0}; allForScope.forEach(k=>counts[keeperRating(k)]++);
  const options=(values,current)=>values.map(v=>`<option value="${esc(v)}" ${String(v)===String(current)?"selected":""}>${esc(v)}</option>`).join("");
  return `<div class="stats-grid"><article class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${allForScope.length}</div><div class="stat-note">Keeper decisions on file</div></article><article class="stat-card"><div class="stat-label">Good</div><div class="stat-value">${counts.Good}</div><div class="stat-note">Beat keeper cost</div></article><article class="stat-card"><div class="stat-label">Neutral</div><div class="stat-value">${counts.Neutral}</div><div class="stat-note">Roughly held value</div></article><article class="stat-card"><div class="stat-label">Bad</div><div class="stat-value">${counts.Bad}</div><div class="stat-note">Failed to return value</div></article></div>
  <section class="paper-panel keeper-controls"><div class="filter-grid">
  <label>Year<select id="keeperYear"><option value="all">All Years</option>${options(years,f.year)}</select></label>
  <label>Owner<select id="keeperOwner"><option value="all">All Owners</option>${options(owners,f.owner)}</select></label>
  <label>Position<select id="keeperPosition"><option value="all">All Positions</option>${options(positions,f.position)}</select></label>
  <label>Rating<select id="keeperRating"><option value="all">All Ratings</option>${options(["Good","Neutral","Bad"],f.rating)}</select></label>
  </div></section>
  <section class="paper-panel table-panel"><div class="panel-heading"><h2>Keeper History</h2><span>${rows.length} matching decisions</span></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Year</th><th>Owner</th><th>Player</th><th>Position</th><th>Kept Rank</th><th>Finish Rank</th><th>Auto Rating</th><th>Final Rating</th><th>Notes</th></tr></thead><tbody>${rows.map(k=>{const auto={...k,ratingOverride:""};return `<tr><td>${k.year}</td><td>${loserOwnerLink(k.team)}</td><td><strong>${esc(k.player)}</strong></td><td>${esc(k.pos||"—")}</td><td>${k.keptRank??"—"}</td><td>${k.finish??"—"}</td><td>${keeperRating(auto)}</td><td><span class="keeper-rating ${keeperRating(k).toLowerCase()}">${keeperRating(k)}</span></td><td>${esc(k.notes||"—")}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">No keeper decisions match these filters.</div>`}</section>`;
}
function bindKeeperFilters(){
  const map={keeperYear:"year",keeperOwner:"owner",keeperPosition:"position",keeperRating:"rating"};
  Object.entries(map).forEach(([id,key])=>document.querySelector(`#${id}`)?.addEventListener("change",e=>{
    state.keeperFilters[key]=e.target.value;
    if(key==="year" && e.target.value!=="all"){
      state.season=Number(e.target.value); seasonSelect.value=e.target.value;
    } else if(key==="year" && e.target.value==="all"){
      state.season="all"; seasonSelect.value="all";
    }
    render();
  }));
}

function selectedLoserGames(){
  return loserRaw.games.filter(g=>isAllSeasons()||g.year===state.season);
}
function gameOwners(){
  return [...new Set(selectedLoserGames().flatMap(g=>[loserCanonicalName(g.teamA),loserCanonicalName(g.teamB)]))].sort();
}
function matchupGames(a,b){
  return selectedLoserGames().filter(g=>{
    const ga=loserCanonicalName(g.teamA), gb=loserCanonicalName(g.teamB);
    return (ga===a&&gb===b)||(ga===b&&gb===a);
  }).sort((x,y)=>y.year-x.year||y.week-x.week);
}
function matchupSummary(a,b){
  const games=matchupGames(a,b); let aw=0,bw=0,t=0;
  games.forEach(g=>{const ga=loserCanonicalName(g.teamA),sa=Number(g.scoreA),sb=Number(g.scoreB);if(sa===sb)t++;else {const winner=sa>sb?ga:loserCanonicalName(g.teamB);if(winner===a)aw++;else bw++;}});
  return {games,aw,bw,t};
}
function gameCenter(){
  if(currentTheme()!=="florida-man") return legacyGameCenter();
  const owners=gameOwners();
  if(!owners.length) return `<div class="empty">No game data is available.</div>`;
  if(!owners.includes(state.gameTeamA)) state.gameTeamA=owners[0];
  if(!owners.includes(state.gameTeamB)||state.gameTeamB===state.gameTeamA) state.gameTeamB=owners.find(x=>x!==state.gameTeamA)||owners[0];
  const a=state.gameTeamA,b=state.gameTeamB,s=matchupSummary(a,b);
  const optionList=(selected)=>owners.map(o=>`<option value="${esc(o)}" ${o===selected?"selected":""}>${activeLoserOwners().has(o)?"● ":""}${esc(o)}</option>`).join("");
  const matrix=owners.map(row=>`<tr><th>${statusOwnerLink(row)}</th>${owners.map(col=>{
    if(row===col)return `<td class="matrix-self">—</td>`;
    const r=matchupSummary(row,col);
    return `<td><button class="matrix-cell" data-team-a="${esc(row)}" data-team-b="${esc(col)}" title="${esc(row)} vs ${esc(col)}">${r.aw}-${r.bw}${r.t?`-${r.t}`:""}</button></td>`;
  }).join("")}</tr>`).join("");
  return `<section class="paper-panel matchup-explorer"><div class="matchup-selectors"><label>Team A<select id="gameTeamA">${optionList(a)}</select></label><strong>VS</strong><label>Team B<select id="gameTeamB">${optionList(b)}</select></label></div>
  <div class="series-summary"><article><span>${esc(a)}</span><strong>${s.aw}</strong></article><div><b>${s.games.length} games</b><small>${s.t?`${s.t} tie${s.t===1?"":"s"}`:"All-time series"}</small></div><article><strong>${s.bw}</strong><span>${esc(b)}</span></article></div></section>
  <section class="paper-panel table-panel"><div class="panel-heading"><h2>Matchup History</h2><span>${esc(a)} vs. ${esc(b)}</span></div>${s.games.length?`<div class="table-wrap"><table><thead><tr><th>Year</th><th>Week</th><th>${esc(a)}</th><th>${esc(b)}</th><th>Winner</th><th>Notes</th></tr></thead><tbody>${s.games.map(g=>{const ga=loserCanonicalName(g.teamA),aScore=ga===a?g.scoreA:g.scoreB,bScore=ga===b?g.scoreA:g.scoreB,winner=Number(aScore)===Number(bScore)?"Tie":Number(aScore)>Number(bScore)?a:b;return `<tr><td>${g.year}</td><td>${g.week}</td><td>${fmt.format(aScore)}</td><td>${fmt.format(bScore)}</td><td>${winner==="Tie"?"Tie":loserOwnerLink(winner)}</td><td>${g.isChampionship?"Championship":g.isSacko||g.gameType==="sacko"?"Sacko Bowl":g.isPlayoff?"Playoff":""}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">These owners have not played in the selected scope.</div>`}</section>
  <section class="paper-panel table-panel matchup-matrix"><div class="panel-heading"><h2>All-Time Grid</h2><span>Click any cell to open that series</span></div><div class="table-wrap"><table><thead><tr><th>Owner</th>${owners.map(o=>`<th><span class="${ownerStatusClass(o)}">${esc(o)}</span></th>`).join("")}</tr></thead><tbody>${matrix}</tbody></table></div></section>`;
}
function renderGameInPlace(){const y=window.scrollY;content.innerHTML=gameCenter();bindInternalLinks();bindGameExplorer();requestAnimationFrame(()=>window.scrollTo(0,y));}
function bindGameExplorer(){
  document.querySelector("#gameTeamA")?.addEventListener("change",e=>{state.gameTeamA=e.target.value;if(state.gameTeamA===state.gameTeamB)state.gameTeamB=gameOwners().find(x=>x!==state.gameTeamA)||state.gameTeamB;renderGameInPlace();});
  document.querySelector("#gameTeamB")?.addEventListener("change",e=>{state.gameTeamB=e.target.value;if(state.gameTeamA===state.gameTeamB)state.gameTeamA=gameOwners().find(x=>x!==state.gameTeamB)||state.gameTeamA;renderGameInPlace();});
  document.querySelectorAll(".matrix-cell").forEach(btn=>btn.addEventListener("click",()=>{state.gameTeamA=btn.dataset.teamA;state.gameTeamB=btn.dataset.teamB;renderGameInPlace();}));
}

function awardsCenter(){
  if(currentTheme()!=="florida-man") return legacyAwardsCenter();
  const titles=loserRaw.championships.filter(x=>isAllSeasons()||x.year===state.season).sort((a,b)=>b.year-a.year);
  const sackos=loserRaw.sackos.filter(x=>isAllSeasons()||x.year===state.season).sort((a,b)=>b.year-a.year);
  const gameCard=(x,type)=>{const [a,b]=parseScorePair(x.score);return `<article class="trophy-game ${type}"><div class="trophy-year">${x.year}</div><div class="trophy-result"><span>${type==="championship"?"Champion":"Sacko Recipient"}</span><h3>${loserOwnerLink(x.winner)}</h3><strong>${esc(x.score)}</strong><p>${type==="championship"?"defeated":"lost the Sacko Bowl to"} ${loserOwnerLink(x.runnerUp)}</p></div></article>`;};
  return `<div class="stats-grid"><article class="stat-card"><div class="stat-label">Championship Games</div><div class="stat-value">${titles.length}</div><div class="stat-note">${isAllSeasons()?"Defining victories":"Selected season"}</div></article><article class="stat-card"><div class="stat-label">Sacko Bowls</div><div class="stat-value">${sackos.length}</div><div class="stat-note">${isAllSeasons()?"Defining disasters":"Selected season"}</div></article></div>
  <div class="trophy-case-grid"><section class="paper-panel"><div class="panel-heading"><h2>Championship Games</h2><span>Winner, runner-up and final score</span></div><div class="trophy-game-list">${titles.map(x=>gameCard(x,"championship")).join("")||'<div class="empty">No championship game recorded.</div>'}</div></section>
  <section class="paper-panel"><div class="panel-heading"><h2>Sacko Games</h2><span>Recipient, opponent and final score</span></div><div class="trophy-game-list">${sackos.map(x=>gameCard(x,"sacko")).join("")||'<div class="empty">No Sacko game recorded.</div>'}</div></section></div>`;
}

function floridaManagerFile(){
  const m=managerById(state.managerId); if(!m)return `<div class="empty">This owner could not be located.</div>`;
  const career=currentLeague().rows.filter(r=>r.managerId===m.id).sort((a,b)=>b.season-a.season);
  const selected=isAllSeasons()?null:career.find(r=>r.season===state.season);
  const managers=currentLeague().managers;
  const titles=loserRaw.championships.filter(x=>loserManagerId(x.winner)===m.id);
  const sackos=loserRaw.sackos.filter(x=>loserManagerId(x.winner)===m.id);
  const gameProfile=gameArchive.ownerGameSummary?.find(o=>o.siteManagerId===m.id);
  const rivals=archiveOwnerForManager(m.id)?.topRivalries||[];
  const favorite=[...rivals].sort((a,b)=>(b.wins-b.losses)-(a.wins-a.losses)||b.games-a.games)[0];
  const biggest=[...rivals].sort((a,b)=>b.games-a.games)[0];
  const winsRank=rankOf(managers,m.id,x=>x.wins);
  const pointsRank=rankOf(managers,m.id,x=>x.pointsFor);
  const titleRank=rankOf(managers,m.id,x=>loserRaw.championships.filter(c=>loserManagerId(c.winner)===x.id).length);
  const winPctRank=rankOf(managers,m.id,x=>x.winPct);
  const best=[...career].sort((a,b)=>(a.overallRank??999)-(b.overallRank??999)||b.pointsFor-a.pointsFor)[0];
  const rivalName=r=>r?(r.opponentSiteManagerId?managerLink(r.opponentSiteManagerId,r.opponentSiteManagerId):esc(r.opponentOwnerId?.replace(/^owner_/,"")||"—")):"—";
  return `<section class="owner-file"><div class="paper-panel owner-heading"><div><span class="document-code">Owner File · ${esc(m.id)}</span><h2>${esc(m.name)}</h2><p>${m.firstSeason}–${m.lastSeason} · ${m.seasons} seasons</p></div><div class="dossier-badges"><span>${titles.length} Championship${titles.length===1?"":"s"}</span><span>${sackos.length} Sacko${sackos.length===1?"":"s"}</span></div></div>
  <div class="stats-grid"><article class="stat-card"><div class="stat-label">Career Record</div><div class="stat-value">${m.wins}-${m.losses}-${m.ties}</div><div class="stat-note">#${winsRank} in league wins</div></article><article class="stat-card"><div class="stat-label">Win Percentage</div><div class="stat-value">${pct(m.winPct)}</div><div class="stat-note">#${winPctRank} league rank</div></article><article class="stat-card"><div class="stat-label">Career Points</div><div class="stat-value">${fmt.format(m.pointsFor)}</div><div class="stat-note">#${pointsRank} league rank</div></article><article class="stat-card"><div class="stat-label">Championship Rank</div><div class="stat-value">#${titleRank}</div><div class="stat-note">${titles.length} title${titles.length===1?"":"s"}</div></article></div>
  <div class="dossier-grid"><section class="paper-panel"><div class="panel-heading"><h2>${isAllSeasons()?"Career Snapshot":`${state.season} Season`}</h2><span>Data-first owner profile</span></div>${isAllSeasons()?`<div class="assignment-card"><p><strong>${m.playoffs}</strong> playoff appearances · Best overall rank <strong>#${best?.overallRank??"—"}</strong> (${best?.season||"—"})</p><p>${fmt.format(m.pointsFor)} points for · ${fmt.format(m.pointsAgainst)} points against</p></div>`:selected?`<div class="assignment-card"><h3>${esc(selected.team)}</h3><p><strong>${selected.wins}-${selected.losses}-${selected.ties}</strong> · Overall #${selected.overallRank} · Final ${selected.playoffRank?`#${selected.playoffRank}`:"—"}</p><p>${fmt.format(selected.pointsFor)} PF · ${fmt.format(selected.pointsAgainst)} PA</p></div>`:`<div class="empty compact">No season record for ${state.season}.</div>`}</section>
  <section class="paper-panel"><div class="panel-heading"><h2>Rivalry Report</h2><span>Certified game history</span></div><div class="assignment-card"><p><strong>Most-played rival:</strong> ${rivalName(biggest)}${biggest?` · ${biggest.games} games · ${biggest.wins}-${biggest.losses}-${biggest.ties}`:""}</p><p><strong>Favorite victim:</strong> ${rivalName(favorite)}${favorite?` · ${favorite.wins}-${favorite.losses}-${favorite.ties}`:""}</p><p><strong>Game-log high:</strong> ${gameProfile?.highScore==null?"—":fmt.format(gameProfile.highScore)}</p></div></section></div>
  <section class="paper-panel table-panel"><div class="panel-heading"><h2>Career Timeline</h2><span>Newest season first</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Team</th><th>Record</th><th>Overall Rank</th><th>Final Finish</th><th>Points</th></tr></thead><tbody>${career.map(r=>`<tr><td><button class="season-jump" data-season-jump="${r.season}">${r.season}</button></td><td>${esc(r.team)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td></tr>`).join("")}</tbody></table></div></section></section>`;
}
function managerFile(){ return currentTheme()==="florida-man"?floridaManagerFile():legacyManagerFile(); }

function bindPerformanceSort(){document.querySelectorAll("[data-sort-key]").forEach(h=>h.querySelector("button")?.addEventListener("click",()=>{const key=h.dataset.sortKey;if(state.performanceSort.key===key)state.performanceSort.direction=state.performanceSort.direction==="asc"?"desc":"asc";else state.performanceSort={key,direction:["team","manager"].includes(key)?"asc":"desc"};render();}));}
function bindInternalLinks(){document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{location.hash=b.dataset.go;}));document.querySelectorAll("[data-season-jump]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();state.season=Number(el.dataset.seasonJump);localStorage.setItem(`season:${state.leagueId}`,String(state.season));populate();if(el.getAttribute("href")==="#history")location.hash="history";else render();}));}

function commissionerStore(){try{return JSON.parse(localStorage.getItem("lolCommissionerData")||"{}")||{}}catch{return {}}}
function saveCommissionerStore(v){localStorage.setItem("lolCommissionerData",JSON.stringify(v));}
function commissionerOffice(){
  if(currentTheme()!=="florida-man")return transactions();
  const saved=commissionerStore(),keepers=saved.keepers||[],games=saved.games||[],titles=saved.championships||[],sackos=saved.sackos||[],overrides=saved.overrides||[];
  return `<div class="stats-grid"><article class="stat-card"><div class="stat-label">Manual Keepers</div><div class="stat-value">${keepers.length}</div><div class="stat-note">Saved in this browser</div></article><article class="stat-card"><div class="stat-label">Imported Games</div><div class="stat-value">${games.length}</div><div class="stat-note">Awaiting export/publish</div></article><article class="stat-card"><div class="stat-label">Manual Results</div><div class="stat-value">${titles.length+sackos.length}</div><div class="stat-note">Championships and Sackos</div></article><article class="stat-card"><div class="stat-label">Overrides</div><div class="stat-value">${overrides.length}</div><div class="stat-note">Audit trail retained</div></article></div>
  <section class="commissioner-grid"><article class="paper-panel"><div class="panel-heading"><h2>Import Season Data</h2><span>JSON export or normalized game array</span></div><label class="office-field">Season export<input id="seasonImport" type="file" accept="application/json,.json"></label><p class="office-help">The importer previews the file and accepts either a <code>games</code> array or a League of Losers backup. Nothing is published until you export the merged backup.</p><div id="importPreview" class="empty compact">No file selected.</div></article>
  <article class="paper-panel"><div class="panel-heading"><h2>Add Keeper</h2><span>Manual commissioner entry</span></div><form id="keeperForm" class="office-form"><input name="year" type="number" min="2017" required placeholder="Year"><input name="team" required placeholder="Owner"><input name="player" required placeholder="Player"><input name="pos" placeholder="Position"><input name="keptRank" type="number" placeholder="Kept rank"><input name="finish" type="number" placeholder="Finish rank"><input name="notes" placeholder="Notes"><button type="submit">Save Keeper</button></form></article>
  <article class="paper-panel"><div class="panel-heading"><h2>Confirm Annual Result</h2><span>Championship or Sacko</span></div><form id="resultForm" class="office-form"><select name="type"><option value="championships">Championship</option><option value="sackos">Sacko</option></select><input name="year" type="number" min="2017" required placeholder="Year"><input name="winner" required placeholder="Winner / recipient"><input name="runnerUp" required placeholder="Runner-up / opponent"><input name="score" required placeholder="Score, e.g. 120.4-110.2"><button type="submit">Save Result</button></form></article>
  <article class="paper-panel"><div class="panel-heading"><h2>Commissioner Override</h2><span>Original fact remains documented</span></div><form id="overrideForm" class="office-form"><input name="path" required placeholder="Record path or ID"><input name="original" placeholder="Original value"><input name="corrected" required placeholder="Corrected value"><input name="reason" required placeholder="Reason"><button type="submit">Save Override</button></form></article></section>
  <section class="paper-panel office-actions"><div class="panel-heading"><h2>Backup & Publish Preparation</h2><span>Local changes do not modify the deployed site automatically</span></div><div class="office-buttons"><button id="exportCommissioner">Export Merged JSON Backup</button><button id="clearCommissioner" class="secondary">Clear Local Draft Changes</button></div><p class="office-help">Export creates a complete JSON file combining the certified archive with these local manual additions. Keep that file as the canonical backup for the next deployment.</p></section>`;
}
function bindRecordSort(){document.querySelectorAll("[data-record-sort]").forEach(btn=>btn.addEventListener("click",()=>{const table=btn.closest("table"),body=table?.tBodies?.[0];if(!body)return;const index=Number(btn.dataset.recordSort),text=btn.dataset.type==="text",direction=btn.dataset.direction==="asc"?"desc":"asc";document.querySelectorAll("[data-record-sort]").forEach(x=>delete x.dataset.direction);btn.dataset.direction=direction;const rows=[...body.rows].sort((a,b)=>{const av=a.cells[index]?.textContent.trim()||"",bv=b.cells[index]?.textContent.trim()||"";const cmp=text?av.localeCompare(bv):(Number(av.replace(/,/g,""))-Number(bv.replace(/,/g,"")));return direction==="asc"?cmp:-cmp;});rows.forEach(r=>body.appendChild(r));}));}

function bindCommissionerOffice(){
 const add=(key,value)=>{const s=commissionerStore();(s[key]||(s[key]=[])).push(value);saveCommissionerStore(s);render();};
 document.querySelector("#keeperForm")?.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));add("keepers",{id:`manual_keeper_${Date.now()}`,year:Number(d.year),team:d.team,player:d.player,pos:d.pos,keptRank:Number(d.keptRank)||null,finish:Number(d.finish)||null,ratingOverride:"",notes:d.notes,source:"manual"});});
 document.querySelector("#resultForm")?.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));add(d.type,{id:`manual_${d.type}_${Date.now()}`,year:Number(d.year),winner:d.winner,runnerUp:d.runnerUp,score:d.score,source:"manual"});});
 document.querySelector("#overrideForm")?.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));add("overrides",{...d,id:`override_${Date.now()}`,createdAt:new Date().toISOString()});});
 document.querySelector("#seasonImport")?.addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;const box=document.querySelector("#importPreview");try{const parsed=JSON.parse(await file.text()),games=Array.isArray(parsed)?parsed:(parsed.games||[]);if(!Array.isArray(games))throw new Error("No games array found");box.className="import-preview";box.innerHTML=`<strong>${games.length} games found.</strong><button id="acceptImport" type="button">Add to Local Draft</button>`;document.querySelector("#acceptImport").onclick=()=>{const s=commissionerStore();s.games=[...(s.games||[]),...games.map(g=>({...g,source:g.source||"import"}))];saveCommissionerStore(s);render();};}catch(err){box.className="empty compact";box.textContent=`Could not read import: ${err.message}`;}});
 document.querySelector("#exportCommissioner")?.addEventListener("click",()=>{const s=commissionerStore(),merged={...loserRaw,version:(loserRaw.version||2)+1,savedAt:new Date().toISOString(),games:[...loserRaw.games,...(s.games||[])],keepers:[...loserRaw.keepers,...(s.keepers||[])],championships:[...loserRaw.championships,...(s.championships||[])],sackos:[...loserRaw.sackos,...(s.sackos||[])],commissionerOverrides:s.overrides||[]};const blob=new Blob([JSON.stringify(merged,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`league_of_losers_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);});
 document.querySelector("#clearCommissioner")?.addEventListener("click",()=>{if(confirm("Clear all local draft imports and manual entries?")){localStorage.removeItem("lolCommissionerData");render();}});
}

function gameManagerLink(id,label){return id?managerLink(id,label):esc(label||"Unknown");}
function gameLine(g){return `<article class="game-ledger-row"><div class="game-week">${g.year||g.season} · W${g.week}</div><div class="game-team"><strong>${gameManagerLink(g.teamASiteManagerId,g.teamACanonicalName)}</strong><small>${esc(g.teamASourceName||"")}</small></div><div class="game-score ${g.scoreA>g.scoreB?"winner":""}">${fmt.format(g.scoreA)}</div><div class="game-versus">vs.</div><div class="game-score ${g.scoreB>g.scoreA?"winner":""}">${fmt.format(g.scoreB)}</div><div class="game-team right"><strong>${gameManagerLink(g.teamBSiteManagerId,g.teamBCanonicalName)}</strong><small>${esc(g.teamBSourceName||"")}</small></div>${g.isChampionship?'<span class="game-badge">Championship</span>':g.isPlayoff?'<span class="game-badge">Playoff</span>':''}</article>`;}
function performanceLine(p){return `<tr><td>${p.season}</td><td>W${p.week}</td><td>${gameManagerLink(p.siteManagerId,p.manager)}</td><td><strong>${fmt.format(p.score)}</strong></td><td>${esc(p.opponent||"—")}</td><td>${fmt.format(p.opponentScore)}</td></tr>`;}
function legacyGameCenter(){
 const coverage=gameArchive.coverage||{};
 if(!isAllSeasons()){
  const summary=gameArchive.seasons.find(s=>s.season===state.season);
  const rows=gameArchive.games.filter(g=>g.year===state.season).sort((a,b)=>b.week-a.week||String(a.id).localeCompare(String(b.id)));
  const weeks=gameArchive.weeks.filter(w=>w.season===state.season).sort((a,b)=>a.week-b.week);
  if(!summary)return `<div class="empty">No certified game log is available for ${state.season}.</div>`;
  return `<div class="game-source-note"><strong>Certified game log:</strong> Every score below comes directly from the immutable normalized game facts.</div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Games</div><div class="stat-value">${summary.gameCount}</div><div class="stat-note">${summary.weeks} recorded weeks</div></article><article class="stat-card"><div class="stat-label">Average Score</div><div class="stat-value">${fmt.format(summary.averageTeamScore)}</div><div class="stat-note">Per team performance</div></article><article class="stat-card"><div class="stat-label">High Score</div><div class="stat-value">${fmt.format(summary.highestScore.score)}</div><div class="stat-note">${esc(summary.highestScore.manager)} · W${summary.highestScore.week}</div></article><article class="stat-card"><div class="stat-label">Closest Game</div><div class="stat-value">${fmt.format(summary.closestGame.margin)}</div><div class="stat-note">Point margin</div></article></div><div class="game-center-grid"><section class="paper-panel"><div class="panel-heading"><h2>${state.season} Game Ledger</h2><span>${rows.length} certified matchups</span></div><div class="game-ledger">${rows.map(gameLine).join("")}</div></section><aside class="paper-panel"><div class="panel-heading"><h2>Weekly Dispatches</h2><span>Scoring leaders</span></div><div class="weekly-dispatches">${weeks.map(w=>`<article><strong>Week ${w.week}</strong><span>${esc(w.highestScore.manager)} · ${fmt.format(w.highestScore.score)}</span><small>${w.gameCount} games · ${fmt.format(w.averageTeamScore)} avg.</small></article>`).join("")}</div></aside></div>`;
 }
 const high=(gameArchive.records?.highestTeamScores||[]).slice(0,10), blowouts=(gameArchive.records?.largestBlowouts||[]).slice(0,8), owners=(gameArchive.ownerGameSummary||[]).slice(0,12);
 return `<div class="game-source-note"><strong>Archive coverage:</strong> ${coverage.games||0} immutable games across ${coverage.seasons||0} seasons and ${coverage.weeklySummaries||0} weekly summaries.</div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Recorded Games</div><div class="stat-value">${coverage.games||0}</div><div class="stat-note">${coverage.teamPerformances||0} team performances</div></article>${(gameArchive.milestoneDefinitions||[]).map(m=>`<article class="stat-card"><div class="stat-label">${esc(m.label)}</div><div class="stat-value">${m.count}</div><div class="stat-note">Certified scoring milestones</div></article>`).join("")}</div><div class="game-center-grid"><section class="paper-panel table-panel"><div class="panel-heading"><h2>Highest Team Scores</h2><span>All-time top ten</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Week</th><th>Executive</th><th>Score</th><th>Opponent</th><th>Opp. Score</th></tr></thead><tbody>${high.map(performanceLine).join("")}</tbody></table></div></section><aside class="paper-panel"><div class="panel-heading"><h2>Largest Blowouts</h2><span>Margin records</span></div><div class="record-game-list">${blowouts.map(g=>`<article><strong>${fmt.format(g.margin)} points</strong><span>${esc(g.teamACanonicalName)} ${fmt.format(g.scoreA)}–${fmt.format(g.scoreB)} ${esc(g.teamBCanonicalName)}</span><small>${g.year} · Week ${g.week}</small></article>`).join("")}</div></aside></div><section class="paper-panel table-panel game-owner-table"><div class="panel-heading"><h2>Owner Game Profiles</h2><span>Derived from game facts</span></div><div class="table-wrap"><table><thead><tr><th>Executive</th><th>Games</th><th>Record</th><th>Win %</th><th>Avg. Score</th><th>High</th><th>Largest Win</th></tr></thead><tbody>${owners.map(o=>`<tr><td>${gameManagerLink(o.siteManagerId,o.displayName)}</td><td>${o.games}</td><td>${o.wins}-${o.losses}-${o.ties}</td><td>${pct(o.winPercentage)}</td><td>${fmt.format(o.averageScore)}</td><td>${fmt.format(o.highScore)}</td><td>${o.largestWin==null?"—":fmt.format(o.largestWin)}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function awardOwnerLink(ownerId,label){const row=awardsArchive.ownerHall?.find(o=>o.ownerId===ownerId);return row?.siteManagerId?managerLink(row.siteManagerId,label):esc(label||"Unknown");}
function legacyAwardsCenter(){
 const coverage=awardsArchive.coverage||{};
 if(!isAllSeasons()){
  const annual=awardsArchive.annualAwards?.find(x=>x.season===state.season);
  const title=awardsArchive.championships?.find(x=>x.year===state.season);
  const sacko=awardsArchive.sackos?.find(x=>x.year===state.season);
  if(!annual&&!title&&!sacko)return `<div class="empty">No certified awards are available for ${state.season}.</div>`;
  return `<div class="award-source-note"><strong>Two distinct sources:</strong> Championship and Sacko honors are immutable imported facts. Performance awards are calculations from certified game scores.</div><div class="award-season-hero"><article class="paper-panel award-feature champion-award"><span class="award-kicker">League Champion</span><h2>${esc(title?.winner?.franchiseName||title?.winner?.canonicalName||"Pending")}</h2><p>${title?`${awardOwnerLink(title.winner.ownerId,title.winner.canonicalName)} defeated ${esc(title.runnerUp.canonicalName)} · ${esc(title.scoreText)}`:"No championship event recorded"}</p></article><article class="paper-panel award-feature sacko-award"><span class="award-kicker">Sacko Recipient</span><h2>${esc(sacko?.winner?.franchiseName||sacko?.winner?.canonicalName||"Pending")}</h2><p>${sacko?`${awardOwnerLink(sacko.winner.ownerId,sacko.winner.canonicalName)} · ${esc(sacko.scoreText)}`:"No Sacko event recorded"}</p></article></div><section class="paper-panel"><div class="panel-heading"><h2>${state.season} Performance Awards</h2><span>Derived honors</span></div><div class="award-card-grid">${(annual?.awards||[]).map(a=>`<article class="award-card"><span>${esc(a.label)}</span><h3>${a.ownerId?awardOwnerLink(a.ownerId,a.recipient):esc(a.recipient)}</h3><strong>${fmt.format(a.value)}</strong><small>${esc(a.detail)}</small></article>`).join("")}</div></section>`;
 }
 const leaders=(awardsArchive.ownerHall||[]).filter(o=>o.championships||o.runnerUps||o.sackos).slice(0,15);
 return `<div class="award-source-note"><strong>Hall coverage:</strong> ${coverage.championships||0} championships, ${coverage.sackos||0} Sackos, and ${coverage.annualAwards||0} derived performance awards.</div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Championships</div><div class="stat-value">${coverage.championships||0}</div><div class="stat-note">Commissioner-certified history</div></article><article class="stat-card"><div class="stat-label">Sackos</div><div class="stat-value">${coverage.sackos||0}</div><div class="stat-note">League of Losers history</div></article><article class="stat-card"><div class="stat-label">Award Seasons</div><div class="stat-value">${coverage.seasonsWithAwards||0}</div><div class="stat-note">Game-log coverage</div></article><article class="stat-card"><div class="stat-label">Performance Honors</div><div class="stat-value">${coverage.annualAwards||0}</div><div class="stat-note">Evidence-linked calculations</div></article></div><div class="awards-layout"><section class="paper-panel table-panel"><div class="panel-heading"><h2>Hall of Achievement</h2><span>Permanent owner identities</span></div><div class="table-wrap"><table><thead><tr><th>Executive</th><th>Titles</th><th>Runner-Up</th><th>Sackos</th><th>Keepers</th><th>Championship Years</th></tr></thead><tbody>${leaders.map(o=>`<tr><td>${awardOwnerLink(o.ownerId,o.name)}</td><td><strong>${o.championships}</strong></td><td>${o.runnerUps}</td><td>${o.sackos}</td><td>${o.keepers}</td><td>${o.championshipYears.length?o.championshipYears.join(", "):"—"}</td></tr>`).join("")}</tbody></table></div></section><aside class="paper-panel"><div class="panel-heading"><h2>Championship Roll</h2><span>Newest first</span></div><div class="championship-roll">${[...(awardsArchive.championships||[])].reverse().map(c=>`<article><strong>${c.year}</strong><span>${awardOwnerLink(c.winner.ownerId,c.winner.canonicalName)}</span><small>${esc(c.winner.franchiseName||"")} · ${esc(c.scoreText)}</small></article>`).join("")}</div></aside></div>`;
}

function searchCenter(){
 const records=searchArchive.records||[], q=state.searchQuery.trim().toLowerCase(), type=state.searchType;
 const filtered=records.filter(r=>(type==="all"||r.type===type)&&(!q||r.searchText.includes(q))).slice(0,100);
 const types=Object.entries(searchArchive.coverage?.types||{});
 return `<div class="search-hero paper-panel"><div><p class="kicker">Cross-department records request</p><h2>Search the Entire Archive</h2><p>Owners, franchises, seasons, games, rivalries, draft positions, keepers, championships, Sackos, and awards.</p></div><div class="search-count"><strong>${searchArchive.coverage?.records||0}</strong><span>indexed records</span></div></div><div class="archive-search-controls"><label><span>Search terms</span><input id="archiveSearchInput" type="search" value="${esc(state.searchQuery)}" placeholder="Try an owner, team, season, player, or score" autocomplete="off"></label><label><span>Department</span><select id="archiveSearchType"><option value="all">All departments</option>${types.map(([k,v])=>`<option value="${esc(k)}" ${type===k?"selected":""}>${esc(k[0].toUpperCase()+k.slice(1))} (${v})</option>`).join("")}</select></label></div><div class="search-results-heading"><strong>${filtered.length}${filtered.length===100?"+":""} results</strong><span>${q?`for “${esc(state.searchQuery)}”`:"Showing the first 100 indexed records"}</span></div><div class="archive-search-results">${filtered.length?filtered.map(r=>`<button class="search-result-card" type="button" data-search-view="${esc(r.view)}" data-search-season="${r.season??""}" data-search-manager="${esc(r.managerId||"")}"><span class="search-result-type">${esc(r.type)}</span><strong>${esc(r.title)}</strong><small>${esc(r.subtitle)}</small></button>`).join(""):`<div class="empty">No archive records match this request.</div>`}</div>`;
}
function bindSearchCenter(){
 const input=document.querySelector("#archiveSearchInput"), type=document.querySelector("#archiveSearchType");
 if(input) input.addEventListener("input",e=>{state.searchQuery=e.target.value; content.innerHTML=searchCenter(); bindSearchCenter(); document.querySelector("#archiveSearchInput")?.focus();});
 if(type) type.addEventListener("change",e=>{state.searchType=e.target.value; content.innerHTML=searchCenter(); bindSearchCenter();});
 document.querySelectorAll(".search-result-card").forEach(btn=>btn.addEventListener("click",()=>{const season=btn.dataset.searchSeason; if(season){state.season=Number(season); localStorage.setItem(`season:${state.leagueId}`,season);} const manager=btn.dataset.searchManager; if(manager){location.hash=`manager/${encodeURIComponent(manager)}`;} else {location.hash=btn.dataset.searchView||"overview"; if(location.hash.replace(/^#/,"")===state.view) render();}}));
}

function render(preserveScroll=false){applyLeagueTheme();if(currentTheme()==="florida-man"&&state.view==="history")state.view="awards";const league=currentLeague();if(state.season!=="all"&&!league.seasons.includes(Number(state.season)))state.season="all";if(state.view==="manager"&&!managerById(state.managerId)){state.view="managers";state.managerId=null;}const title=titleFor(state.view);pageTitle.textContent=title;document.title=`${title} | ${shellCopy().titleSuffix}`;navButtons.forEach(btn=>btn.classList.toggle("active",btn.dataset.view===(state.view==="manager"?"managers":state.view)));seasonSelect.value=String(state.season);localStorage.setItem(`season:${state.leagueId}`,String(state.season));content.innerHTML=({overview,standings,managers,manager:managerFile,history,records,transactions:commissionerOffice,draft:draftCenter,games:gameCenter,awards:awardsCenter,search:searchCenter,office:commissionerOffice}[state.view]||overview)();bindInternalLinks();if(state.view==="standings"){if(currentTheme()==="florida-man")bindStandingsMode();else if(!isAllSeasons())bindPerformanceSort();}if(state.view==="draft"&&currentTheme()==="florida-man")bindKeeperFilters();if(state.view==="games"&&currentTheme()==="florida-man")bindGameExplorer();if(state.view==="records"&&currentTheme()==="florida-man")bindRecordSort();if(state.view==="transactions"&&currentTheme()==="florida-man")bindCommissionerOffice();if(state.view==="search")bindSearchCenter();if(state.view==="office")bindCommissionerOffice();if(!preserveScroll){if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)window.scrollTo({top:0,behavior:"smooth"});else window.scrollTo(0,0);}}
function populate(){leagueSelect.innerHTML=Object.values(data).map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join("");if(!data[state.leagueId])state.leagueId=Object.keys(data)[0];leagueSelect.value=state.leagueId;const league=currentLeague();seasonSelect.innerHTML=`<option value="all">All Seasons</option>`+[...league.seasons].reverse().map(y=>`<option value="${y}">${y}</option>`).join("");const remembered=localStorage.getItem(`season:${state.leagueId}`);if(state.season===null||state.season===undefined)state.season=remembered==="all"||league.seasons.includes(Number(remembered))?(remembered==="all"?"all":Number(remembered)):"all";seasonSelect.value=String(state.season);}
leagueSelect.addEventListener("change",e=>{state.leagueId=e.target.value;localStorage.setItem("leagueId",state.leagueId);state.season="all";populate();if(state.view==="manager"&&!managerById(state.managerId))location.hash="managers";else render();});
seasonSelect.addEventListener("change",e=>{state.season=e.target.value==="all"?"all":Number(e.target.value);localStorage.setItem(`season:${state.leagueId}`,String(state.season));render();});
navButtons.forEach(b=>b.addEventListener("click",()=>location.hash=b.dataset.view));
window.addEventListener("hashchange",()=>{parseHash();render();});
document.querySelector("#shareButton").addEventListener("click",async()=>{const b=document.querySelector("#shareButton");try{await navigator.clipboard.writeText(location.href);b.textContent=shellCopy().copied;setTimeout(()=>b.textContent=shellCopy().share,1400);}catch{alert("Copy the address from your browser to share this page.");}});
parseHash();populate();render();
