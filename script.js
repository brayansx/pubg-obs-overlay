const API_URL = 'https://api.pubg.com/shards/steam';
const REFRESH_INTERVAL = 60000; // 60s


const liveKey = 'pubg_live_start';
let liveStart = localStorage.getItem(liveKey);


if (new URLSearchParams(window.location.search).get('reset') === 'true' || !liveStart) {
liveStart = Date.now();
localStorage.setItem(liveKey, liveStart);
}


const state = {
games: 0,
kills: 0,
damage: 0,
wins: 0,
processedMatches: new Set()
};


async function fetchPlayer() {
const res = await fetch(`${API_URL}/players?filter[playerNames]=${PUBG_CONFIG.PLAYER_NAME}`, {
headers: {
'Authorization': `Bearer ${PUBG_CONFIG.API_KEY}`,
'Accept': 'application/vnd.api+json'
}
});
const data = await res.json();
return data.data[0];
}


async function fetchMatch(id) {
const res = await fetch(`${API_URL}/matches/${id}`, {
headers: {
'Authorization': `Bearer ${PUBG_CONFIG.API_KEY}`,
'Accept': 'application/vnd.api+json'
}
});
return await res.json();
}


function updateUI() {
document.getElementById('games').innerText = state.games;
document.getElementById('kills').innerText = state.kills;
document.getElementById('avgKills').innerText = state.games ? (state.kills / state.games).toFixed(2) : 0;
document.getElementById('avgDmg').innerText = state.games ? (state.damage / state.games).toFixed(1) : 0;
document.getElementById('wins').innerText = state.wins;
}


async function updateStats() {
const player = await fetchPlayer();
const matches = player.relationships.matches.data;


for (const matchRef of matches) {
if (state.processedMatches.has(matchRef.id)) continue;


const match = await fetchMatch(matchRef.id);
const createdAt = new Date(match.data.attributes.createdAt).getTime();
if (createdAt < liveStart) continue;


const participant = match.included.find(i => i.type === 'participant' && i.attributes.stats.playerName === PUBG_CONFIG.PLAYER_NAME);
if (!participant) continue;


const stats = participant.attributes.stats;


state.games++;
state.kills += stats.kills;
state.damage += stats.damageDealt;
if (stats.winPlace === 1) state.wins++;


state.processedMatches.add(matchRef.id);
}


updateUI();
}


updateStats();
setInterval(updateStats, REFRESH_INTERVAL);
