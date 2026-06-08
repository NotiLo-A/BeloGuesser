const SK = {
  nick: "bg_nick",
  games: "bg_games",
  wins: "bg_wins",
  time: "bg_time",
  rounds: "bg_rounds",
  theme: "bg_theme",
};

function ls(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, String(val));
  } catch {}
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2000);
}

function updateWinRate() {
  const g = parseInt(ls(SK.games, "0")) || 0;
  const w = parseInt(ls(SK.wins, "0")) || 0;
  const el = document.getElementById("win-rate");
  el.innerHTML = g ? `Winrate <span>${Math.round((w / g) * 100)}%</span>` : "";
}

const html = document.documentElement;
const themeBtn = document.getElementById("theme-btn");

function applyTheme(t) {
  if (t === "dark") html.setAttribute("data-theme", "dark");
  else html.removeAttribute("data-theme");
}

applyTheme(ls(SK.theme, "light"));

themeBtn.addEventListener("click", () => {
  const isDark = html.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  lsSet(SK.theme, next);
});

const nickInput = document.getElementById("nick-input");
const saveBtn = document.getElementById("nick-save");
let savedNick = ls(SK.nick, "");

nickInput.value = savedNick;
document.getElementById("stat-games").textContent = ls(SK.games, "0");
document.getElementById("stat-wins").textContent = ls(SK.wins, "0");
updateWinRate();

nickInput.addEventListener("input", () => {
  saveBtn.classList.toggle("visible", nickInput.value !== savedNick);
});
nickInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
  if (e.key === "Escape") {
    nickInput.value = savedNick;
    saveBtn.classList.remove("visible");
    nickInput.blur();
  }
});
saveBtn.addEventListener("click", () => {
  const nick = nickInput.value.trim();
  if (!nick) {
    showToast("Enter a nickname first");
    return;
  }
  lsSet(SK.nick, nick);
  savedNick = nick;
  saveBtn.classList.remove("visible");
  showToast("Nickname saved");
});

const TIME_OPTIONS = [30, 60, 90, 120, 180, 300];
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let timeIdx = Math.max(0, TIME_OPTIONS.indexOf(parseInt(ls(SK.time, "60"))));
let roundIdx = Math.max(0, ROUND_OPTIONS.indexOf(parseInt(ls(SK.rounds, "5"))));

if (timeIdx < 0) timeIdx = 1;
if (roundIdx < 0) roundIdx = 4;

function renderTime() {
  document.getElementById("val-time").textContent = TIME_OPTIONS[timeIdx] + "s";
}
function renderRounds() {
  document.getElementById("val-rounds").textContent = ROUND_OPTIONS[roundIdx];
}
renderTime();
renderRounds();

document.getElementById("stepper-time").addEventListener("click", (e) => {
  const btn = e.target.closest(".stepper-btn");
  if (!btn) return;
  timeIdx = Math.min(
    Math.max(timeIdx + parseInt(btn.dataset.dir), 0),
    TIME_OPTIONS.length - 1,
  );
  lsSet(SK.time, TIME_OPTIONS[timeIdx]);
  renderTime();
});
document.getElementById("stepper-rounds").addEventListener("click", (e) => {
  const btn = e.target.closest(".stepper-btn");
  if (!btn) return;
  roundIdx = Math.min(
    Math.max(roundIdx + parseInt(btn.dataset.dir), 0),
    ROUND_OPTIONS.length - 1,
  );
  lsSet(SK.rounds, ROUND_OPTIONS[roundIdx]);
  renderRounds();
});

document.getElementById("btn-solo").addEventListener("click", () => {
  localStorage.removeItem("gameStartLat");
  localStorage.removeItem("gameStartLon");
  window.location.href = "game.html";
});
document
  .getElementById("btn-create")
  .addEventListener("click", () => showToast("Coming soon"));
document
  .getElementById("btn-join")
  .addEventListener("click", () => showToast("Coming soon"));
document.getElementById("room-code").addEventListener("keydown", (e) => {
  if (e.key === "Enter") showToast("Coming soon");
});
document.getElementById("room-code").addEventListener("input", function () {
  const p = this.selectionStart;
  this.value = this.value.toUpperCase();
  this.setSelectionRange(p, p);
});
