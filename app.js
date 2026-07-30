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
  // Audited identity boundary. These are separate permanent owners and must
  // never inherit one another's titles, rivals, awards, or career facts.
  const auditedOwnerIds = Object.freeze({
    Matt: "owner_matt",          // Displayed as Matthew
    Matthew: "owner_matt_alex"   // Displayed as Matt/Alex
  });
  const ownerId = auditedOwnerIds[managerId] || archive.index?.siteManagerToOwnerId?.[managerId];
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
    utilityTagline: "Official Fantasy Football Historical Archive",
    brandTitle: "League of Losers",
    brandSubtitle: "Fantasy Football · Established 2017",
    kicker: "Official league archive",
    share: "Copy Page Link",
    footerBrand: "League of Losers · Historical Archive",
    footerTagline: "Every season. Every owner. Every bad decision.",
    titleSuffix: "League of Losers",
    description: "League of Losers — the Florida Man fantasy football archive of champions, Sackos, records, drafts, games, and questionable decisions.",
    homeLabel: "League of Losers home",
    leagueLabel: "League",
    seasonLabel: "Season",
    copied: "Page Link Copied",
    nav: {
      overview: "Home", standings: "Standings", managers: "The Suspects",
      history: "Champions", records: "Record Book", transactions: "Transactions",
      draft: "Draft Board", games: "Game Day", awards: "Trophy Case", search: "Archive Search", office: "Commissioner’s Office"
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
    const hidden = (isFlorida && ["transactions"].includes(button.dataset.view))
      || (!isFlorida && button.dataset.view === "office");
    button.hidden = hidden;
    button.textContent = copy.nav[button.dataset.view] || button.textContent;
    button.setAttribute("aria-hidden", hidden ? "true" : "false");
  });
}

const state = {
  leagueId: localStorage.getItem("leagueId") || "5119107",
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
  rivalryOwnerFilter: "active",
  keeperFilters: { year: "all", owner: "all", position: "all", rating: "all" },
  recordSort: { key: "avgPf", direction: "desc" },
  recordFilters: { owner: "all", query: "" },
  ownerFilter: "active",
  ownerQuery: "",
  ownerSort: "wanted"
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
const customPortraitLookup = Object.fromEntries(
  Object.entries(customPortraits).map(([name, path]) => [String(name).toLowerCase(), path])
);
const portraitPath = managerId => {
  const normalizedId = String(managerId || "").toLowerCase();
  if(currentTheme()==="florida-man") return `assets/portraits/suspects/${slug(normalizedId)}.png`;
  return customPortraitLookup[normalizedId] || `assets/portraits/${slug(normalizedId)}.svg`;
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
    ? {overview:"League of Losers",standings:"Standings",managers:"The Suspects",history:"Champions & Sackos",records:"Record Book",transactions:"Commissioner’s Office",draft:"Draft Board",games:"Game Day",awards:"The Trophy Case",search:"Archive Search"}
    : {overview:"League History",standings:"Corporate Performance",managers:"Personnel Files",history:"Executive Hall",records:"Records Department",transactions:"League Transactions",draft:"Draft Center",games:"Game Center",awards:"Awards Center",search:"Archive Search"};
  return titles[view] || (florida ? "League of Losers" : "Corporate Headquarters");
}

function sortedStandings(rows) {
  return [...rows].sort((a,b)=>(a.overallRank??a.regularSeasonRank??999)-(b.overallRank??b.regularSeasonRank??999)||b.wins-a.wins||b.ties-a.ties||b.pointsFor-a.pointsFor);
}
function performanceValue(row,key){const games=row.wins+row.losses+row.ties;return {overallRank:row.overallRank??row.regularSeasonRank??999,team:row.team||"",manager:row.manager||"",record:(row.wins*10000)+(row.ties*100)-row.losses,winPct:games?(row.wins+row.ties*.5)/games:0,pointsFor:Number(row.pointsFor)||0,pointsAgainst:Number(row.pointsAgainst)||0,avgPf:Number(row.avgPf??row.avgPF)||0,titles:Number(row.titles)||0,sackos:Number(row.sackos)||0,playoffApps:Number(row.playoffApps)||0,playoffRank:row.playoffRank??999}[key];}
function sortedPerformance(rows){const {key,direction}=state.performanceSort,m=direction==="asc"?1:-1;return [...rows].sort((a,b)=>{const av=performanceValue(a,key),bv=performanceValue(b,key);if(typeof av==="string"||typeof bv==="string")return String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:"base"})*m||(performanceValue(a,"overallRank")-performanceValue(b,"overallRank"));return ((av-bv)*m)||(performanceValue(a,"overallRank")-performanceValue(b,"overallRank"));});}
function sortableHeading(label,key){const active=state.performanceSort.key===key,direction=active?state.performanceSort.direction:"none",arrow=active?(direction==="asc"?"▲":"▼"):"↕";return `<th class="sortable-th" data-sort-key="${key}" aria-sort="${active?(direction==="asc"?"ascending":"descending"):"none"}"><button type="button" class="sort-button">${label}<span aria-hidden="true">${arrow}</span></button></th>`;}

function standingsTable(rows){const sorted=sortedPerformance(rows);if(!sorted.length)return `<div class="empty">No performance report is available for this season.</div>`;return `<div class="table-wrap"><table class="sortable-table"><thead><tr>${sortableHeading("Overall Rank","overallRank")}${sortableHeading("Franchise","team")}${sortableHeading("Executive","manager")}${sortableHeading("Record","record")}${sortableHeading("Win %","winPct")}${sortableHeading("Production","pointsFor")}${sortableHeading("Allowed","pointsAgainst")}${sortableHeading("Final Finish","playoffRank")}</tr></thead><tbody>${sorted.map(r=>{const games=r.wins+r.losses+r.ties,rate=games?(r.wins+r.ties*.5)/games:0;return `<tr><td><span class="rank-cell ${r.overallRank===1?"first":""}">${r.overallRank??r.regularSeasonRank??"—"}</span></td><td><strong>${esc(r.team)}</strong></td><td>${managerLink(r.managerId,r.manager)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(rate)}</td><td>${fmt.format(r.pointsFor)}</td><td>${fmt.format(r.pointsAgainst)}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td></tr>`}).join("")}</tbody></table></div>`;}

function aggregateManagers(){return currentLeague().managers.map(m=>({managerId:m.id,manager:m.name,team:m.teams.join(" · "),wins:m.wins,losses:m.losses,ties:m.ties,pointsFor:m.pointsFor,pointsAgainst:m.pointsAgainst,overallRank:0,playoffRank:m.championships,moves:currentLeague().rows.filter(r=>r.managerId===m.id).reduce((a,r)=>a+(r.moves||0),0),trades:currentLeague().rows.filter(r=>r.managerId===m.id).reduce((a,r)=>a+(r.trades||0),0),seasons:m.seasons,championships:m.championships,playoffs:m.playoffs})).sort((a,b)=>b.wins-a.wins||b.pointsFor-a.pointsFor).map((r,i)=>({...r,overallRank:i+1}));}
function rawStandingRows(season){
  const source=(loserRaw.standings||[]).filter(r=>(season==="all"||Number(r.year)===Number(season))&&((Number(r.wins)||0)+(Number(r.losses)||0)+(Number(r.ties)||0)>0||(Number(r.pf)||0)>0||(Number(r.pa)||0)>0));
  const grouped=new Map();
  source.forEach(r=>{
    const owner=loserCanonicalName(r.team);
    const row=grouped.get(owner)||{name:owner,wins:0,losses:0,ties:0,pf:0,pa:0,games:0,seasons:0};
    row.wins+=Number(r.wins)||0; row.losses+=Number(r.losses)||0; row.ties+=Number(r.ties)||0;
    row.pf+=Number(r.pf)||0; row.pa+=Number(r.pa)||0; row.games+=(Number(r.wins)||0)+(Number(r.losses)||0)+(Number(r.ties)||0); row.seasons++;
    grouped.set(owner,row);
  });
  return [...grouped.values()].map(r=>({...r,winPct:r.games?(r.wins+r.ties*.5)/r.games:0,avgPf:r.games?r.pf/r.games:0}))
    .sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins||b.pf-a.pf||a.name.localeCompare(b.name));
}
function franchiseForOwnerSeason(owner,season){
  const id=loserManagerId(owner);
  const row=currentLeague().rows.find(r=>Number(r.season)===Number(season)&&(r.managerId===id||loserCanonicalName(r.manager)===loserCanonicalName(owner)));
  return row?.team||loserCanonicalName(owner);
}
function floridaOverview(){
  const league=currentLeague();
  const all=isAllSeasons();
  const season=all?latestSeason():Number(state.season);
  const seasonGames=loserRaw.games.filter(g=>Number(g.year)===Number(season));
  const seasonRows=rawStandingRows(season).map((r,i)=>({...r,overallRank:i+1,manager:r.name,managerId:loserManagerId(r.name),team:franchiseForOwnerSeason(r.name,season),pointsFor:r.pf,pointsAgainst:r.pa}));
  const championFact=loserRaw.championships.find(c=>Number(c.year)===Number(season));
  const sackoFact=loserRaw.sackos.find(c=>Number(c.year)===Number(season));
  const championName=championFact?loserCanonicalName(championFact.winner):null;
  const sackoName=sackoFact?loserCanonicalName(sackoFact.winner):null;
  const championManagerId=championName?loserManagerId(championName):null;
  const sackoManagerId=sackoName?loserManagerId(sackoName):null;
  const championStanding=seasonRows.find(r=>r.managerId===championManagerId||loserCanonicalName(r.manager)===championName);
  const sackoStanding=seasonRows.find(r=>r.managerId===sackoManagerId||loserCanonicalName(r.manager)===sackoName);
  const championTeam=championName?franchiseForOwnerSeason(championName,season):null;
  const sackoTeam=sackoName?franchiseForOwnerSeason(sackoName,season):null;
  const allTime=[...league.managers].sort((a,b)=>b.wins-a.wins||b.winPct-a.winPct).slice(0,5);
  const titleLeaders=[...league.managers].sort((a,b)=>b.championships-a.championships||b.wins-a.wins).slice(0,5);
  const totalGames=Math.round(rawStandingRows(all?"all":season).reduce((sum,r)=>sum+r.games,0)/2);
  const seasonLabel=all?`${league.seasons[0]}–${latestSeason()}`:season;
  const titleCount=loserRaw.championships.length;
  const sackoCount=loserRaw.sackos.length;
  return `<div class="lol-front-page lol-front-page-v2">
    <section class="lol-edition-banner" aria-label="League of Losers front page">
      <div class="lol-edition-meta"><span>LEAGUE OF LOSERS · OFFICIAL HISTORICAL ARCHIVE</span><span>VOL. ${league.seasons.length} · ${seasonLabel} EDITION</span></div>
      <div class="lol-breaking-strip"><strong>THE RECORD</strong><span>${season} champion and Sacko results pulled from the certified league history.</span><button data-go="awards">OPEN TROPHY CASE →</button></div>
    </section>

    <section class="lol-front-grid lol-front-grid-v2">
      <article class="lol-lead-story">
        <div class="lol-section-label">FRONT PAGE · ${season} FINAL REPORT</div>
        <h2>${championName?`${esc(championTeam)} CLAIMS THE TITLE`:`${season} TITLE FILE PENDING`}</h2>
        <p class="lol-lead-deck">${championName?`${esc(championTeam)} — owned by ${managerLink(championManagerId,championName)} — is entered into the permanent archive as the ${season} League of Losers champion.`:`No championship fact is available for ${season}.`}</p>
        <div class="lol-verdict-grid">
          <article class="lol-verdict-card champion">
            <span>LEAGUE CHAMPION</span><img class="official-outcome-seal" src="assets/seals/champion-seal-approved.png" alt="Official Champion seal"><strong>${esc(championTeam||"PENDING")}</strong>
            <small>${championStanding?`${esc(championName)} · ${championStanding.wins}-${championStanding.losses}-${championStanding.ties}`:`${season} certified result`}</small>
          </article>
          <article class="lol-verdict-card sacko">
            <span>SACKO-ROLSTON</span><img class="official-outcome-seal" src="assets/seals/sacko-rolston-seal-approved.png" alt="Official Sacko-Rolston seal"><strong>${esc(sackoTeam||"PENDING")}</strong>
            <small>${sackoStanding?`${esc(sackoName)} · ${sackoStanding.wins}-${sackoStanding.losses}-${sackoStanding.ties}`:`${season} certified result`}</small>
          </article>
        </div>
        <div class="lol-story-actions"><button class="florida-action" data-go="awards">VIEW CHAMPIONS & SACKOS</button><button class="florida-action secondary" data-go="records">OPEN RECORD BOOK</button></div>
      </article>

      <aside class="lol-right-rail">
        <section class="lol-standings-snapshot">
          <div class="lol-rail-heading"><span>${season} STANDINGS</span><button data-go="standings">FULL TABLE →</button></div>
          <ol>${seasonRows.slice(0,6).map((r,i)=>`<li><b>${i+1}</b><span>${managerLink(r.managerId,r.manager)}<em>${esc(r.team)}</em></span><small>${r.wins}-${r.losses}-${r.ties}</small></li>`).join("")}</ol>
        </section>
        <section class="lol-archive-totals">
          <div><span>SEASONS</span><strong>${all?league.seasons.length:1}</strong></div><div><span>REG. GAMES</span><strong>${totalGames}</strong></div><div><span>TITLES</span><strong>${titleCount}</strong></div><div><span>SACKOS</span><strong>${sackoCount}</strong></div>
        </section>
      </aside>
    </section>

    <section class="lol-mid-grid lol-mid-grid-v2">
      <article class="lol-column-story paper-panel">
        <div class="lol-section-label">ABOUT THE ARCHIVE</div>
        <h2>EVERY SEASON. EVERY OWNER. EVERY BAD DECISION.</h2>
        <p class="lol-dropcap">League Legacy preserves the League of Losers as a living historical archive. Owner identity remains permanent while team names, branding and season results stay attached to the year in which they occurred.</p>
        <p>The season selector changes the edition without rewriting history. Scores and outcomes remain facts; career totals and rankings are derived from those facts.</p>
        <button class="text-link-button" data-go="search">SEARCH THE ARCHIVE →</button>
      </article>
      <aside class="lol-leaders-board paper-panel">
        <div class="lol-rail-heading"><span>ALL-TIME WIN LEADERS</span><button data-go="managers">OWNER FILES →</button></div>
        <ol>${allTime.map((m,i)=>`<li><b>${i+1}</b><span>${managerLink(m.id,m.name)}<small>${m.championships} title${m.championships===1?"":"s"}</small></span><strong>${m.wins}</strong></li>`).join("")}</ol>
      </aside>
    </section>

    <section class="lol-title-race lol-title-race-v2">
      <div class="lol-title-race-copy"><span class="lol-section-label">CHAMPIONSHIP LEDGER</span><h2>WHO OWNS THE SWAMP?</h2><p>Ranked by certified championships, with career wins as the tiebreaker.</p></div>
      <div class="lol-title-podium">${titleLeaders.map((m,i)=>`<article class="place-${i+1}"><span>${i===0?"TITLE LEADER":`#${i+1}`}</span><strong>${m.championships}</strong><h3>${managerLink(m.id,m.name)}</h3><small>${m.wins} career wins</small></article>`).join("")}</div>
    </section>

    <nav class="lol-section-directory" aria-label="Explore the archive">
      ${[["standings","STANDINGS","Season and career tables"],["games","GAME DAY","Scores and matchups"],["draft","DRAFT BOARD","Draft and keeper history"],["records","RECORD BOOK","League records"],["managers","THE SUSPECTS","Permanent owner files"],["awards","TROPHY CASE","Champions and Sackos"]].map(([go,title,sub],i)=>`<button data-go="${go}"><b>${String(i+1).padStart(2,"0")}</b><span><strong>${title}</strong><small>${sub}</small></span><i>→</i></button>`).join("")}
    </nav>
  </div>`;
}
function overview(){if(currentTheme()==="florida-man")return floridaOverview();const league=currentLeague(),all=isAllSeasons(),season=all?latestSeason():state.season,rows=sortedStandings(league.rows.filter(r=>r.season===season)),champion=league.champions.find(c=>c.season===season),leader=rows[0],totalGames=Math.round(league.managers.reduce((s,m)=>s+m.wins+m.losses+m.ties,0)/2),top=[...league.managers].sort((a,b)=>b.wins-a.wins).slice(0,5),max=Math.max(...top.map(m=>m.wins),1),titleCount=league.champions.length;return `<div class="headquarters-grid"><section class="corporate-hero"><div class="document-code">Permanent Corporate Archive · ${league.seasons[0]}–${latestSeason()}</div><h2 class="hero-title">${all?"League History":"Annual League Review"}</h2><p class="hero-copy">${all?`The complete history of the ${esc(league.name)} across ${league.seasons.length} seasons, including every champion, franchise, executive, transaction and performance record.`:`The certified ${season} record for the ${esc(league.name)}.`}</p><div class="hero-seal">Vandelay<br>Industries<br>Official</div></section><aside class="paper-panel champion-panel"><div class="panel-ribbon"><span>${all?"Most Recent Champion":"Executive of the Year"}</span><span>${season}</span></div><div class="champion-portrait">${champion?portrait(champion.managerId,champion.manager,"champion-photo"):'<div class="portrait-placeholder">VI</div>'}</div><div class="champion-copy"><div class="year">League Champion</div><h2>${esc(champion?.team||"Pending")}</h2><p>${champion?`${managerLink(champion.managerId,champion.manager)} · ${champion.record}`:"Awaiting final certification"}</p></div></aside></div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Years in Operation</div><div class="stat-value">${league.seasons.length}</div><div class="stat-note">${league.seasons[0]}–${latestSeason()}</div></article><article class="stat-card"><div class="stat-label">Certified Champions</div><div class="stat-value">${titleCount}</div><div class="stat-note">Every title in Executive Hall</div></article><article class="stat-card"><div class="stat-label">Personnel on File</div><div class="stat-value">${league.managers.length}</div><div class="stat-note">Unique Manager Adjust IDs</div></article><article class="stat-card"><div class="stat-label">Recorded Matchups</div><div class="stat-value">${totalGames}</div><div class="stat-note">Regular-season results</div></article></div><div class="lower-grid"><section class="paper-panel memo"><div class="panel-heading"><h2>Company Memorandum</h2><span>Permanent Record</span></div><div class="memo-meta"><strong>TO:</strong><span>All Fantasy Football Division Personnel</span><strong>FROM:</strong><span>Office of the Commissioner</span><strong>RE:</strong><span>${all?"Complete League History":`${season} Annual Performance Review`}</span></div><p>${all?`This archive combines all ${league.seasons.length} seasons into one permanent corporate record. Use the Fiscal Season selector to isolate any individual year.`:`The ${season} records have been reviewed and entered into the permanent corporate archive.`}</p><p>${champion?`${managerLink(champion.managerId,champion.manager)}, representing ${esc(champion.team)}, is the ${season} League Champion.`:"Championship certification remains pending."}</p></section><aside class="paper-panel"><div class="panel-heading"><h2>Department Directory</h2><span>Extension List</span></div><div class="department-links">${[["standings","Corporate Performance"],["managers","Personnel Files"],["history","Executive Hall"],["records","Records Department"],["transactions","League Transactions"],["draft","Draft Center"],["games","Game Center"],["awards","Awards Center"]].map(([go,label])=>`<button class="department-link" data-go="${go}"><span>${label}</span><span>→</span></button>`).join("")}</div></aside></div><section class="paper-panel all-time-panel"><div class="panel-heading"><h2>All-Time Wins</h2><span>Senior Personnel</span></div><div class="bar-chart">${top.map(m=>`<div class="bar-row"><span>${managerLink(m.id,m.name)}</span><span class="bar-track"><span class="bar-fill" style="width:${m.wins/max*100}%"></span></span><strong>${m.wins}</strong></div>`).join("")}</div></section>`;}
function legacyStandings(){if(!isAllSeasons())return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Annual Performance Report</h2><span>${esc(currentLeague().name)}</span></div>${standingsTable(seasonRows())}</section>`;const rows=aggregateManagers();return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>All-Time Corporate Performance</h2><span>Complete league history</span></div><div class="table-wrap"><table><thead><tr><th>Career Rank</th><th>Executive</th><th>Career Record</th><th>Win %</th><th>Seasons</th><th>Playoffs</th><th>Championships</th><th>Production</th></tr></thead><tbody>${rows.map(r=>{const games=r.wins+r.losses+r.ties;return `<tr><td><span class="rank-cell ${r.overallRank===1?"first":""}">${r.overallRank}</span></td><td>${managerLink(r.managerId,r.manager)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(games?(r.wins+r.ties*.5)/games:0)}</td><td>${r.seasons}</td><td>${r.playoffs}</td><td>${r.championships}</td><td>${fmt.format(r.pointsFor)}</td></tr>`}).join("")}</tbody></table></div></section>`;}
function floridaManagers(){
  const all=isAllSeasons();
  const latest=latestSeason();
  const activeIds=new Set(currentLeague().rows.filter(r=>r.season===latest).map(r=>r.managerId));
  const currentTeam=id=>currentLeague().rows.filter(r=>r.managerId===id).sort((a,b)=>b.season-a.season)[0]?.team||managerById(id)?.teams?.at(-1)||"Franchise history on file";
  const dedupe=(items)=>[...new Map((items||[]).map(x=>[`${x.year}|${loserManagerId(x.winner)||x.winner}`,x])).values()];
  const championships=dedupe(loserRaw.championships), sackoLedger=dedupe(loserRaw.sackos);
  const source=all?[...currentLeague().managers]:sortedStandings(seasonRows()).map(r=>({...managerById(r.managerId),seasonRow:r})).filter(Boolean);
  const titleCount=m=>championships.filter(x=>loserManagerId(x.winner)===m.id).length;
  const sackoCount=m=>sackoLedger.filter(x=>loserManagerId(x.winner)===m.id).length;
  const query=state.ownerQuery.trim().toLowerCase();
  let managers=[...source].filter(m=>state.ownerFilter!=="active"||activeIds.has(m.id)).filter(m=>!query||[m.name,m.id,currentTeam(m.id),...(m.teams||[])].join(" ").toLowerCase().includes(query));
  const sorters={
    wanted:(a,b)=>all?((titleCount(b)-titleCount(a))||b.wins-a.wins||b.pointsFor-a.pointsFor):((a.seasonRow?.overallRank??999)-(b.seasonRow?.overallRank??999)),
    name:(a,b)=>a.name.localeCompare(b.name),
    wins:(a,b)=>(b.seasonRow?.wins??b.wins)-(a.seasonRow?.wins??a.wins)||a.name.localeCompare(b.name),
    points:(a,b)=>(b.seasonRow?.pointsFor??b.pointsFor)-(a.seasonRow?.pointsFor??a.pointsFor)||a.name.localeCompare(b.name),
    titles:(a,b)=>titleCount(b)-titleCount(a)||b.wins-a.wins||a.name.localeCompare(b.name),
    sackos:(a,b)=>sackoCount(b)-sackoCount(a)||a.name.localeCompare(b.name)
  };
  managers.sort(sorters[state.ownerSort]||sorters.wanted);
  const rankKey=(m)=>{
    const row=m.seasonRow;
    if(state.ownerSort==="wanted") return all
      ? String(titleCount(m))
      : String(row?.overallRank??999);
    if(state.ownerSort==="wins") return String(row?.wins??m.wins);
    if(state.ownerSort==="points") return String(row?.pointsFor??m.pointsFor);
    if(state.ownerSort==="titles") return String(titleCount(m));
    if(state.ownerSort==="sackos") return String(sackoCount(m));
    return m.id;
  };
  let previousKey=null,competitionRank=0;
  const ranked=managers.map((m,i)=>{
    const key=rankKey(m);
    if(i===0||key!==previousKey) competitionRank=i+1;
    previousKey=key;
    return {m,rank:competitionRank};
  });
  const activeCount=activeIds.size;
  const aliases={garrett:"The Commissioner",clyde:"The Big Snapper",jos:"Airboat Jos",joe:"Airboat Jos",gabriella:"Lady Flamingo",adam:"Iggy Pop",azn:"The Python",william:"The Rooster",travis:"Lime Slice",connor:"Cafecito",caleb:"Bitey",matthew:"Claw Daddy",daniel:"Palm Daddy",luke:"Slow & Low",matt:"Coco Loco",stephen:"Puff Daddy",brett:"Pinchy",marcus:"Flipper",josh:"Traffic Cone",preston:"Sunburn",michael:"Hammer Time"};
  const caseNumbers={garrett:"017",clyde:"004",jos:"002",joe:"002",gabriella:"0174",adam:"012",azn:"001",william:"010",travis:"007",connor:"020",caleb:"016",matthew:"003",daniel:"006",luke:"005",matt:"008",stephen:"009",brett:"011",marcus:"014",josh:"013",preston:"015",michael:"018"};
  const preferredOrder=["garrett","clyde","jos","joe","gabriella","adam","azn","william","travis","connor","caleb","matthew","daniel","luke","matt","stephen","brett","marcus","josh","preston","michael"];
  if(all && state.ownerSort==="wanted") managers.sort((a,b)=>{
    const aa=activeIds.has(a.id)?0:1, bb=activeIds.has(b.id)?0:1;
    if(aa!==bb)return aa-bb;
    const ai=preferredOrder.indexOf(String(a.id).toLowerCase()), bi=preferredOrder.indexOf(String(b.id).toLowerCase());
    return (ai<0?999:ai)-(bi<0?999:bi);
  });
  const card=({m,rank})=>{
    const row=m.seasonRow;
    const titles=championships.filter(x=>loserManagerId(x.winner)===m.id);
    const record=row?`${row.wins}-${row.losses}`:`${m.wins}-${m.losses}`;
    const rate=row?((row.wins+row.losses+row.ties)?(row.wins+row.ties*.5)/(row.wins+row.losses+row.ties):0):m.winPct;
    const active=activeIds.has(m.id);
    const key=String(m.id).toLowerCase();
    const caseNo=caseNumbers[key]||String(rank).padStart(3,"0");
    return `<a class="case-folder-card ${active?'is-active':'is-archived'}" href="${managerHref(m.id)}" aria-label="View case file for ${esc(m.name)}">
      <span class="folder-tab" aria-hidden="true"></span>
      <img class="case-paperclip" src="assets/sheriff/hardware/paperclip-approved.png" alt="" aria-hidden="true">
      <div class="case-number">CASE #${caseNo}</div>
      <img class="case-status-stamp" src="assets/sheriff/hardware/${active?'active-stamp-approved.png':'archived-stamp-approved.png'}" alt="${active?'Active':'Archived'}">
      <div class="case-photo-panel"><img class="case-character case-character-${slug(key)}" src="${portraitPath(m.id)}" alt="Suspect illustration of ${esc(m.name)}"></div>
      <div class="case-details">
        <h3>${esc(m.name)}</h3>
        <div class="case-rule" aria-hidden="true"><span>★</span></div>
        <div class="case-franchise"><span>CURRENT FRANCHISE</span><strong>${esc(currentTeam(m.id))}</strong></div>
        <div class="case-stats">
          <div class="case-stat case-stat-record"><span>RECORD</span><div class="case-stat-value"><strong>${record}</strong></div></div>
          <div class="case-stat case-stat-win"><span>WIN %</span><div class="case-stat-value"><strong>${pct(rate)}</strong></div></div>
          <div class="case-stat case-stat-seasons"><span>SEASONS</span><div class="case-stat-value"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 7h6v8h24V7h6v8h5a5 5 0 0 1 5 5v35a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V20a5 5 0 0 1 5-5h5V7Zm40 22H10v25h44V29ZM16 35h7v7h-7v-7Zm12 0h7v7h-7v-7Zm12 0h7v7h-7v-7ZM16 46h7v7h-7v-7Zm12 0h7v7h-7v-7Zm12 0h7v7h-7v-7Z"/></svg><strong>${m.seasons}</strong></div></div>
          <div class="case-stat case-stat-titles"><span>CHAMPIONSHIPS</span><div class="case-stat-value"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 7h26v7h11v9c0 10-7 18-17 20-1 5-4 8-7 10h11v6H21v-6h11c-4-2-6-5-7-10-10-2-17-10-17-20v-9h11V7Zm0 13h-5v3c0 6 4 11 10 13-3-5-5-10-5-16Zm26 0c0 6-2 11-5 16 6-2 10-7 10-13v-3h-5Z"/></svg><strong>${titles.length}</strong></div></div>
        </div>
        <img class="case-badge" src="assets/sheriff/hardware/badge-watermark-approved.png" alt="" aria-hidden="true">
        <span class="case-button"><svg viewBox="0 0 64 46" aria-hidden="true"><path d="M3 10h20l5 6h33v27H3V10Zm4 5v23h49V21H26l-5-6H7Z"/></svg>VIEW CASE FILE</span>
      </div>
    </a>`;
  };
  return `<section class="owner-directory-front"><header class="owner-directory-mast paper-panel"><div><span class="document-code">League of Losers · Public Records Division</span><h2>The Suspects</h2><p>${all?'Permanent owner identities ranked by titles, career wins and production.':`${state.season} personnel ranked by certified season finish.`}</p></div><div class="directory-seal"><strong>${managers.length}</strong><span>FILES<br>DISPLAYED</span></div></header><div class="suspect-toolbar" aria-label="Owner directory controls"><div class="suspect-status"><span>Status</span><div class="suspect-filter-buttons" role="group" aria-label="Owner status filter"><button type="button" data-owner-filter="active" class="${state.ownerFilter==='active'?'active':''}">Active Owners</button><button type="button" data-owner-filter="all" class="${state.ownerFilter==='all'?'active':''}">All Owners</button></div></div><label class="suspect-search"><span>Search files</span><input id="ownerSearch" type="search" value="${esc(state.ownerQuery)}" placeholder="Owner or franchise"></label><label class="suspect-sort"><span>Sort by</span><select id="ownerSort"><option value="wanted" ${state.ownerSort==='wanted'?'selected':''}>Most Wanted</option><option value="name" ${state.ownerSort==='name'?'selected':''}>Owner Name</option><option value="wins" ${state.ownerSort==='wins'?'selected':''}>Wins</option><option value="points" ${state.ownerSort==='points'?'selected':''}>Points For</option><option value="titles" ${state.ownerSort==='titles'?'selected':''}>Titles</option><option value="sackos" ${state.ownerSort==='sackos'?'selected':''}>Sackos</option></select></label><span class="suspect-count">${activeCount} active · ${currentLeague().managers.length} permanent files</span></div><div class="owner-directory-stats"><article><span>Permanent Owners</span><strong>${currentLeague().managers.length}</strong></article><article><span>Currently Active</span><strong>${activeCount}</strong></article><article><span>Certified Titles</span><strong>${championships.length}</strong></article><article><span>Documented Sackos</span><strong>${sackoLedger.length}</strong></article></div><div class="wanted-grid">${ranked.map(card).join('')||'<div class="empty">No owner files match this filter.</div>'}</div></section>`;
}
function bindOwnerFilters(){
  document.querySelectorAll('[data-owner-filter]').forEach(btn=>btn.addEventListener('click',()=>{state.ownerFilter=btn.dataset.ownerFilter;render(true);}));
  const search=document.querySelector('#ownerSearch');
  if(search)search.addEventListener('input',()=>{state.ownerQuery=search.value;render(true);const next=document.querySelector('#ownerSearch');if(next){next.focus();next.setSelectionRange(next.value.length,next.value.length);}});
  const sort=document.querySelector('#ownerSort');
  if(sort)sort.addEventListener('change',()=>{state.ownerSort=sort.value;render(true);});
}
function managers(){
  if(currentTheme()==="florida-man")return floridaManagers();
  if(isAllSeasons()){const rows=[...currentLeague().managers].sort((a,b)=>b.wins-a.wins);return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>Complete Personnel Directory</h2><span>All executives across every season</span></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Active Years</th><th>Career Record</th><th>Success Rate</th><th>Playoffs</th><th>Championships</th><th>Production</th></tr></thead><tbody>${rows.map(m=>`<tr><td><a class="manager-cell manager-card-link" href="${managerHref(m.id)}"><span><strong>${esc(m.name)}</strong><br><small>${m.teams.length} franchise name${m.teams.length===1?"":"s"}</small></span></a></td><td>${m.firstSeason}–${m.lastSeason}</td><td>${m.wins}-${m.losses}-${m.ties}</td><td>${pct(m.winPct)}</td><td>${m.playoffs}</td><td>${m.championships}</td><td>${fmt.format(m.pointsFor)}</td></tr>`).join("")}</tbody></table></div></section>`;}const rows=sortedStandings(seasonRows());return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>${state.season} Personnel Directory</h2><span>Click any employee to open the complete file</span></div><div class="table-wrap"><table><thead><tr><th>Employee</th><th>Franchise</th><th>Season Record</th><th>Success Rate</th><th>Overall Rank</th><th>Final Finish</th><th>Production</th></tr></thead><tbody>${rows.map(r=>{const m=managerById(r.managerId),games=r.wins+r.losses+r.ties,rate=games?(r.wins+r.ties*.5)/games:0;return `<tr><td><a class="manager-cell manager-card-link" href="${managerHref(r.managerId)}"><span><strong>${esc(r.manager)}</strong><br><small>${m?.firstSeason||state.season}–${m?.lastSeason||state.season}</small></span></a></td><td><strong>${esc(r.team)}</strong></td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(rate)}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td></tr>`}).join("")}</tbody></table></div></section>`;
}
function floridaLeagueHistory(){
  const league=currentLeague();
  const seasons=[...league.seasons].sort((a,b)=>b-a);
  const selected=isAllSeasons()?seasons:seasons.filter(y=>y===state.season);
  const championshipFor=year=>(loserRaw.championships||[]).find(x=>Number(x.year)===Number(year));
  const sackoFor=year=>(loserRaw.sackos||[]).find(x=>Number(x.year)===Number(year));
  const seasonFile=year=>{
    const rows=sortedStandings(league.rows.filter(r=>r.season===year));
    const champ=championshipFor(year), sacko=sackoFor(year), leader=rows[0];
    const totalPoints=rows.reduce((sum,r)=>sum+Number(r.pointsFor||0),0);
    const teams=rows.length;
    const champName=champ?.winner||league.champions.find(c=>c.season===year)?.manager||"Pending";
    const champTeam=champ?.team||league.champions.find(c=>c.season===year)?.team||"Championship record pending";
    const sackoName=sacko?.winner||"Not on file";
    return `<article class="history-year-file">
      <div class="history-year-tab"><strong>${year}</strong><span>VOL. ${String(year-seasons[seasons.length-1]+1).padStart(2,"0")}</span></div>
      <div class="history-year-copy">
        <span class="history-kicker">Season Chronicle · Certified Archive</span>
        <h3>${esc(champTeam)}</h3>
        <p>${managerLink(loserManagerId(champName),champName)} closed the file as league champion${leader?`, while ${loserOwnerLink(leader.manager)} led the regular-season table at ${leader.wins}-${leader.losses}-${leader.ties}`:""}.</p>
        <div class="history-year-facts"><span><b>${teams}</b> franchises</span><span><b>${fmt.format(totalPoints)}</b> points</span></div>
        <div class="history-year-outcomes"><div class="history-year-stamp champion-stamp"><img src="assets/seals/champion-seal-approved.png" alt="Champion seal"><strong>${esc(champName)}</strong><small>${esc(champ?.scoreText||league.champions.find(c=>c.season===year)?.record||"")}</small></div><div class="history-year-stamp sacko-stamp"><img src="assets/seals/sacko-rolston-seal-approved.png" alt="Sacko-Rolston seal"><strong>${esc(sackoName)}</strong><small>${esc(sacko?.scoreText||"")}</small></div></div>
      </div>
    </article>`;
  };
  const titleMap=new Map();
  (loserRaw.championships||[]).forEach(c=>{const name=c.winner||"Unknown";titleMap.set(name,(titleMap.get(name)||0)+1);});
  const dynasties=[...titleMap.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5);
  const totalGames=(gameArchive.coverage?.games)||selectedLoserGames().length;
  return `<div class="history-archive-page">
    <header class="history-archive-hero paper-panel">
      <div><span class="document-code">League of Losers · Historical Society</span><p class="history-kicker">The complete, unexpurgated account</p><h2>${isAllSeasons()?"League History":`${state.season} Season Chronicle`}</h2><p>${isAllSeasons()?`Nine seasons of champions, disasters, aliases and evidence preserved exactly as the league recorded them.`:`The official yearbook entry for the ${state.season} campaign.`}</p></div>
      <div class="history-volume"><strong>${selected.length}</strong><span>${selected.length===1?"SEASON":"VOLUMES"}</span><small>${seasons[seasons.length-1]}–${seasons[0]}</small></div>
    </header>
    <div class="history-archive-stats"><article><span>Recorded Seasons</span><strong>${league.seasons.length}</strong></article><article><span>Certified Champions</span><strong>${(loserRaw.championships||[]).length}</strong></article><article><span>Documented Games</span><strong>${totalGames}</strong></article><article><span>Owners on File</span><strong>${league.managers.length}</strong></article></div>
    ${isAllSeasons()?`<section class="paper-panel dynasty-index"><div class="panel-heading"><h2>Dynasty Index</h2><span>Championships by permanent owner identity</span></div><div class="dynasty-index-grid">${dynasties.map(([name,count])=>`<article><span>#${1+dynasties.filter(([,otherCount])=>otherCount>count).length}</span><div><strong>${loserOwnerLink(name)}</strong><small>${"★".repeat(count)}${"☆".repeat(Math.max(0,3-count))}</small></div><b>${count}</b></article>`).join("")}</div></section>`:""}
    <section class="history-ledger"><div class="history-ledger-heading"><span>ARCHIVE LEDGER</span><h2>${isAllSeasons()?"Every Season on Record":`${state.season} Official File`}</h2><small>Newest volume first</small></div>${selected.map(seasonFile).join("")}</section>
  </div>`;
}
function history(){
  if(currentTheme()==="florida-man")return floridaLeagueHistory();
  const rows=[...currentLeague().champions].sort((a,b)=>b.season-a.season);
  return `<section class="paper-panel table-panel"><div class="panel-heading"><h2>Executive Hall</h2><span>Certified championship history</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Champion</th><th>Franchise</th><th>Record</th></tr></thead><tbody>${rows.map(c=>`<tr><td>${c.season}</td><td>${managerLink(c.managerId,c.manager)}</td><td>${esc(c.team)}</td><td>${esc(c.record||"—")}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function records(){
  if(currentTheme()!=="florida-man"){const rows=seasonRows();if(!rows.length)return `<div class="empty">No records are available.</div>`;const high=[...rows].sort((a,b)=>b.pointsFor-a.pointsFor)[0],low=[...rows].filter(r=>r.pointsFor>0).sort((a,b)=>a.pointsFor-b.pointsFor)[0],diff=[...rows].sort((a,b)=>(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst))[0];return `<div class="record-grid">${recordCard("Highest Production",fmt.format(high.pointsFor),`${high.season} · ${high.team} · ${high.manager}`,high.managerId)}${recordCard("Lowest Production",fmt.format(low.pointsFor),`${low.season} · ${low.team} · ${low.manager}`,low.managerId)}${recordCard("Best Point Differential",fmt.format(diff.pointsFor-diff.pointsAgainst),`${diff.season} · ${diff.team} · ${diff.manager}`,diff.managerId)}</div>`;}
  const games=selectedLoserGames();if(!games.length)return `<div class="empty">No records are available.</div>`;
  const performances=games.flatMap(g=>[{name:loserCanonicalName(g.teamA),score:Number(g.scoreA),opp:Number(g.scoreB),year:g.year,week:g.week,isChampionship:Boolean(g.isChampionship)},{name:loserCanonicalName(g.teamB),score:Number(g.scoreB),opp:Number(g.scoreA),year:g.year,week:g.week,isChampionship:Boolean(g.isChampionship)}]);
  const high=[...performances].sort((a,b)=>b.score-a.score)[0],low=[...performances].sort((a,b)=>a.score-b.score)[0];
  const blowouts=[...games].map(g=>({g,margin:Math.abs(Number(g.scoreA)-Number(g.scoreB))})).sort((a,b)=>b.margin-a.margin);
  const blow=blowouts[0], closest=[...games].map(g=>({g,margin:Math.abs(Number(g.scoreA)-Number(g.scoreB))})).sort((a,b)=>a.margin-b.margin)[0];
  const avg=performances.reduce((a,x)=>a+x.score,0)/performances.length;
  const map=new Map();performances.forEach(x=>{const r=map.get(x.name)||{name:x.name,pf:0,pa:0,games:0,high:-Infinity,low:Infinity};r.pf+=x.score;r.pa+=x.opp;r.games++;r.high=Math.max(r.high,x.score);r.low=Math.min(r.low,x.score);map.set(x.name,r);});
  const allRows=[...map.values()].map(r=>({...r,avgPf:r.pf/r.games,avgPa:r.pa/r.games,diff:(r.pf-r.pa)/r.games}));
  const rows=[...allRows].sort((a,b)=>b.avgPf-a.avgPf);
  const topScores=performances.filter(r=>!(Number(r.week)===17&&r.isChampionship)).sort((a,b)=>b.score-a.score).slice(0,10);
  const topBlowouts=blowouts.slice(0,10);
  const scope=isAllSeasons()?`${currentLeague().seasons[0]}–${latestSeason()}`:String(state.season);
  return `<div class="record-book-page">
    <header class="record-book-hero paper-panel"><div><span class="document-code">League of Losers · Records & Statistics Bureau</span><p class="record-book-kicker">Official marks, freak incidents and statistical crimes</p><h2>${isAllSeasons()?"The Florida Record Book":`${state.season} Record Book`}</h2><p>Every number below is derived from recorded matchup facts. No legends, guesses or barroom testimony.</p></div><div class="record-book-seal"><strong>${performances.length}</strong><span>TEAM<br>GAMES</span><small>${scope}</small></div></header>
    <section class="record-marquee"><article class="record-marquee-card crown"><span>All-Time High</span><strong>${fmt.format(high.score)}</strong><h3>${loserOwnerLink(high.name)}</h3><small>${high.year} · Week ${high.week}</small></article><article class="record-marquee-card warning"><span>All-Time Low</span><strong>${fmt.format(low.score)}</strong><h3>${loserOwnerLink(low.name)}</h3><small>${low.year} · Week ${low.week}</small></article><article class="record-marquee-card"><span>Largest Blowout</span><strong>${fmt.format(blow.margin)}</strong><h3>${esc(loserCanonicalName(blow.g.teamA))} vs ${esc(loserCanonicalName(blow.g.teamB))}</h3><small>${blow.g.year} · Week ${blow.g.week}</small></article><article class="record-marquee-card"><span>Closest Finish</span><strong>${fmt.format(closest.margin)}</strong><h3>${esc(loserCanonicalName(closest.g.teamA))} vs ${esc(loserCanonicalName(closest.g.teamB))}</h3><small>${closest.g.year} · Week ${closest.g.week}</small></article></section>
    <div class="record-book-grid"><section class="paper-panel record-list-panel"><div class="panel-heading record-list-heading"><h2>Highest Single-Game Scores</h2><span>Top 10 performances</span></div><ol class="record-ranking-list">${topScores.map((r,i)=>`<li><b>${String(i+1).padStart(2,"0")}</b><div><strong>${loserOwnerLink(r.name)}</strong><small>${r.year} · Week ${r.week}</small></div><span>${fmt.format(r.score)}</span></li>`).join("")}</ol></section><section class="paper-panel record-list-panel"><div class="panel-heading record-list-heading"><h2>Largest Margins</h2><span>Top 10 decisive incidents</span></div><ol class="record-ranking-list blowout-list">${topBlowouts.map((r,i)=>`<li><b>${String(i+1).padStart(2,"0")}</b><div><strong>${esc(loserCanonicalName(r.g.teamA))} / ${esc(loserCanonicalName(r.g.teamB))}</strong><small>${r.g.year} · Week ${r.g.week}</small></div><span>${fmt.format(r.margin)}</span></li>`).join("")}</ol></section></div>
    <section class="paper-panel table-panel record-almanac"><div class="panel-heading"><h2>Owner Scoring Almanac</h2><span>${scope} · sortable columns</span></div><div class="table-wrap"><table><thead><tr><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="0" data-type="text">Owner<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="1">Games<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="2">Avg PF<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="3">Avg PA<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="4">Avg Diff<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="5">Game High<span class="record-sort-icon" aria-hidden="true">↕</span></button></th><th class="record-sort-th" aria-sort="none"><button type="button" data-record-sort="6">Game Low<span class="record-sort-icon" aria-hidden="true">↕</span></button></th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${loserOwnerLink(r.name)}</td><td>${r.games}</td><td>${fmt.format(r.avgPf)}</td><td>${fmt.format(r.avgPa)}</td><td>${r.diff>=0?"+":""}${fmt.format(r.diff)}</td><td>${fmt.format(r.high)}</td><td>${fmt.format(r.low)}</td></tr>`).join(""):`<tr><td colspan="7"><div class="empty compact">No owner scoring records are available.</div></td></tr>`}</tbody></table></div><footer class="record-book-footnote">League average: <strong>${fmt.format(avg)}</strong> points per team-game · Facts preserved from the immutable matchup archive.</footer></section>
  </div>`;
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
function archiveOwnerPanel(managerId){const owner=archiveOwnerForManager(managerId);if(!owner)return "";const a=owner.accolades||{},r=owner.topRivalries?.[0],keeperCount=owner.keepers?.length||0;const rival=r?(r.opponentSiteManagerId?managerLink(r.opponentSiteManagerId,managerById(r.opponentSiteManagerId)?.name||loserCanonicalName(r.opponentSiteManagerId)):esc(loserCanonicalName(r.opponentOwnerId.replace(/^owner_/,"")))):"—";return `<section class="paper-panel archive-owner-panel"><div class="panel-heading"><h2>Historical Archive Index</h2><span>Permanent owner ID · ${esc(owner.ownerId)}</span></div><div class="stats-grid"><article class="stat-card"><div class="stat-label">Certified Titles</div><div class="stat-value">${a.championships?.count||0}</div><div class="stat-note">${(a.championships?.years||[]).join(" · ")||"None on file"}</div></article><article class="stat-card"><div class="stat-label">Sackos</div><div class="stat-value">${a.sackos?.count||0}</div><div class="stat-note">${(a.sackos?.years||[]).join(" · ")||"None on file"}</div></article><article class="stat-card"><div class="stat-label">Keeper Facts</div><div class="stat-value">${keeperCount}</div><div class="stat-note">Immutable imported records</div></article><article class="stat-card"><div class="stat-label">Most Frequent Rival</div><div class="stat-value">${r?r.games:"—"}</div><div class="stat-note">${rival}${r?` · ${r.wins}-${r.losses}-${r.ties}`:""}</div></article></div></section>`;}

function legacyManagerFile(){const m=managerById(state.managerId);if(!m)return `<div class="empty">This personnel file could not be located.</div>`;const career=currentLeague().rows.filter(r=>r.managerId===m.id).sort((a,b)=>b.season-a.season),selected=isAllSeasons()?null:career.find(r=>r.season===state.season),titles=currentLeague().champions.filter(c=>c.managerId===m.id).sort((a,b)=>b.season-a.season),best=[...career].sort((a,b)=>(a.overallRank??999)-(b.overallRank??999)||b.pointsFor-a.pointsFor)[0];return `<section class="personnel-dossier"><div class="dossier-header paper-panel"><a class="dossier-portrait-link" href="${portraitPath(m.id)}" target="_blank" rel="noopener">${portrait(m.id,m.name,"dossier-portrait")}</a><div class="dossier-identity"><div class="document-code">Confidential Personnel Record · ID ${esc(m.id)}</div><h2>${esc(m.name)}</h2><p>Fantasy Football Division Executive</p><div class="dossier-badges"><span>${m.firstSeason}–${m.lastSeason}</span><span>${m.seasons} Seasons</span><span>${m.championships} Championship${m.championships===1?"":"s"}</span></div></div><div class="dossier-stamp">PERSONNEL<br>FILE</div></div><div class="stats-grid dossier-stats"><article class="stat-card"><div class="stat-label">Career Record</div><div class="stat-value">${m.wins}-${m.losses}-${m.ties}</div><div class="stat-note">${pct(m.winPct)} success rate</div></article><article class="stat-card"><div class="stat-label">Career Production</div><div class="stat-value">${fmt.format(m.pointsFor)}</div><div class="stat-note">${fmt.format(m.pointsAgainst)} allowed</div></article><article class="stat-card"><div class="stat-label">Playoff Appearances</div><div class="stat-value">${m.playoffs}</div><div class="stat-note">Across ${m.seasons} seasons</div></article><article class="stat-card"><div class="stat-label">Best Overall Rank</div><div class="stat-value">#${best?.overallRank??"—"}</div><div class="stat-note">${best?.season||"—"} · ${esc(best?.team||"")}</div></article></div><div class="dossier-grid"><section class="paper-panel"><div class="panel-heading"><h2>${isAllSeasons()?"Career Summary":`${state.season} Assignment`}</h2><span>${isAllSeasons()?"All seasons combined":"Season-controlled view"}</span></div>${isAllSeasons()?`<div class="assignment-card"><h3>${m.seasons} seasons on file</h3><p><strong>${m.wins}-${m.losses}-${m.ties}</strong> career record · ${m.playoffs} playoff appearances · ${m.championships} championship${m.championships===1?"":"s"}</p><p>${fmt.format(m.pointsFor)} career points · ${career.reduce((a,r)=>a+(r.moves||0),0)} roster moves · ${career.reduce((a,r)=>a+(r.trades||0),0)} trades</p></div>`:selected?`<div class="assignment-card"><h3>${esc(selected.team)}</h3>${selected.manager!==m.name?`<p class="co-owner-line"><strong>Ownership:</strong> ${esc(selected.manager)}</p>`:""}<p><strong>${selected.wins}-${selected.losses}-${selected.ties}</strong> · Overall Rank #${selected.overallRank} · Final Finish ${selected.playoffRank?`#${selected.playoffRank}`:"—"}</p><p>${fmt.format(selected.pointsFor)} points for · ${fmt.format(selected.pointsAgainst)} allowed · ${selected.moves||0} moves · ${selected.trades||0} trades</p></div>`:`<div class="empty compact">No active assignment for ${state.season}.</div>`}<div class="panel-heading secondary-heading"><h2>Known Franchises</h2><span>${m.teams.length} names on file</span></div><div class="tag-list">${m.teams.map(t=>`<span>${esc(t)}</span>`).join("")}</div></section><section class="paper-panel"><div class="panel-heading"><h2>Executive Appointments</h2><span>Championship certifications</span></div>${titles.length?titles.map(c=>`<a class="appointment-row" href="#history" data-season-jump="${c.season}"><strong>${c.season}</strong><span>${esc(c.team)}</span><span>${c.record}</span></a>`).join(""):`<div class="empty compact">No championship appointments on file.</div>`}</section></div><section class="paper-panel table-panel career-ledger"><div class="panel-heading"><h2>Career Performance Ledger</h2><span>All seasons · newest first</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Franchise / Ownership</th><th>Record</th><th>Overall Rank</th><th>Final Finish</th><th>Production</th><th>Transactions</th></tr></thead><tbody>${career.map(r=>`<tr class="${!isAllSeasons()&&r.season===state.season?"selected-season-row":""}"><td><button class="season-jump" data-season-jump="${r.season}">${r.season}</button></td><td><strong>${esc(r.team)}</strong>${r.manager!==m.name?`<br><small>${esc(r.manager)}</small>`:""}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td><td>${r.moves||0} moves · ${r.trades||0} trades</td></tr>`).join("")}</tbody></table></div></section>${archiveOwnerPanel(m.id)}</section>`;}


const loserAlias = Object.freeze({ Azn: "Peter", Jos: "Joe", Slay: "Steven", Stephen: "Steven", Matt: "Matthew" });
// Exact source-label resolution. In particular, Matt and Matt/Alex are never
// resolved through fuzzy/display-name matching because they are different owners.
const loserManagerAlias = Object.freeze({
  Peter: "Azn",
  Azn: "Azn",
  Joe: "Jos",
  Jos: "Jos",
  Steven: "Stephen",
  Stephen: "Stephen",
  Slay: "Stephen",
  "Matt/Alex": "Matthew",
  Matthew: "Matt",
  Matt: "Matt",
  Will: "William",
  William: "William",
  Dan: "Daniel",
  Daniel: "Daniel",
  Gabi: "Gabriella",
  Gabriella: "Gabriella"
});
function loserCanonicalName(name){ return loserAlias[name] || name || "Unknown"; }
function loserManagerId(name){
  const league=currentLeague();
  const source=String(name||"").trim();
  const exactId=loserManagerAlias[source];
  if(exactId && league.managers.some(m=>m.id===exactId)) return exactId;
  // Only non-audited names may use the normal exact ID/display lookup.
  if(["Matt","Matthew","Matt/Alex"].includes(source)) return null;
  const canonical=loserCanonicalName(source);
  const mapped=loserManagerAlias[canonical]||canonical;
  return league.managers.find(m=>m.id===mapped || m.id===source || m.name===source || m.name===canonical)?.id || null;
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
  const subject=list.find(x=>x.id===id);
  if(!subject)return "—";
  const subjectValue=Number(valueFn(subject));
  if(!Number.isFinite(subjectValue))return "—";
  const ahead=list.filter(x=>{
    const value=Number(valueFn(x));
    return Number.isFinite(value)&&(descending?value>subjectValue:value<subjectValue);
  }).length;
  return ahead+1;
}

function activeLoserOwners(){
  // Current owners are the certified latest-season field. Use both the league
  // standings rows and latest-season game facts so aliases such as Gabi/Gabriella
  // and Will/William cannot be dropped by an ID mismatch.
  const latest=latestSeason();
  const fromRows=currentLeague().rows
    .filter(r=>Number(r.season)===Number(latest))
    .flatMap(r=>[r.manager,r.managerId]);
  const fromGames=loserRaw.games
    .filter(g=>Number(g.year)===Number(latest))
    .flatMap(g=>[g.teamA,g.teamB]);
  return new Set([...fromRows,...fromGames].filter(Boolean).map(loserCanonicalName));
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
  const all=isAllSeasons();
  const selectedSeason=Number(state.season);
  const titleLabel=all?"All-Time":String(selectedSeason);
  let rows;
  let gamesInView=0;
  if(mode==="regular"){
    rows=rawStandingRows(all?"all":selectedSeason);
    gamesInView=Math.round(rows.reduce((sum,r)=>sum+r.games,0)/2);
  }else{
    const playoffGames=(loserRaw.games||[]).filter(g=>(all||Number(g.year)===selectedSeason)&&(g.isPlayoff||g.isChampionship||g.isSacko||g.gameType==="sacko"));
    gamesInView=playoffGames.length;
    const map=new Map();
    const ensure=name=>{name=loserCanonicalName(name);if(!map.has(name))map.set(name,{name,wins:0,losses:0,ties:0,pf:0,pa:0,games:0});return map.get(name)};
    playoffGames.forEach(g=>{const A=ensure(g.teamA),B=ensure(g.teamB),sa=Number(g.scoreA)||0,sb=Number(g.scoreB)||0;A.pf+=sa;A.pa+=sb;A.games++;B.pf+=sb;B.pa+=sa;B.games++;if(sa===sb){A.ties++;B.ties++;}else if(sa>sb){A.wins++;B.losses++;}else{B.wins++;A.losses++;}});
    rows=[...map.values()].map(r=>({...r,winPct:r.games?(r.wins+r.ties*.5)/r.games:0,avgPf:r.games?r.pf/r.games:0})).sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins||b.pf-a.pf);
  }
  const championships=(loserRaw.championships||[]).filter(x=>all||Number(x.year)===selectedSeason);
  const sackos=(loserRaw.sackos||[]).filter(x=>all||Number(x.year)===selectedSeason);
  const titleCounts={}; championships.forEach(x=>{const n=loserCanonicalName(x.winner);titleCounts[n]=(titleCounts[n]||0)+1;});
  const sackoCounts={}; sackos.forEach(x=>{const n=loserCanonicalName(x.winner);sackoCounts[n]=(sackoCounts[n]||0)+1;});
  const playoffAppearanceYears={};
  // A playoff appearance means participation in the championship bracket only.
  // Consolation and Sacko games are postseason games, but they are not playoff appearances.
  (loserRaw.games||[]).filter(g=>
    g.isChampionship ||
    (g.isPlayoff && !g.isConsolation && !g.isSacko && g.gameType!=="consolation" && g.gameType!=="sacko")
  ).forEach(g=>{
    [g.teamA,g.teamB].forEach(name=>{
      const owner=loserCanonicalName(name);
      if(!playoffAppearanceYears[owner]) playoffAppearanceYears[owner]=new Set();
      playoffAppearanceYears[owner].add(Number(g.year));
    });
  });
  rows=rows.map((r,i)=>({...r,manager:r.name,team:all?r.name:franchiseForOwnerSeason(r.name,selectedSeason),overallRank:i+1,pointsFor:r.pf,pointsAgainst:r.pa,playoffApps:all?(playoffAppearanceYears[r.name]?.size||0):(playoffAppearanceYears[r.name]?.has(selectedSeason)?1:0),titles:titleCounts[r.name]||0,sackos:sackoCounts[r.name]||0}));
  rows=sortedPerformance(rows);
  const leader=[...rows].sort((a,b)=>a.overallRank-b.overallRank)[0];
  return `<section class="standings-newsroom">
    <header class="standings-hero"><div><span class="lol-section-label">${mode==="regular"?"MANUALLY CERTIFIED SEASON STANDINGS":"DERIVED FROM CERTIFIED PLAYOFF GAME LOGS"}</span><h2>${titleLabel} ${mode==="playoff"?"Playoff":"Regular-Season"} Standings</h2><p>${mode==="regular"?"Records and scoring totals match the commissioner-uploaded standings ledger.":"Playoff records and scoring are calculated from games marked as postseason contests."}</p></div></header>
    <section class="standings-table-panel"><div class="panel-heading standings-table-heading"><div><h2>${titleLabel} Standings</h2><span>Click a heading to sort</span></div><div class="standings-mode" role="group" aria-label="Standings view"><button class="${mode==="regular"?"active":""}" data-standings-mode="regular">Overall</button><button class="${mode==="playoff"?"active":""}" data-standings-mode="playoff">Playoffs</button></div></div>${rows.length?`<div class="table-wrap"><table class="sortable-table"><thead><tr>${sortableHeading("Rank","overallRank")}${sortableHeading("Owner","manager")}${sortableHeading("Record","record")}${sortableHeading("Win %","winPct")}${sortableHeading("PF","pointsFor")}${sortableHeading("PA","pointsAgainst")}${sortableHeading("Avg PF","avgPf")}${sortableHeading("Titles","titles")}${sortableHeading("Sackos","sackos")}${sortableHeading("Playoff Appearances","playoffApps")}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.titles?"is-champion":""} ${r.sackos?"is-sacko":""}"><td><span class="rank-cell ${r.overallRank===1?"first":""}">${r.overallRank}</span></td><td>${loserOwnerLink(r.name)}</td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(r.winPct)}</td><td>${fmt.format(r.pf)}</td><td>${fmt.format(r.pa)}</td><td>${fmt.format(r.avgPf)}</td><td>${r.titles}</td><td>${r.sackos}</td><td>${all?r.playoffApps:(r.playoffApps?"Yes":"—")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No records are available for this view.</div>`}</section>
  </section>`;
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
  const year=isAllSeasons()?"all":Number(state.season);
  const seasons=(draftArchive.seasons||[]).slice().sort((a,b)=>b.season-a.season);
  const selected=year==="all"?null:seasons.find(s=>Number(s.season)===Number(year));
  const allKeepers=(loserRaw.keepers||[]).slice();
  const years=[...new Set(allKeepers.map(k=>k.year))].sort((a,b)=>b-a);
  const owners=[...new Set(allKeepers.map(k=>loserCanonicalName(k.team)))].sort();
  const positions=[...new Set(allKeepers.map(k=>k.pos).filter(Boolean))].sort();
  if(!isAllSeasons()) state.keeperFilters.year=String(state.season);
  const f=state.keeperFilters;
  const keepers=allKeepers.filter(k=>(f.year==="all"||String(k.year)===String(f.year))&&(f.owner==="all"||loserCanonicalName(k.team)===f.owner)&&(f.position==="all"||k.pos===f.position)&&(f.rating==="all"||keeperRating(k)===f.rating)).sort((a,b)=>b.year-a.year||loserCanonicalName(a.team).localeCompare(loserCanonicalName(b.team))||a.player.localeCompare(b.player));
  const scopeKeepers=allKeepers.filter(k=>f.year==="all"||String(k.year)===String(f.year));
  const ratings={Good:0,Neutral:0,Bad:0};scopeKeepers.forEach(k=>ratings[keeperRating(k)]++);
  const orderRows=(selected?.draftOrder||[]).slice().sort((a,b)=>Number(a.draftPosition)-Number(b.draftPosition));
  const coverage=draftArchive.coverage||{};
  const options=(values,current)=>values.map(v=>`<option value="${esc(v)}" ${String(v)===String(current)?"selected":""}>${esc(v)}</option>`).join("");
  const ownerSummarySource=(draftArchive.ownerDraftSummary||[]);
  const ownerSummary=(ownerSummarySource.length?ownerSummarySource:(()=>{const byOwner=new Map();(draftArchive.draftOrders||[]).forEach(r=>{const id=r.siteManagerId||r.manager,name=r.manager||r.franchiseName||id;const x=byOwner.get(id)||{siteManagerId:id,displayName:name,slots:[],keeperCount:0};x.slots.push(Number(r.draftPosition));byOwner.set(id,x);});(loserRaw.keepers||[]).forEach(k=>{const id=loserManagerId(loserCanonicalName(k.team));if(id&&byOwner.has(id))byOwner.get(id).keeperCount++;});return [...byOwner.values()].map(x=>({...x,seasonsWithDraftSlot:x.slots.length,averageDraftPosition:x.slots.reduce((a,b)=>a+b,0)/x.slots.length,bestDraftPosition:Math.min(...x.slots),firstOverallSlots:x.slots.filter(v=>v===1).length,topThreeSlots:x.slots.filter(v=>v<=3).length}));})()).slice().sort((a,b)=>Number(a.averageDraftPosition)-Number(b.averageDraftPosition));
  const firstOverall=ownerSummary.filter(o=>o.firstOverallSlots>0).sort((a,b)=>b.firstOverallSlots-a.firstOverallSlots);
  return `<section class="draft-newsroom">
    <header class="draft-hero paper-panel"><div><span class="document-code">League of Losers · Draft Intelligence Bureau</span><p class="draft-kicker">Opening slots, keeper evidence and permanent owner history</p><h2>${isAllSeasons()?"All-Time Draft Archive":`${state.season} Draft Board`}</h2><p>Draft position and keeper selections are displayed only where a certified source exists. Missing pick-by-pick player selections remain visibly unfilled rather than inferred.</p></div><aside class="draft-stamp"><strong>${isAllSeasons()?coverage.draftOrderSeasons||0:orderRows.length}</strong><span>${isAllSeasons()?"Draft Seasons":"Certified Slots"}</span></aside></header>
    <div class="draft-summary-grid"><article><span>ORDER FACTS</span><strong>${isAllSeasons()?coverage.draftOrderEntries||0:orderRows.length}</strong><small>Certified entries</small></article><article><span>KEEPER FACTS</span><strong>${scopeKeepers.length}</strong><small>${f.year==="all"?"All seasons":f.year}</small></article><article><span>FIRST OVERALL</span><strong>${isAllSeasons()?firstOverall.reduce((n,o)=>n+o.firstOverallSlots,0):(orderRows[0]?esc(orderRows[0].franchiseName):"—")}</strong><small>${isAllSeasons()?"Recorded slots":"Opening selection"}</small></article><article><span>PICK LEDGER</span><strong>${(draftArchive.pickLedger||[]).length}</strong><small>Trustworthy selections on file</small></article></div>
    ${!isAllSeasons()?`<section class="paper-panel draft-order-panel"><div class="panel-heading"><h2>${state.season} Opening Order</h2><span>${orderRows.length} certified positions</span></div>${orderRows.length?`<div class="draft-order-grid">${orderRows.map(r=>`<article class="draft-order-card"><span class="draft-pick-number">${r.draftPosition}</span><div><strong>${esc(r.franchiseName||r.manager||"Unknown")}</strong><small>${r.siteManagerId?managerLink(r.siteManagerId,r.manager):esc(r.manager||"")}</small></div><span class="draft-finish-chip">Finish ${r.finalFinish?`#${r.finalFinish}`:"—"}</span></article>`).join("")}</div>`:`<div class="empty">No certified draft order is available for this season.</div>`}</section>`:""}
    <section class="paper-panel keeper-controls"><div class="panel-heading"><h2>Keeper Evidence Filter</h2><span>Ratings are derived unless overridden</span></div><div class="filter-grid"><label>Year<select id="keeperYear"><option value="all">All Years</option>${options(years,f.year)}</select></label><label>Owner<select id="keeperOwner"><option value="all">All Owners</option>${options(owners,f.owner)}</select></label><label>Position<select id="keeperPosition"><option value="all">All Positions</option>${options(positions,f.position)}</select></label><label>Rating<select id="keeperRating"><option value="all">All Ratings</option>${options(["Good","Neutral","Bad"],f.rating)}</select></label></div></section>
    <div class="keeper-rating-strip"><span class="good"><b>${ratings.Good}</b> Good</span><span class="neutral"><b>${ratings.Neutral}</b> Neutral</span><span class="bad"><b>${ratings.Bad}</b> Bad</span></div>
    <section class="paper-panel table-panel"><div class="panel-heading"><h2>Keeper History</h2><span>${keepers.length} matching decisions</span></div>${keepers.length?`<div class="table-wrap"><table><thead><tr><th>Year</th><th>Owner</th><th>Player</th><th>Pos.</th><th>Kept</th><th>Finish</th><th>Rating</th><th>Notes</th></tr></thead><tbody>${keepers.map(k=>`<tr><td>${k.year}</td><td>${loserOwnerLink(k.team)}</td><td><strong>${esc(k.player)}</strong></td><td>${esc(k.pos||"—")}</td><td>${k.keptRank??"—"}</td><td>${k.finish??"—"}</td><td><span class="keeper-rating ${keeperRating(k).toLowerCase()}">${keeperRating(k)}</span></td><td>${esc(k.notes||"—")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No keeper decisions match these filters.</div>`}</section>
    <aside class="draft-source-boundary"><strong>Source boundary</strong><span>Draft slots and keeper choices are facts. Player-by-player draft results will appear only after a trustworthy import.</span></aside>
  </section>`;
}
function bindKeeperFilters(){
  const map={keeperYear:"year",keeperOwner:"owner",keeperPosition:"position",keeperRating:"rating"};
  Object.entries(map).forEach(([id,key])=>document.querySelector(`#${id}`)?.addEventListener("change",e=>{
    state.keeperFilters[key]=e.target.value;
    if(key==="year"){state.season=e.target.value==="all"?"all":Number(e.target.value);seasonSelect.value=String(state.season);}
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
function rivalryCaseFile(a,b,summary){
  const normalized=summary.games.map(g=>{
    const ga=loserCanonicalName(g.teamA),sa=Number(g.scoreA),sb=Number(g.scoreB);
    const aScore=ga===a?sa:sb,bScore=ga===a?sb:sa;
    const winner=aScore===bScore?"Tie":aScore>bScore?a:b;
    return {...g,aScore,bScore,winner,margin:Math.abs(aScore-bScore),combined:aScore+bScore};
  });
  const newest=[...normalized].sort((x,y)=>y.year-x.year||y.week-x.week)[0]||null;
  const largest=[...normalized].filter(g=>g.winner!=="Tie").sort((x,y)=>y.margin-x.margin||y.year-x.year||y.week-x.week)[0]||null;
  const highest=[...normalized].sort((x,y)=>y.combined-x.combined||y.year-x.year||y.week-x.week)[0]||null;
  let best={owner:null,count:0,start:null,end:null},current={owner:null,count:0,start:null,end:null};
  [...normalized].sort((x,y)=>x.year-y.year||x.week-y.week).forEach(g=>{
    if(g.winner==="Tie"){current={owner:null,count:0,start:null,end:null};return;}
    if(current.owner===g.winner){current.count++;current.end=g;}else{current={owner:g.winner,count:1,start:g,end:g};}
    if(current.count>best.count||current.count===best.count&&current.end&&(current.end.year>best.end?.year||current.end.year===best.end?.year&&current.end.week>best.end?.week))best={...current};
  });
  let status;
  if(!summary.games.length) status="No meetings are on file for this selected scope.";
  else if(summary.aw===summary.bw) status=`The series is deadlocked at ${summary.aw}-${summary.bw}${summary.t?` with ${summary.t} tie${summary.t===1?"":"s"}`:""}.`;
  else {const leader=summary.aw>summary.bw?a:b,lead=Math.abs(summary.aw-summary.bw),wins=Math.max(summary.aw,summary.bw),losses=Math.min(summary.aw,summary.bw);status=`${leader} controls the series ${wins}-${losses}${summary.t?`-${summary.t}`:""}, a ${lead}-game advantage.`;}
  return {newest,largest,highest,best,status};
}
function gameCenter(){
  if(currentTheme()!=="florida-man") return legacyGameCenter();
  const owners=gameOwners();
  if(!owners.length) return `<div class="empty">No game data is available.</div>`;
  const activeSet=activeLoserOwners();
  // The rivalry grid needs the permanent owner universe, not only owners present
  // in the currently selected season. This mirrors The Suspects status logic.
  const permanentGridOwners=[...new Set(loserRaw.games.flatMap(g=>[loserCanonicalName(g.teamA),loserCanonicalName(g.teamB)]))].sort();
  const activeGridOwners=permanentGridOwners.filter(o=>activeSet.has(loserCanonicalName(o)));
  const gridOwners=state.rivalryOwnerFilter==="active"?activeGridOwners:permanentGridOwners;
  if(!owners.includes(state.gameTeamA)) state.gameTeamA=owners[0];
  if(!owners.includes(state.gameTeamB)||state.gameTeamB===state.gameTeamA) state.gameTeamB=owners.find(x=>x!==state.gameTeamA)||owners[0];
  const a=state.gameTeamA,b=state.gameTeamB,s=matchupSummary(a,b),caseFile=rivalryCaseFile(a,b,s);
  const optionList=(selected)=>owners.map(o=>`<option value="${esc(o)}" ${o===selected?"selected":""}>${esc(o)}</option>`).join("");
  const matrix=gridOwners.map(row=>`<tr><th class="${ownerStatusClass(row)}">${loserOwnerLink(row)}</th>${gridOwners.map(col=>{
    if(row===col)return `<td class="matrix-self">—</td>`;
    const r=matchupSummary(row,col);
    return `<td><button class="matrix-cell" data-team-a="${esc(row)}" data-team-b="${esc(col)}" title="${esc(row)} vs ${esc(col)}">${r.aw}-${r.bw}${r.t?`-${r.t}`:""}</button></td>`;
  }).join("")}</tr>`).join("");
  const selected=selectedLoserGames();
  const performances=selected.flatMap(g=>[
    {name:loserCanonicalName(g.teamA),score:Number(g.scoreA),opp:loserCanonicalName(g.teamB),oppScore:Number(g.scoreB),year:g.year,week:g.week},
    {name:loserCanonicalName(g.teamB),score:Number(g.scoreB),opp:loserCanonicalName(g.teamA),oppScore:Number(g.scoreA),year:g.year,week:g.week}
  ]).filter(x=>Number.isFinite(x.score));
  const margins=selected.map(g=>({...g,margin:Math.abs(Number(g.scoreA)-Number(g.scoreB))})).filter(g=>Number.isFinite(g.margin));
  const high=[...performances].sort((x,y)=>y.score-x.score)[0];
  const close=[...margins].sort((x,y)=>x.margin-y.margin)[0];
  const blowout=[...margins].sort((x,y)=>y.margin-x.margin)[0];
  const avg=performances.length?performances.reduce((n,x)=>n+x.score,0)/performances.length:0;
  const scope=isAllSeasons()?"All-Time Game Archive":`${state.season} Game Day`;
  const resultLabel=g=>g.isChampionship?"Championship":g.isSacko||g.gameType==="sacko"?"Sacko Bowl":g.isConsolation||g.gameType==="consolation"?"Consolation":g.isPlayoff?"Playoff":"Regular Season";
  const recent=[...selected].sort((x,y)=>y.year-x.year||y.week-x.week).slice(0,isAllSeasons()?8:12);
  return `<header class="game-day-hero paper-panel"><div><span class="document-code">League of Losers · Certified Score Desk</span><p class="game-day-kicker">Scores, grudges and statistical wreckage</p><h2>${scope}</h2><p>Every final score is pulled from the immutable matchup ledger. Select two owners below to open the complete rivalry file.</p></div><div class="score-desk-seal"><strong>${selected.length}</strong><span>FINAL<br>SCORES</span><small>${isAllSeasons()?`${new Set(selected.map(g=>g.year)).size} seasons`:`${new Set(selected.map(g=>g.week)).size} weeks`}</small></div></header>
  <section class="game-day-marquee">
    <article><span>Scoring High</span><strong>${high?fmt.format(high.score):"—"}</strong><h3>${high?loserOwnerLink(high.name):"No record"}</h3><small>${high?`${high.year} · Week ${high.week}`:""}</small></article>
    <article><span>Average Team Score</span><strong>${fmt.format(avg)}</strong><h3>${performances.length} performances</h3><small>Certified scoring average</small></article>
    <article><span>Closest Finish</span><strong>${close?fmt.format(close.margin):"—"}</strong><h3>${close?`${esc(loserCanonicalName(close.teamA))} vs ${esc(loserCanonicalName(close.teamB))}`:"No record"}</h3><small>${close?`${close.year} · Week ${close.week}`:""}</small></article>
    <article class="warning"><span>Largest Blowout</span><strong>${blowout?fmt.format(blowout.margin):"—"}</strong><h3>${blowout?`${esc(loserCanonicalName(blowout.teamA))} vs ${esc(loserCanonicalName(blowout.teamB))}`:"No record"}</h3><small>${blowout?`${blowout.year} · Week ${blowout.week}`:""}</small></article>
  </section>
  <section class="game-day-grid"><div class="paper-panel score-desk"><div class="panel-heading"><h2>${isAllSeasons()?"Latest Finals":"Season Scoreboard"}</h2><span>${recent.length} displayed · newest first</span></div><div class="scoreboard-list">${recent.map(g=>{const ga=loserCanonicalName(g.teamA),gb=loserCanonicalName(g.teamB),sa=Number(g.scoreA),sb=Number(g.scoreB);return `<article class="scoreboard-game ${g.isChampionship?"championship-game":g.isSacko||g.gameType==="sacko"?"sacko-game":""}"><div class="scoreboard-meta"><strong>${g.year} · Week ${g.week}</strong><span>${resultLabel(g)}</span></div><div class="scoreboard-side ${sa>sb?"winner":""}"><span>${loserOwnerLink(ga)}</span><b>${fmt.format(sa)}</b></div><div class="scoreboard-side ${sb>sa?"winner":""}"><span>${loserOwnerLink(gb)}</span><b>${fmt.format(sb)}</b></div><div class="scoreboard-margin">${sa===sb?"TIE":`${fmt.format(Math.abs(sa-sb))}-point margin`}</div></article>`}).join("")}</div></div></section>
  <section class="paper-panel matchup-explorer rivalry-desk"><div class="rivalry-desk-heading"><div><span>Head-to-Head Bureau</span><h2>Open a Rivalry File</h2></div><small>Choose any two owners</small></div><div class="matchup-selectors"><label>Owner A<select id="gameTeamA">${optionList(a)}</select></label><strong>VS</strong><label>Owner B<select id="gameTeamB">${optionList(b)}</select></label></div>
  <div class="series-summary"><article><span>${loserOwnerLink(a)}</span><strong>${s.aw}</strong><small>series wins</small></article><div><b>${s.games.length} meetings</b><small>${s.t?`${s.t} tie${s.t===1?"":"s"}`:"All-time series"}</small></div><article><strong>${s.bw}</strong><span>${loserOwnerLink(b)}</span><small>series wins</small></article></div></section>
  <section class="paper-panel rivalry-case-file"><div class="panel-heading"><h2>Rivalry Case File</h2><span>${esc(a)} vs. ${esc(b)}</span></div><div class="rivalry-case-grid"><article><span>Largest Victory</span><strong>${caseFile.largest?fmt.format(caseFile.largest.margin):"—"}</strong><small>${caseFile.largest?`${loserOwnerLink(caseFile.largest.winner)} · ${fmt.format(caseFile.largest.aScore)}-${fmt.format(caseFile.largest.bScore)} · ${caseFile.largest.year} Wk ${caseFile.largest.week}`:"No decision on file"}</small></article><article><span>Longest Win Streak</span><strong>${caseFile.best.count||"—"}</strong><small>${caseFile.best.owner?`${loserOwnerLink(caseFile.best.owner)} · ${caseFile.best.start.year} Wk ${caseFile.best.start.week}–${caseFile.best.end.year} Wk ${caseFile.best.end.week}`:"No streak on file"}</small></article><article><span>Highest Combined Score</span><strong>${caseFile.highest?fmt.format(caseFile.highest.combined):"—"}</strong><small>${caseFile.highest?`${fmt.format(caseFile.highest.aScore)}-${fmt.format(caseFile.highest.bScore)} · ${caseFile.highest.year} Wk ${caseFile.highest.week}`:"No score on file"}</small></article><article><span>Last Meeting</span><strong>${caseFile.newest?`${caseFile.newest.year} Wk ${caseFile.newest.week}`:"—"}</strong><small>${caseFile.newest?`${caseFile.newest.winner==="Tie"?"Tie":loserOwnerLink(caseFile.newest.winner)} · ${fmt.format(caseFile.newest.aScore)}-${fmt.format(caseFile.newest.bScore)}`:"No meeting on file"}</small></article></div><p class="series-status"><b>Series Status:</b> ${esc(caseFile.status)}</p></section>
  <section class="paper-panel table-panel rivalry-ledger"><div class="panel-heading"><h2>Rivalry Ledger</h2><span>${esc(a)} vs. ${esc(b)}</span></div>${s.games.length?`<div class="table-wrap"><table><thead><tr><th>Year</th><th>Week</th><th>${esc(a)}</th><th>${esc(b)}</th><th>Winner</th><th>Classification</th></tr></thead><tbody>${s.games.map(g=>{const ga=loserCanonicalName(g.teamA),aScore=ga===a?g.scoreA:g.scoreB,bScore=ga===b?g.scoreA:g.scoreB,winner=Number(aScore)===Number(bScore)?"Tie":Number(aScore)>Number(bScore)?a:b;return `<tr><td>${g.year}</td><td>${g.week}</td><td><strong>${fmt.format(aScore)}</strong></td><td><strong>${fmt.format(bScore)}</strong></td><td>${winner==="Tie"?"Tie":loserOwnerLink(winner)}</td><td>${resultLabel(g)}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">These owners have not played in the selected scope.</div>`}</section>
  <section class="paper-panel table-panel matchup-matrix"><div class="panel-heading rivalry-grid-heading"><h2>League Rivalry Grid</h2><div class="suspect-filter-buttons rivalry-owner-toggle" role="group" aria-label="Rivalry grid owner status"><button type="button" data-rivalry-owner-filter="active" class="${state.rivalryOwnerFilter==="active"?"active":""}">Active Owners</button><button type="button" data-rivalry-owner-filter="all" class="${state.rivalryOwnerFilter==="all"?"active":""}">All Owners</button></div></div>${gridOwners.length?`<div class="table-wrap"><table><thead><tr><th class="grid-corner">Owner</th>${gridOwners.map(o=>`<th class="${ownerStatusClass(o)}">${loserOwnerLink(o)}</th>`).join("")}</tr></thead><tbody>${matrix}</tbody></table></div>`:`<div class="empty">No owners have rivalry records in this scope.</div>`}</section>`;
}
function renderGameInPlace(){const y=window.scrollY;content.innerHTML=gameCenter();bindInternalLinks();bindGameExplorer();requestAnimationFrame(()=>window.scrollTo(0,y));}
function bindGameExplorer(){
  document.querySelector("#gameTeamA")?.addEventListener("change",e=>{state.gameTeamA=e.target.value;if(state.gameTeamA===state.gameTeamB)state.gameTeamB=gameOwners().find(x=>x!==state.gameTeamA)||state.gameTeamB;renderGameInPlace();});
  document.querySelector("#gameTeamB")?.addEventListener("change",e=>{state.gameTeamB=e.target.value;if(state.gameTeamA===state.gameTeamB)state.gameTeamA=gameOwners().find(x=>x!==state.gameTeamB)||state.gameTeamA;renderGameInPlace();});
  document.querySelectorAll(".matrix-cell").forEach(btn=>btn.addEventListener("click",()=>{state.gameTeamA=btn.dataset.teamA;state.gameTeamB=btn.dataset.teamB;renderGameInPlace();}));
  document.querySelectorAll("[data-rivalry-owner-filter]").forEach(btn=>btn.addEventListener("click",()=>{state.rivalryOwnerFilter=btn.dataset.rivalryOwnerFilter;renderGameInPlace();}));
}

function awardsCenter(){
  if(currentTheme()!=="florida-man") return legacyAwardsCenter();
  const unique=(items)=>[...new Map((items||[]).map(x=>[`${x.year}|${loserManagerId(x.winner)||x.winner}`,x])).values()];
  const allTitles=unique(loserRaw.championships).sort((a,b)=>b.year-a.year);
  const allSackos=unique(loserRaw.sackos).sort((a,b)=>b.year-a.year);
  const titles=allTitles.filter(x=>isAllSeasons()||x.year===state.season), sackos=allSackos.filter(x=>isAllSeasons()||x.year===state.season);
  const annual=isAllSeasons()?null:(awardsArchive.annualAwards||[]).find(x=>x.season===state.season);
  const ownerLinkByName=name=>{const id=loserManagerId(name);return id?managerLink(id,name):esc(name||"Unknown");};
  const counts={};allTitles.forEach(x=>{const id=loserManagerId(x.winner)||x.winner;counts[id]=(counts[id]||0)+1;});
  const champions=Object.entries(counts).map(([id,count])=>({id,count,name:managerById(id)?.name||allTitles.find(x=>(loserManagerId(x.winner)||x.winner)===id)?.winner||id,years:allTitles.filter(x=>(loserManagerId(x.winner)||x.winner)===id).map(x=>x.year)})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  const latest=titles[0]||allTitles[0], latestSacko=sackos[0]||allSackos[0];
  const documentedGames=(gameArchive.coverage?.games)||loserRaw.games?.length||0;
  const maxTitles=champions.length?Math.max(...champions.map(c=>c.count)):0;
  const titleCard=x=>`<article class="museum-plaque championship-plaque"><div class="museum-year">${x.year}</div><div class="museum-copy"><span>League Champion</span><h3>${ownerLinkByName(x.winner)}</h3><p>${esc(x.score)}</p><small>Defeated ${ownerLinkByName(x.runnerUp)}</small></div><div class="museum-icon official-seal-icon"><img src="assets/seals/champion-seal-approved.png" alt="Champion seal"></div></article>`;
  const sackoCard=x=>`<article class="museum-plaque sacko-plaque"><div class="museum-year">${x.year}</div><div class="museum-copy"><span>Sacko-Rolston Champ</span><h3>${ownerLinkByName(x.winner)}</h3><p>${esc(x.score)}</p><small>Lost to ${ownerLinkByName(x.runnerUp)}</small></div><div class="museum-icon official-seal-icon"><img src="assets/seals/sacko-rolston-seal-approved.png" alt="Sacko-Rolston seal"></div></article>`;
  const awards=annual?.awards||[];
  if(!isAllSeasons()) return `<section class="trophy-museum-hero paper-panel"><div class="museum-hero-copy"><span class="document-code">League of Losers Historical Society · ${state.season} Exhibit</span><p class="museum-kicker">The Trophy Case</p><h2>${latest?`${esc(latest.winner)} Takes the Crown`:`${state.season} Honors Await Certification`}</h2><p>${latest?`${ownerLinkByName(latest.winner)} defeated ${ownerLinkByName(latest.runnerUp)} in the championship, ${esc(latest.score)}.`:'No championship result is recorded for this season.'}</p></div><div class="museum-hero-object official-hero-seal"><img src="assets/seals/champion-seal-approved.png" alt="Official Champion seal"><strong>${state.season}</strong><span>Championship Exhibit</span></div></section><div class="season-honors-grid"><article class="season-honor champion-honor paper-panel"><span class="honor-label">Champion</span><div class="honor-art official-honor-seal"><img src="assets/seals/champion-seal-approved.png" alt="Champion seal"></div><h3>${latest?ownerLinkByName(latest.winner):'Pending'}</h3><p>${latest?`${esc(latest.score)} · Runner-up ${ownerLinkByName(latest.runnerUp)}`:'No championship event recorded'}</p></article><article class="season-honor sacko-honor paper-panel"><span class="honor-label">Sacko-Rolston Champ</span><div class="honor-art official-honor-seal"><img src="assets/seals/sacko-rolston-seal-approved.png" alt="Sacko-Rolston seal"></div><h3>${latestSacko?ownerLinkByName(latestSacko.winner):'Pending'}</h3><p>${latestSacko?`${esc(latestSacko.score)} · Lost to ${ownerLinkByName(latestSacko.runnerUp)}`:'No Sacko event recorded'}</p></article></div><section class="paper-panel performance-gallery"><div class="panel-heading"><h2>${state.season} Performance Awards</h2></div>${awards.length?`<div class="award-ribbon-grid">${awards.map((a,i)=>`<article class="award-ribbon-card"><div class="award-medallion">${String(i+1).padStart(2,'0')}</div><span>${esc(a.label)}</span><h3>${a.ownerId?awardOwnerLink(a.ownerId,a.recipient):esc(a.recipient)}</h3><strong>${fmt.format(a.value)}</strong><small>${esc(a.detail)}</small></article>`).join('')}</div>`:`<div class="empty">No derived performance awards are available for ${state.season}.</div>`}</section>`;
  return `<section class="trophy-museum-hero paper-panel"><div class="museum-hero-copy"><span class="document-code">Permanent Collection · ${currentLeague().seasons[0]}–${latestSeason()}</span><p class="museum-kicker">The Trophy Case</p><h2>Glory, Shame & Questionable Decisions</h2><p>Every certified title and every Sacko-Rolston result, consolidated by permanent owner identity.</p><div class="museum-hero-stats"><span><strong>${documentedGames}</strong> documented games</span><span><strong>${allTitles.length}</strong> championships</span><span><strong>${allSackos.length}</strong> Sackos</span><span><strong>${champions.length}</strong> champions</span></div></div><div class="museum-hero-object official-hero-seal trophy-header-seal"><img src="assets/seals/champion-seal-approved.png" alt="Official Champion seal"></div></section><section class="paper-panel champion-wall"><div class="panel-heading"><h2>Wall of Champions</h2></div><div class="champion-wall-grid dynamic-title-wall">${champions.map((c,i)=>{const rank=1+champions.filter(x=>x.count>c.count).length;return `<article class="champion-nameplate title-count-${Math.min(c.count,4)} ${c.count===maxTitles?'dynasty':''}"><span class="champion-rank">${String(rank).padStart(2,'0')}</span><div><h3>${managerLink(c.id,c.name)}</h3><p>${c.years.sort((a,b)=>b-a).join(' · ')}</p><small>${c.count} championship${c.count===1?'':'s'}</small></div><strong>${c.count}</strong></article>`}).join('')||'<div class="empty">No champions recorded.</div>'}</div></section><div class="museum-collection-grid"><section class="paper-panel collection-wing championship-wing"><div class="panel-heading"><h2>Championship Gallery</h2></div><div class="museum-plaque-grid">${titles.map(titleCard).join('')||'<div class="empty">No championship games recorded.</div>'}</div></section><section class="paper-panel collection-wing sacko-wing"><div class="panel-heading"><h2>Sacko-Rolston Champ</h2></div><div class="museum-plaque-grid">${sackos.map(sackoCard).join('')||'<div class="empty">No Sacko games recorded.</div>'}</div></section></div>`;
}


const wantedPosterProfiles = {
  garrett: {
    alias: "The Commissioner",
    charges: [
      "Illegal tanking",
      "Abuse of commissioner powers",
      "Manipulation of league rules"
    ],
    signature: "The Commissioner",
    title: "Commissioner of LOLSO"
  }
};

function renderWantedPoster(manager){
  const key=String(manager.id||"").toLowerCase();
  const profile=wantedPosterProfiles[key];
  if(!profile)return "";
  return `<header class="wanted-poster wanted-poster-${esc(key)}" aria-label="${esc(manager.name)} wanted poster">
    <div class="wanted-template-portrait"><div class="wanted-portrait-crop">${portrait(manager.id,manager.name,"wanted-profile-portrait")}</div></div>
    <img class="wanted-template-seal" src="assets/sheriff/hardware/league-wax-seal.png" alt="League of Losers wax seal">
    <div class="wanted-template-alias">${esc(profile.alias)}</div>
    <ul class="wanted-template-charges">${profile.charges.map(charge=>`<li>${esc(charge)}</li>`).join("")}</ul>
    <div class="wanted-template-signature"><strong>${esc(profile.signature)}</strong><span>${esc(profile.title)}</span></div>
  </header>`;
}

function floridaManagerFile(){
  const m=managerById(state.managerId); if(!m)return `<div class="empty">This owner could not be located.</div>`;
  const career=currentLeague().rows.filter(r=>r.managerId===m.id).sort((a,b)=>b.season-a.season);
  const selected=isAllSeasons()?null:career.find(r=>r.season===state.season);
  const managers=currentLeague().managers;
  const titles=loserRaw.championships.filter(x=>loserManagerId(x.winner)===m.id).sort((a,b)=>b.year-a.year);
  const sackos=loserRaw.sackos.filter(x=>loserManagerId(x.winner)===m.id).sort((a,b)=>b.year-a.year);
  const gameProfile=gameArchive.ownerGameSummary?.find(o=>o.siteManagerId===m.id);
  const rivals=archiveOwnerForManager(m.id)?.topRivalries||[];
  const favorite=[...rivals].sort((a,b)=>(b.wins-b.losses)-(a.wins-a.losses)||b.games-a.games)[0];
  const biggest=[...rivals].sort((a,b)=>b.games-a.games)[0];
  const winsRank=rankOf(managers,m.id,x=>x.wins),pointsRank=rankOf(managers,m.id,x=>x.pointsFor),titleRank=rankOf(managers,m.id,x=>loserRaw.championships.filter(c=>loserManagerId(c.winner)===x.id).length),winPctRank=rankOf(managers,m.id,x=>x.winPct);
  const best=[...career].sort((a,b)=>(a.overallRank??999)-(b.overallRank??999)||b.pointsFor-a.pointsFor)[0];
  const totalMoves=career.reduce((a,r)=>a+(r.moves||0),0),totalTrades=career.reduce((a,r)=>a+(r.trades||0),0);
  const rivalName=r=>{if(!r)return "—";const id=r.opponentSiteManagerId;const fallback=loserCanonicalName(r.opponentOwnerId?.replace(/^owner_/,"")||id||"—");const label=id?(managerById(id)?.name||fallback):fallback;return id?managerLink(id,label):esc(label);};
  const milestones=[...titles.map(x=>({year:x.year,type:"title",headline:"League Champion",detail:`Defeated ${x.runnerUp} · ${x.score}`})),...sackos.map(x=>({year:x.year,type:"sacko",headline:"Sacko Recipient",detail:`Lost to ${x.runnerUp} · ${x.score}`})),...career.map(r=>({year:r.season,type:"season",headline:esc(r.team),detail:`${r.wins}-${r.losses}-${r.ties} · Overall #${r.overallRank} · ${fmt.format(r.pointsFor)} PF`}))].sort((a,b)=>b.year-a.year);
  const wantedPoster=renderWantedPoster(m);
  const wantedHero=wantedPoster||`<header class="owner-profile-hero paper-panel"><div class="owner-profile-photo">${portrait(m.id,m.name,"owner-profile-portrait")}<span class="profile-evidence-tag">EXHIBIT A</span></div><div class="owner-profile-intro"><span class="document-code">Florida Fantasy Bureau · Case ${esc(m.id)}</span><h2>${esc(m.name)}</h2><p class="owner-profile-deck">${m.firstSeason}–${m.lastSeason} · ${m.seasons} seasons · ${m.teams.length} documented franchise name${m.teams.length===1?"":"s"}</p><div class="owner-profile-badges"><span class="title-badge">🏆 ${titles.length} Championship${titles.length===1?"":"s"}</span><span class="sacko-badge">🚽 ${sackos.length} Sacko${sackos.length===1?"":"s"}</span><span>${m.playoffs} Playoff Trips</span></div><div class="owner-franchise-line"><b>Known aliases:</b> ${m.teams.map(esc).join(" · ")}</div></div><div class="owner-profile-stamp">RAP<br>SHEET</div></header>`;
  const profileStats=`<div class="owner-profile-scoreboard ${wantedPoster?"owner-profile-stat-column":""}"><article><span>Career Record</span><strong>${m.wins}-${m.losses}-${m.ties}</strong><small>#${winsRank} all-time wins</small></article><article><span>Win Percentage</span><strong>${pct(m.winPct)}</strong><small>#${winPctRank} league rank</small></article><article><span>Career Points</span><strong>${fmt.format(m.pointsFor)}</strong><small>#${pointsRank} league rank</small></article><article><span>Title Rank</span><strong>#${titleRank}</strong><small>${titles.length} certified title${titles.length===1?"":"s"}</small></article></div>`;
  const profileTop=wantedPoster?`<div class="owner-wanted-layout">${wantedHero}<aside class="owner-person-stats" aria-label="${esc(m.name)} career statistics"><div class="owner-stats-heading"><span>Case Statistics</span><h2>${esc(m.name)}</h2><p>Permanent owner record</p></div>${profileStats}</aside></div>`:`${wantedHero}${profileStats}`;
  return `<section class="owner-file owner-rap-sheet ${wantedPoster?"owner-file-wanted":""}">${profileTop}
  <div class="owner-feature-grid"><section class="paper-panel owner-current-brief"><div class="panel-heading"><h2>${isAllSeasons()?"Career at a Glance":`${state.season} Incident Report`}</h2><span>${isAllSeasons()?"Permanent record":"Season-controlled view"}</span></div>${isAllSeasons()?`<div class="owner-big-stat"><strong>#${best?.overallRank??"—"}</strong><span>Best overall finish · ${best?.season||"—"}</span></div><div class="owner-brief-columns"><p><b>${m.playoffs}</b> playoff appearances</p><p><b>${fmt.format(m.pointsFor)}</b> points scored</p><p><b>${totalMoves}</b> roster moves</p><p><b>${totalTrades}</b> trades</p></div>`:selected?`<div class="season-incident"><div><span>Franchise</span><strong>${esc(selected.team)}</strong></div><div><span>Record</span><strong>${selected.wins}-${selected.losses}-${selected.ties}</strong></div><div><span>Overall</span><strong>#${selected.overallRank}</strong></div><div><span>Final</span><strong>${selected.playoffRank?`#${selected.playoffRank}`:"—"}</strong></div></div><p class="incident-production">${fmt.format(selected.pointsFor)} PF · ${fmt.format(selected.pointsAgainst)} PA · ${selected.moves||0} moves · ${selected.trades||0} trades</p>`:`<div class="empty compact">No season record for ${state.season}.</div>`}</section>
  <aside class="paper-panel owner-rivalry-box"><div class="panel-heading"><h2>Rivalry Wire</h2><span>Head-to-head intelligence</span></div><div class="rivalry-feature"><span>Most-played rival</span><strong>${rivalName(biggest)}</strong><p>${biggest?`${biggest.games} meetings · ${biggest.wins}-${biggest.losses}-${biggest.ties}`:"No matchup record"}</p></div><div class="rivalry-feature victim"><span>Favorite victim</span><strong>${rivalName(favorite)}</strong><p>${favorite?`${favorite.wins}-${favorite.losses}-${favorite.ties} in the series`:"No matchup record"}</p></div><div class="profile-high-score"><span>Game-log high</span><strong>${gameProfile?.highScore==null?"—":fmt.format(gameProfile.highScore)}</strong></div></aside></div>
  <div class="owner-history-grid"><section class="paper-panel owner-accolades"><div class="panel-heading"><h2>Trophy & Shame Cabinet</h2><span>Official league outcomes</span></div><div class="accolade-columns"><div><h3>Championships</h3>${titles.length?titles.map(x=>`<article class="accolade-ticket champion"><b>${x.year}</b><span>${esc(x.score)}</span><small>over ${esc(x.runnerUp)}</small></article>`).join(""):`<div class="empty compact">No titles on file.</div>`}</div><div><h3>Sackos</h3>${sackos.length?sackos.map(x=>`<article class="accolade-ticket sacko"><b>${x.year}</b><span>${esc(x.score)}</span><small>lost to ${esc(x.runnerUp)}</small></article>`).join(""):`<div class="empty compact">No Sackos on file.</div>`}</div></div></section>
  <section class="paper-panel owner-milestones"><div class="panel-heading"><h2>Career Timeline</h2><span>Newest report first</span></div><div class="owner-timeline">${milestones.map(x=>`<article class="timeline-entry ${x.type}"><b>${x.year}</b><div><strong>${x.headline}</strong><span>${x.detail}</span></div>${x.type==="title"?`<img class="timeline-official-seal" src="assets/seals/champion-seal-approved.png" alt="Champion seal">`:x.type==="sacko"?`<img class="timeline-official-seal" src="assets/seals/sacko-rolston-seal-approved.png" alt="Sacko-Rolston seal">`:""}</article>`).join("")}</div></section></div>
  <section class="paper-panel table-panel owner-ledger"><div class="panel-heading"><h2>Season-by-Season Ledger</h2><span>Certified performance history</span></div><div class="table-wrap"><table><thead><tr><th>Season</th><th>Franchise</th><th>Record</th><th>Win %</th><th>Overall</th><th>Final</th><th>Points</th><th>Activity</th></tr></thead><tbody>${career.map(r=>{const g=r.wins+r.losses+r.ties;return `<tr class="${!isAllSeasons()&&r.season===state.season?"selected-season-row":""}"><td><button class="season-jump" data-season-jump="${r.season}">${r.season}</button></td><td><strong>${esc(r.team)}</strong></td><td>${r.wins}-${r.losses}-${r.ties}</td><td>${pct(g?(r.wins+r.ties*.5)/g:0)}</td><td>#${r.overallRank}</td><td>${r.playoffRank?`#${r.playoffRank}`:"—"}</td><td>${fmt.format(r.pointsFor)}</td><td>${r.moves||0} M · ${r.trades||0} T</td></tr>`}).join("")}</tbody></table></div></section></section>`;
}
function managerFile(){ return currentTheme()==="florida-man"?floridaManagerFile():legacyManagerFile(); }

function bindPerformanceSort(){document.querySelectorAll("[data-sort-key]").forEach(h=>h.querySelector("button")?.addEventListener("click",()=>{const scrollX=window.scrollX,scrollY=window.scrollY,key=h.dataset.sortKey;if(state.performanceSort.key===key)state.performanceSort.direction=state.performanceSort.direction==="asc"?"desc":"asc";else state.performanceSort={key,direction:["team","manager"].includes(key)?"asc":"desc"};render(true);requestAnimationFrame(()=>window.scrollTo({left:scrollX,top:scrollY,behavior:"auto"}));}));}
function bindInternalLinks(){document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{location.hash=b.dataset.go;}));document.querySelectorAll("[data-season-jump]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();state.season=Number(el.dataset.seasonJump);localStorage.setItem(`season:${state.leagueId}`,String(state.season));populate();if(el.getAttribute("href")==="#history")location.hash="history";else render();}));}

function commissionerStore(){try{return JSON.parse(localStorage.getItem("lolCommissionerData")||"{}")||{}}catch{return {}}}
function saveCommissionerStore(v){v.lastUpdated=new Date().toISOString();localStorage.setItem("lolCommissionerData",JSON.stringify(v));}
function commissionerOffice(){
  if(currentTheme()!=="florida-man")return transactions();
  const saved=commissionerStore(),keepers=saved.keepers||[],games=saved.games||[],titles=saved.championships||[],sackos=saved.sackos||[],overrides=saved.overrides||[];
  const localTotal=keepers.length+games.length+titles.length+sackos.length+overrides.length;
  const lastDraft=saved.lastUpdated?new Date(saved.lastUpdated).toLocaleString():"No local changes";
  const recent=[
    ...keepers.map(x=>({type:"Keeper",detail:`${x.year||"—"} · ${x.team||"Unknown"} · ${x.player||"Unknown"}`})),
    ...games.map(x=>({type:"Game import",detail:`${x.season||x.year||"Season unknown"} · ${x.team1||x.home||"Game record"}`})),
    ...titles.map(x=>({type:"Championship",detail:`${x.year||"—"} · ${x.winner||"Winner pending"}`})),
    ...sackos.map(x=>({type:"Sacko",detail:`${x.year||"—"} · ${x.winner||x.loser||"Loser pending"}`})),
    ...overrides.map(x=>({type:"Override",detail:`${x.path||"Record"} · ${x.corrected||"Corrected"}`}))
  ].slice(-8).reverse();
  return `<section class="commissioner-office-v2">
    <header class="commissioner-hero commissioner-dossier">
      <div class="commissioner-hero-copy"><span class="document-code">League Headquarters · Authorized Personnel Only · Form LOL-09</span><p class="commissioner-kicker">Office of the Commissioner</p><h2>Records, Rulings & Publication Desk</h2><p>Prepare source imports, enter commissioner-certified facts, document corrections and produce the merged backup used for the next approved deployment. Nothing entered here changes the published archive automatically.</p><div class="commissioner-hero-meta"><span><b>Archive:</b> 2017–${latestSeason()}</span><span><b>Canonical games:</b> ${loserRaw.games?.length||0}</span><span><b>Local status:</b> ${localTotal?`${localTotal} unpublished item${localTotal===1?"":"s"}`:"clean"}</span></div></div>
      <aside class="commissioner-seal-display" aria-label="Official League of Losers seal"><img src="assets/sheriff/hardware/league-wax-seal.png" alt="Official League of Losers wax seal"></aside>
    </header>

    <section class="commissioner-status-strip" aria-label="Commissioner office status">
      <article><span>Local Draft Items</span><strong>${localTotal}</strong><small>${lastDraft}</small></article>
      <article><span>Certified Games</span><strong>${loserRaw.games?.length||0}</strong><small>Immutable source archive</small></article>
      <article><span>Certified Keepers</span><strong>${loserRaw.keepers?.length||0}</strong><small>Permanent historical record</small></article>
      <article><span>Audit Overrides</span><strong>${overrides.length}</strong><small>Original facts retained</small></article>
    </section>

    <section class="paper-panel commissioner-bulletin commissioner-workflow"><div class="panel-heading"><h2>Publication Workflow</h2><span>Complete in order</span></div>
      <ol class="publication-steps"><li><b>1 · Collect</b><span>Import source exports or enter commissioner-certified facts.</span></li><li><b>2 · Review</b><span>Inspect the local draft ledger and document every correction.</span></li><li><b>3 · Export</b><span>Create and preserve a complete merged JSON backup.</span></li><li><b>4 · Publish</b><span>Replace canonical data only after manual QA and approval.</span></li></ol>
    </section>

    <div class="commissioner-module-stack">
      <section class="paper-panel office-module office-step"><div class="office-step-number">01</div><div class="panel-heading"><h2>Import Season Data</h2><span>Collect · JSON source intake</span></div><div class="office-module-body"><label class="office-field"><span>Season export or normalized backup</span><input id="seasonImport" type="file" accept="application/json,.json"></label><p class="office-help">The importer previews either a <code>games</code> array or a League of Losers backup. Imported records remain local until export and publication.</p><div id="importPreview" class="empty compact">No file selected.</div></div></section>

      <section class="paper-panel office-module office-step"><div class="office-step-number">02</div><div class="panel-heading"><h2>Add Keeper</h2><span>Collect · Manual commissioner entry</span></div><form id="keeperForm" class="office-form office-form-wide"><label><span>Year</span><input name="year" type="number" min="2017" required placeholder="2026"></label><label><span>Owner</span><input name="team" required placeholder="Owner name"></label><label><span>Player</span><input name="player" required placeholder="Player name"></label><label><span>Position</span><input name="pos" placeholder="RB"></label><label><span>Kept rank</span><input name="keptRank" type="number" placeholder="Draft rank"></label><label><span>Finish rank</span><input name="finish" type="number" placeholder="Final rank"></label><label class="office-field-span"><span>Notes</span><input name="notes" placeholder="Commissioner notes"></label><button type="submit">Save Keeper to Local Draft</button></form></section>

      <section class="paper-panel office-module office-step bulk-game-module"><div class="office-step-number">03</div><div class="panel-heading"><h2>Enter Final Games</h2><span>Collect · Bulk week entry</span></div><form id="bulkGameForm" class="bulk-game-form"><div class="bulk-game-header"><label><span>Season</span><input id="bulkGameYear" name="year" type="number" min="2017" required value="${latestSeason()}" placeholder="2026"></label><label><span>Week</span><input id="bulkGameWeek" name="week" type="number" min="1" required value="1"></label><div class="bulk-game-guidance"><strong>Any number of games</strong><span>Add every final matchup for the selected week. Saving a matching game creates a replacement in the exported backup instead of a duplicate.</span></div></div><div id="bulkGameRows" class="bulk-game-rows"></div><div class="bulk-game-actions"><button id="addBulkGame" type="button" class="secondary">+ Add Matchup</button><button type="submit">Save All Games to Local Draft</button></div></form></section>

      <section class="paper-panel office-module office-step"><div class="office-step-number">04</div><div class="panel-heading"><h2>Commissioner Override</h2><span>Review · Audited correction</span></div><form id="overrideForm" class="office-form office-form-wide"><label><span>Record path or ID</span><input name="path" required placeholder="games.2024.week14..."></label><label><span>Original value</span><input name="original" placeholder="Value currently stored"></label><label><span>Corrected value</span><input name="corrected" required placeholder="Approved value"></label><label><span>Reason</span><input name="reason" required placeholder="Source and ruling"></label><button type="submit">Save Audited Override</button></form></section>

      <section class="paper-panel audit-ledger office-step"><div class="office-step-number">05</div><div class="panel-heading"><h2>Local Draft Ledger</h2><span>Review · ${localTotal} pending</span></div>${recent.length?`<div class="audit-entries">${recent.map(x=>`<article><b>${esc(x.type)}</b><span>${esc(x.detail)}</span></article>`).join("")}</div>`:`<div class="empty compact">No unpublished entries in this browser.</div>`}</section>

      <section class="paper-panel source-custody office-step"><div class="office-step-number">06</div><div class="panel-heading"><h2>Chain of Custody</h2><span>Review · Source priority</span></div><ol><li><b>Commissioner Overrides</b><span>Explicit audited corrections</span></li><li><b>Game Logs</b><span>Normalized matchup facts</span></li><li><b>League Legacy Data</b><span>Existing certified archive</span></li><li><b>Legacy Imports</b><span>Historical backfill sources</span></li></ol></section>

      <section class="paper-panel office-actions office-step"><div class="office-step-number">07</div><div class="panel-heading"><h2>Backup & Publication Desk</h2><span>Export · Final local action</span></div><div class="office-publication-body"><div class="office-warning"><strong>Publication Notice</strong><p>Browser storage is not the deployed database. Export and preserve a merged backup before clearing local changes, changing browsers or moving to another device.</p></div><div class="office-buttons"><button id="exportCommissioner">Export Merged JSON Backup</button><button id="clearCommissioner" class="secondary">Clear Local Draft Changes</button></div><p class="office-help">The exported file combines certified source data with local additions and commissioner overrides. Review that file before it becomes the next canonical deployment source.</p></div></section>
    </div>
  </section>`;
}
function bindCommissionerOffice(){
 const add=(key,value)=>{const s=commissionerStore();(s[key]||(s[key]=[])).push(value);saveCommissionerStore(s);render();};
 document.querySelector("#keeperForm")?.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));add("keepers",{id:`manual_keeper_${Date.now()}`,year:Number(d.year),team:d.team,player:d.player,pos:d.pos,keptRank:Number(d.keptRank)||null,finish:Number(d.finish)||null,ratingOverride:"",notes:d.notes,source:"manual"});});
 const bulkRows=document.querySelector("#bulkGameRows");
 const addBulkRow=(values={})=>{if(!bulkRows)return;const row=document.createElement("article");row.className="bulk-game-row";row.innerHTML=`<label><span>Team A</span><input name="teamA" required value="${esc(values.teamA||"")}" placeholder="Owner or team"></label><label><span>Score A</span><input name="scoreA" type="number" step="0.01" required value="${values.scoreA??""}" placeholder="0.00"></label><div class="bulk-game-vs">VS</div><label><span>Team B</span><input name="teamB" required value="${esc(values.teamB||"")}" placeholder="Owner or team"></label><label><span>Score B</span><input name="scoreB" type="number" step="0.01" required value="${values.scoreB??""}" placeholder="0.00"></label><label><span>Game type</span><select name="gameType"><option value="regular">Regular</option><option value="playoff">Playoff</option><option value="consolation">Consolation</option><option value="championship">Championship</option></select></label><button type="button" class="remove-bulk-game" aria-label="Remove matchup">×</button>`;row.querySelector('[name="gameType"]').value=values.gameType||"regular";row.querySelector(".remove-bulk-game").onclick=()=>{if(bulkRows.children.length>1)row.remove();else row.querySelectorAll("input").forEach(i=>i.value="");};bulkRows.appendChild(row);};
 addBulkRow();
 document.querySelector("#addBulkGame")?.addEventListener("click",()=>addBulkRow());
 document.querySelector("#bulkGameForm")?.addEventListener("submit",e=>{e.preventDefault();const year=Number(document.querySelector("#bulkGameYear")?.value),week=Number(document.querySelector("#bulkGameWeek")?.value),rows=[...document.querySelectorAll(".bulk-game-row")];const games=rows.map((row,index)=>{const type=row.querySelector('[name="gameType"]').value;return{id:`manual_game_${year}_${week}_${Date.now()}_${index}`,year,week,teamA:row.querySelector('[name="teamA"]').value.trim(),scoreA:Number(row.querySelector('[name="scoreA"]').value),teamB:row.querySelector('[name="teamB"]').value.trim(),scoreB:Number(row.querySelector('[name="scoreB"]').value),gameType:type,isPlayoff:type!=="regular",isConsolation:type==="consolation",isChampionship:type==="championship",source:"manual"};}).filter(g=>g.teamA&&g.teamB&&Number.isFinite(g.scoreA)&&Number.isFinite(g.scoreB));if(!games.length)return;const store=commissionerStore();store.games=[...(store.games||[]),...games];saveCommissionerStore(store);render();});
 document.querySelector("#overrideForm")?.addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));add("overrides",{...d,id:`override_${Date.now()}`,createdAt:new Date().toISOString()});});
 document.querySelector("#seasonImport")?.addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;const box=document.querySelector("#importPreview");try{const parsed=JSON.parse(await file.text()),games=Array.isArray(parsed)?parsed:(parsed.games||[]);if(!Array.isArray(games))throw new Error("No games array found");box.className="import-preview";box.innerHTML=`<strong>${games.length} games found.</strong><button id="acceptImport" type="button">Add to Local Draft</button>`;document.querySelector("#acceptImport").onclick=()=>{const s=commissionerStore();s.games=[...(s.games||[]),...games.map(g=>({...g,source:g.source||"import"}))];saveCommissionerStore(s);render();};}catch(err){box.className="empty compact";box.textContent=`Could not read import: ${err.message}`;}});
 document.querySelector("#exportCommissioner")?.addEventListener("click",()=>{const s=commissionerStore();const gameKey=g=>`${Number(g.year)}|${Number(g.week)}|${[String(g.teamA||"").trim().toLowerCase(),String(g.teamB||"").trim().toLowerCase()].sort().join("|")}`;const gameMap=new Map((loserRaw.games||[]).map(g=>[gameKey(g),g]));(s.games||[]).forEach(g=>gameMap.set(gameKey(g),g));const merged={...loserRaw,version:(loserRaw.version||2)+1,savedAt:new Date().toISOString(),games:[...gameMap.values()],keepers:[...loserRaw.keepers,...(s.keepers||[])],championships:[...loserRaw.championships,...(s.championships||[])],sackos:[...loserRaw.sackos,...(s.sackos||[])],commissionerOverrides:s.overrides||[]};const blob=new Blob([JSON.stringify(merged,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`league_of_losers_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);});
 document.querySelector("#clearCommissioner")?.addEventListener("click",()=>{if(confirm("Clear all local draft imports and manual entries?")){localStorage.removeItem("lolCommissionerData");render();}});
}

function gameManagerLink(id,label){return id?managerLink(id,label):esc(label||"Unknown");}
function gameLine(g){return `<article class="game-ledger-row"><div class="game-week">${g.year||g.season} · W${g.week}</div><div class="game-team"><strong>${gameManagerLink(g.teamASiteManagerId,g.teamACanonicalName)}</strong><small>${esc(g.teamASourceName||"")}</small></div><div class="game-score ${g.scoreA>g.scoreB?"winner":""}">${fmt.format(g.scoreA)}</div><div class="game-versus">vs.</div><div class="game-score ${g.scoreB>g.scoreA?"winner":""}">${fmt.format(g.scoreB)}</div><div class="game-team right"><strong>${gameManagerLink(g.teamBSiteManagerId,g.teamBCanonicalName)}</strong><small>${esc(g.teamBSourceName||"")}</small></div>${g.isChampionship?'<span class="game-badge">Championship</span>':g.isConsolation||g.gameType==="consolation"?'<span class="game-badge">Consolation</span>':g.isPlayoff?'<span class="game-badge">Playoff</span>':''}</article>`;}
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

function bindRecordSort(){
  document.querySelectorAll("[data-record-sort]").forEach(btn=>btn.addEventListener("click",()=>{
    const table=btn.closest("table"),body=table?.tBodies?.[0]; if(!body)return;
    const index=Number(btn.dataset.recordSort),text=btn.dataset.type==="text";
    const direction=btn.dataset.direction==="asc"?"desc":"asc";
    table.querySelectorAll("[data-record-sort]").forEach(other=>{if(other!==btn){delete other.dataset.direction;other.closest("th")?.setAttribute("aria-sort","none");const icon=other.querySelector(".record-sort-icon");if(icon)icon.textContent="↕";}});
    btn.dataset.direction=direction;
    btn.closest("th")?.setAttribute("aria-sort",direction==="asc"?"ascending":"descending");
    const activeIcon=btn.querySelector(".record-sort-icon");if(activeIcon)activeIcon.textContent=direction==="asc"?"▲":"▼";
    [...body.rows].sort((a,b)=>{const av=a.cells[index]?.textContent.trim()||"",bv=b.cells[index]?.textContent.trim()||"";const cmp=text?av.localeCompare(bv):((parseFloat(av.replace(/[^0-9+.-]/g,""))||0)-(parseFloat(bv.replace(/[^0-9+.-]/g,""))||0));return direction==="asc"?cmp:-cmp;}).forEach(r=>body.appendChild(r));
  }));
}

function render(preserveScroll=false){applyLeagueTheme();const league=currentLeague();if(state.season!=="all"&&!league.seasons.includes(Number(state.season)))state.season="all";if(state.view==="manager"&&!managerById(state.managerId)){state.view="managers";state.managerId=null;}const title=titleFor(state.view);document.body.classList.toggle("view-overview",state.view==="overview");document.body.classList.toggle("view-manager",state.view==="manager");document.body.classList.toggle("view-managers",state.view==="managers");pageTitle.textContent=title;document.title=`${title} | ${shellCopy().titleSuffix}`;navButtons.forEach(btn=>btn.classList.toggle("active",btn.dataset.view===(state.view==="manager"?"managers":state.view)));seasonSelect.value=String(state.season);localStorage.setItem(`season:${state.leagueId}`,String(state.season));content.innerHTML=({overview,standings,managers,manager:managerFile,history,records,transactions:commissionerOffice,draft:draftCenter,games:gameCenter,awards:awardsCenter,search:searchCenter,office:commissionerOffice}[state.view]||overview)();bindInternalLinks();if(state.view==="standings"){if(currentTheme()==="florida-man"){bindStandingsMode();bindPerformanceSort();}else if(!isAllSeasons())bindPerformanceSort();}if(state.view==="managers"&&currentTheme()==="florida-man")bindOwnerFilters();if(state.view==="draft"&&currentTheme()==="florida-man")bindKeeperFilters();if(state.view==="games"&&currentTheme()==="florida-man")bindGameExplorer();if(state.view==="records"&&currentTheme()==="florida-man")bindRecordSort();if(state.view==="transactions"&&currentTheme()==="florida-man")bindCommissionerOffice();if(state.view==="search")bindSearchCenter();if(state.view==="office")bindCommissionerOffice();if(!preserveScroll){if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)window.scrollTo({top:0,behavior:"smooth"});else window.scrollTo(0,0);}}
function populate(){leagueSelect.innerHTML=Object.values(data).map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join("");if(!data[state.leagueId])state.leagueId=Object.keys(data)[0];leagueSelect.value=state.leagueId;const league=currentLeague();seasonSelect.innerHTML=`<option value="all">All Seasons</option>`+[...league.seasons].reverse().map(y=>`<option value="${y}">${y}</option>`).join("");const remembered=localStorage.getItem(`season:${state.leagueId}`);if(state.season===null||state.season===undefined)state.season=remembered==="all"||league.seasons.includes(Number(remembered))?(remembered==="all"?"all":Number(remembered)):"all";seasonSelect.value=String(state.season);}
leagueSelect.addEventListener("change",e=>{state.leagueId=e.target.value;localStorage.setItem("leagueId",state.leagueId);state.season="all";populate();if(state.view==="manager"&&!managerById(state.managerId))location.hash="managers";else render();});
seasonSelect.addEventListener("change",e=>{state.season=e.target.value==="all"?"all":Number(e.target.value);localStorage.setItem(`season:${state.leagueId}`,String(state.season));render();});
navButtons.forEach(b=>b.addEventListener("click",()=>location.hash=b.dataset.view));
window.addEventListener("hashchange",()=>{parseHash();render();});
document.querySelector("#shareButton").addEventListener("click",async()=>{const b=document.querySelector("#shareButton");try{await navigator.clipboard.writeText(location.href);b.textContent=shellCopy().copied;setTimeout(()=>b.textContent=shellCopy().share,1400);}catch{alert("Copy the address from your browser to share this page.");}});
parseHash();populate();render();
