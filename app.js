const SAVE_KEY = "revmine_save_v2";
const MONETAG_CONFIG_KEY = "revmine_monetag_v1";
const GAME_TICK_MS = 1000;

const baseState = {
  coins: 100,
  miners: [{ level: 1 }, { level: 1 }],
  maxMiners: 10,
  goal: 1_000_000,
  event: "Stable operations",
  message: "Build your mining empire...",
  market: 1,
  durability: 100,
  vault: 0,
  boostCooldown: 0,
  boostActive: false,
  boostTimeLeft: 0,
  supplyCooldown: 0,
  selected: [],
  totalEarned: 100,
  badges: [],
  tier: "Rookie Miner",
  sessionSeconds: 0,
  missionRewardReady: false,
  surgeStreak: 0,
  powerOutageStreak: 0,
  playerName: "You",
  prestigeLevel: 0,
  prestigeMultiplier: 1,
  nearGoalHintAt: 0,
  dailyStreak: 0,
  dailyLastClaimDay: "",
  frenzyTimeLeft: 0,
  frenzyCooldown: 45,
  lastSaveAt: Date.now(),
  upgrades: {
    drill: 0,
    marketAI: 0,
    maintenance: 0,
    supplyChain: 0,
    vaultTech: 0
  },
  mission: {
    type: "earn",
    target: 2000,
    progress: 0,
    reward: 350,
    label: "Earn 2,000 total coins"
  }
};

const state = structuredClone(baseState);

const badgeList = [
  { name: "💰 First 1K", goal: 1_000 },
  { name: "💎 10K Club", goal: 10_000 },
  { name: "🏆 100K Elite", goal: 100_000 },
  { name: "👑 Millionaire", goal: 1_000_000 }
];

const coinEl = document.getElementById("coins");
const incomeEl = document.getElementById("income");
const boostMarkEl = document.getElementById("boostMark");
const marketEl = document.getElementById("market");
const minerCountEl = document.getElementById("minerCount");
const durabilityEl = document.getElementById("durability");
const sessionTimeEl = document.getElementById("sessionTime");
const eventEl = document.getElementById("event");
const tierEl = document.getElementById("tier");
const vaultEl = document.getElementById("vault");
const vaultPerSecEl = document.getElementById("vaultPerSec");
const messageEl = document.getElementById("message");
const metaLineEl = document.getElementById("metaLine");
const badgesEl = document.getElementById("badges");
const progressWrapEl = document.getElementById("progressWrap");
const minersGridEl = document.getElementById("minersGrid");
const depositInputEl = document.getElementById("depositInput");
const boostBtnEl = document.getElementById("boostBtn");
const rewardedBoostBtnEl = document.getElementById("rewardedBoostBtn");
const supplyBtnEl = document.getElementById("supplyBtn");
const rewardedSupplyBtnEl = document.getElementById("rewardedSupplyBtn");
const autoMergeBtnEl = document.getElementById("autoMergeBtn");
const upgradesListEl = document.getElementById("upgradesList");
const missionTextEl = document.getElementById("missionText");
const missionProgressEl = document.getElementById("missionProgress");
const claimMissionBtnEl = document.getElementById("claimMissionBtn");
const saveBtnEl = document.getElementById("saveBtn");
const resetBtnEl = document.getElementById("resetBtn");
const dailyTextEl = document.getElementById("dailyText");
const dailyClaimBtnEl = document.getElementById("dailyClaimBtn");
const prestigeTextEl = document.getElementById("prestigeText");
const prestigeBtnEl = document.getElementById("prestigeBtn");
const goalTextEl = document.getElementById("goalText");
const goalProgressEl = document.getElementById("goalProgress");
const goalRemainingEl = document.getElementById("goalRemaining");
const goalStatusEl = document.getElementById("goalStatus");
const winBannerEl = document.getElementById("winBanner");
const leaderboardListEl = document.getElementById("leaderboardList");
const playerNameInputEl = document.getElementById("playerNameInput");
const saveNameBtnEl = document.getElementById("saveNameBtn");
const editNameBtnEl = document.getElementById("editNameBtn");
const playerNameDisplayEl = document.getElementById("playerNameDisplay");
const nameEditorEl = document.getElementById("nameEditor");
const floatLayerEl = document.getElementById("floatLayer");
const adAdminPinEl = document.getElementById("adAdminPin");
const adUnlockBtnEl = document.getElementById("adUnlockBtn");
const adAdminBoxEl = document.getElementById("adAdminBox");
const adAdminLockEl = document.getElementById("adAdminLock");
const adAdminPanelEl = document.getElementById("adAdminPanel");
const monetagMainZoneInputEl = document.getElementById("monetagMainZoneInput");
const monetagRewardedZoneInputEl = document.getElementById("monetagRewardedZoneInput");
const monetagScriptUrlInputEl = document.getElementById("monetagScriptUrlInput");
const monetagRewardCoinsInputEl = document.getElementById("monetagRewardCoinsInput");
const monetagOwnershipScriptInputEl = document.getElementById("monetagOwnershipScriptInput");
const adSavePlacementBtnEl = document.getElementById("adSavePlacementBtn");
const adPlacementsListEl = document.getElementById("adPlacementsList");
let leaderboardCache = {
  bucket: -1,
  entries: []
};
let isEditingName = false;
let adAdminUnlocked = false;
let adAdminVisible = false;
let monetagConfig = {
  pin: "1234",
  sdkUrl: "https://libtl.com/sdk.js",
  mainZone: "",
  rewardedZone: "",
  rewardedCoins: 400,
  ownershipScript: ""
};
let monetagReady = false;
let rewardedAdCoolingDown = 0;

const vaultRatePerSecond = Math.pow(1.01, 1 / 3600) - 1;
const minerBaseCost = 50;
const repairCost = 100;
const autoMergeCostPerPair = 25;

const upgrades = [
  {
    id: "drill",
    name: "Drill Efficiency",
    description: "+15% miner output per level",
    baseCost: 600,
    costScale: 1.9
  },
  {
    id: "marketAI",
    name: "Market AI",
    description: "Raises market floor by +0.03",
    baseCost: 850,
    costScale: 2.05
  },
  {
    id: "maintenance",
    name: "Maintenance Drones",
    description: "-12% durability decay per level",
    baseCost: 700,
    costScale: 1.95
  },
  {
    id: "supplyChain",
    name: "Supply Chain",
    description: "+12% supply drop reward per level",
    baseCost: 900,
    costScale: 2
  },
  {
    id: "vaultTech",
    name: "Vault Tech",
    description: "+12% vault growth rate per level",
    baseCost: 1000,
    costScale: 2.1
  }
];

function getColorClass(level) {
  if (level === 1) return "lvl1";
  if (level === 2) return "lvl2";
  if (level === 3) return "lvl3";
  if (level === 4) return "lvl4";
  return "lvl5";
}

function getBaseIncome() {
  const drillBonus = 1 + state.upgrades.drill * 0.15;
  return state.miners.reduce((sum, miner) => sum + miner.level * 2 * drillBonus, 0) * state.prestigeMultiplier;
}

function getDisplayedIncome() {
  const frenzyMultiplier = state.frenzyTimeLeft > 0 ? 1.75 : 1;
  return Math.floor(getBaseIncome() * state.market * getEventMultiplier() * (state.boostActive ? 2 : 1) * frenzyMultiplier);
}

function getEventMultiplier() {
  if (state.event.includes("Power outage")) return 0.5;
  if (state.event.includes("Crypto surge")) return 2;
  return 1;
}

function setMessage(text) {
  state.message = text;
}

function sanitizePlayerName(value) {
  const cleaned = value.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
  return cleaned.length ? cleaned.slice(0, 18) : "You";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function clampInt(value, min, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function normalizeNumericState() {
  if (!state.upgrades || typeof state.upgrades !== "object") {
    state.upgrades = { ...baseState.upgrades };
  }
  for (const u of upgrades) {
    state.upgrades[u.id] = clampInt(state.upgrades[u.id], 0, 999);
  }

  if (!Array.isArray(state.miners) || state.miners.length === 0) {
    state.miners = structuredClone(baseState.miners);
  } else {
    state.miners = state.miners.map((m) => ({
      level: clampInt(m && m.level, 1, 99)
    }));
  }

  state.maxMiners = clampInt(state.maxMiners, 1, 10);
  if (state.miners.length > state.maxMiners) {
    state.miners = state.miners.slice(0, state.maxMiners);
  }

  if (!state.mission || typeof state.mission !== "object") {
    state.mission = structuredClone(baseState.mission);
  } else {
    const validTypes = ["earn", "merge", "buy"];
    if (!validTypes.includes(state.mission.type)) state.mission.type = "earn";
    if (typeof state.mission.label !== "string") state.mission.label = "Contract mission";
    state.mission.target = Math.max(1, clampInt(state.mission.target, 1, 1e12));
    state.mission.reward = Math.max(0, clampInt(state.mission.reward, 0, 1e12));
    state.mission.progress = clampInt(state.mission.progress, 0, state.mission.target);
    if (state.mission.progress >= state.mission.target) {
      state.mission.progress = state.mission.target;
      state.missionRewardReady = true;
    }
  }

  state.selected = Array.isArray(state.selected)
    ? state.selected.filter((i) => Number.isInteger(i) && i >= 0 && i < state.miners.length).slice(0, 2)
    : [];

  if (typeof state.playerName !== "string") state.playerName = "You";

  if (!Number.isFinite(state.coins)) state.coins = 0;
  if (!Number.isFinite(state.totalEarned)) state.totalEarned = 0;
  if (!Number.isFinite(state.market)) state.market = 1;
  if (!Number.isFinite(state.durability)) state.durability = 100;
  if (!Number.isFinite(state.vault)) state.vault = 0;
  if (!Number.isFinite(state.boostCooldown)) state.boostCooldown = 0;
  if (!Number.isFinite(state.supplyCooldown)) state.supplyCooldown = 0;
  if (!Number.isFinite(state.boostTimeLeft)) state.boostTimeLeft = 0;
  if (!Number.isFinite(state.goal)) state.goal = baseState.goal;
  if (!Number.isFinite(state.prestigeMultiplier) || state.prestigeMultiplier < 1) state.prestigeMultiplier = 1;
  state.prestigeLevel = clampInt(state.prestigeLevel, 0, 9999);
  state.sessionSeconds = Math.max(0, clampInt(state.sessionSeconds, 0, 1e9));
  state.surgeStreak = clampInt(state.surgeStreak, 0, 999);
  state.powerOutageStreak = clampInt(state.powerOutageStreak, 0, 999);
  state.dailyStreak = clampInt(state.dailyStreak, 0, 9999);
  if (typeof state.dailyLastClaimDay !== "string") state.dailyLastClaimDay = "";
  state.frenzyTimeLeft = clampInt(state.frenzyTimeLeft, 0, 9999);
  state.frenzyCooldown = clampInt(state.frenzyCooldown, 0, 9999);
  state.nearGoalHintAt = Math.max(0, clampInt(state.nearGoalHintAt, 0, 1e9));
  if (!Number.isFinite(state.lastSaveAt)) state.lastSaveAt = Date.now();
}

function getUpgradeCost(upgradeId) {
  const config = upgrades.find((item) => item.id === upgradeId);
  const level = state.upgrades[upgradeId];
  return Math.floor(config.baseCost * config.costScale ** level);
}

function updateTier() {
  if (state.totalEarned >= 500_000) state.tier = "👑 Crypto King";
  else if (state.totalEarned >= 100_000) state.tier = "🏭 Industrial Tycoon";
  else if (state.totalEarned >= 10_000) state.tier = "🚀 Rising Mogul";
  else state.tier = "Rookie Miner";
}

function checkBadges() {
  for (const badge of badgeList) {
    if (state.totalEarned >= badge.goal && !state.badges.includes(badge.name)) {
      state.badges.push(badge.name);
      state.coins += 200;
      setMessage(`🏆 Unlocked: ${badge.name} (+200)`);
    }
  }
}

function renderProgress() {
  progressWrapEl.innerHTML = "";
  for (const badge of badgeList) {
    const progress = Math.min((state.totalEarned / badge.goal) * 100, 100);
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `
      <div class="progress-label">${badge.name} (${progress.toFixed(1)}%)</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
    `;
    progressWrapEl.appendChild(item);
  }
}

function renderBadges() {
  badgesEl.innerHTML = "";
  for (const badge of state.badges) {
    const badgeNode = document.createElement("div");
    badgeNode.className = "badge";
    badgeNode.textContent = badge;
    badgesEl.appendChild(badgeNode);
  }
}

function renderUpgrades() {
  upgradesListEl.innerHTML = "";
  upgrades.forEach((upgrade) => {
    const level = state.upgrades[upgrade.id];
    const cost = getUpgradeCost(upgrade.id);
    const button = document.createElement("button");
    button.textContent = `${upgrade.name} L${level} (${cost.toLocaleString()})`;
    button.disabled = state.coins < cost;
    button.addEventListener("click", () => buyUpgrade(upgrade.id));

    const wrapper = document.createElement("div");
    wrapper.className = "upgrade-item";
    wrapper.innerHTML = `<div class="upgrade-desc">${upgrade.description}</div>`;
    wrapper.appendChild(button);
    upgradesListEl.appendChild(wrapper);
  });
}

function renderMission() {
  const mission = state.mission;
  const percent = Math.min((mission.progress / mission.target) * 100, 100);
  missionTextEl.textContent = `${mission.label} (${Math.floor(mission.progress).toLocaleString()}/${mission.target.toLocaleString()}) • Reward: ${mission.reward.toLocaleString()}`;
  missionProgressEl.style.width = `${percent}%`;
  claimMissionBtnEl.disabled = !state.missionRewardReady;
}

function todayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

function yesterdayKey() {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

function getDailyRewardAmount() {
  return Math.floor(300 + state.dailyStreak * 120 + state.totalEarned * 0.002);
}

function renderDailyAndPrestige() {
  const claimedToday = state.dailyLastClaimDay === todayKey();
  const reward = getDailyRewardAmount();
  dailyTextEl.textContent = claimedToday
    ? `Streak ${state.dailyStreak} • Claimed today`
    : `Streak ${state.dailyStreak} • Next reward ${reward.toLocaleString()} coins`;
  dailyClaimBtnEl.disabled = claimedToday;

  const canPrestige = state.totalEarned >= state.goal;
  prestigeBtnEl.disabled = !canPrestige;
  prestigeTextEl.textContent = canPrestige
    ? `Reset now: Prestige ${state.prestigeLevel + 1} gives permanent +25% income`
    : `Locked until 1,000,000 total earned • Current prestige x${state.prestigeMultiplier.toFixed(2)}`;
}

function renderMillionaireGoal() {
  const current = Math.floor(state.totalEarned);
  const goal = state.goal;
  const remaining = Math.max(0, goal - current);
  const percent = Math.min((current / goal) * 100, 100);
  const achieved = current >= goal;

  goalTextEl.textContent = `${current.toLocaleString()} / ${goal.toLocaleString()}`;
  goalProgressEl.style.width = `${percent}%`;
  goalRemainingEl.textContent = achieved
    ? "Goal complete"
    : `${remaining.toLocaleString()} coins to go`;
  goalStatusEl.textContent = achieved ? "Status: Millionaire / Crypto King" : "Status: Mining...";
  winBannerEl.classList.toggle("hidden", !achieved);
}

function seededValue(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getLeaderboardEntries() {
  const names = [
    "HexMiner99",
    "VaultQueen",
    "CoinDrift",
    "MergeWarden",
    "NovaRig",
    "IronPulse",
    "DrillLord",
    "ZenProspector",
    "TurboTycoon",
    "CryptoDigger"
  ];
  const base = Math.max(1_000, Math.floor(state.totalEarned));
  const refreshBucket = Math.floor(state.sessionSeconds / 12);
  if (leaderboardCache.bucket === refreshBucket && leaderboardCache.entries.length > 0) {
    return leaderboardCache.entries;
  }

  const seed = Math.floor(state.totalEarned / 2000) + refreshBucket;
  const gaps = [-0.06, -0.02, 0.03, 0.08];

  const entries = gaps.map((ratio, idx) => {
    const nameIdx = Math.floor(seededValue(seed + idx * 13) * names.length);
    const variance = 0.97 + seededValue(seed + idx * 29) * 0.06;
    const rivalScore = Math.max(0, Math.floor(base * (1 + ratio) * variance));
    const gap = rivalScore - base;
    return {
      name: names[nameIdx],
      score: rivalScore,
      gap
    };
  });

  entries.push({
    name: state.playerName || "You",
    score: Math.max(0, Math.floor(state.totalEarned)),
    gap: 0,
    isPlayer: true
  });

  leaderboardCache = {
    bucket: refreshBucket,
    entries
  };

  return entries;
}

function renderLeaderboard() {
  const entries = getLeaderboardEntries().sort((a, b) => b.score - a.score);
  leaderboardListEl.innerHTML = "";

  entries.forEach((entry, index) => {
    const row = document.createElement("div");
    const ahead = entry.gap >= 0;
    row.className = `leaderboard-row ${ahead ? "ahead" : "behind"} ${entry.isPlayer ? "player" : ""}`;
    const rank = `#${index + 1}`;
    row.innerHTML = `
      <span>${rank} ${entry.name}</span>
      <span>${entry.score.toLocaleString()}</span>
      <span class="leaderboard-gap">${entry.isPlayer ? "YOU" : `${ahead ? "+" : ""}${entry.gap.toLocaleString()}`}</span>
    `;
    leaderboardListEl.appendChild(row);
  });
  // Avoid clobbering user typing during per-second renders.
  if (document.activeElement !== playerNameInputEl) {
    playerNameInputEl.value = state.playerName;
  }
  playerNameDisplayEl.textContent = state.playerName;
  nameEditorEl.classList.toggle("hidden", !isEditingName);
}

function spawnFloatText(text, anchorEl) {
  const rect = anchorEl ? anchorEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 120, width: 0 };
  const float = document.createElement("div");
  float.className = "float-text";
  float.textContent = text;
  float.style.left = `${rect.left + rect.width / 2}px`;
  float.style.top = `${rect.top - 6}px`;
  floatLayerEl.appendChild(float);
  setTimeout(() => float.remove(), 920);
}

function setPlayerName() {
  const nextName = sanitizePlayerName(playerNameInputEl.value || "");
  state.playerName = nextName;
  isEditingName = false;
  leaderboardCache.bucket = -1;
  saveGame(false);
  setMessage(`Leaderboard name set to ${nextName}`);
  render();
}

function toggleNameEditor() {
  isEditingName = !isEditingName;
  if (isEditingName) {
    playerNameInputEl.value = state.playerName;
    playerNameInputEl.focus();
    playerNameInputEl.select();
  }
  render();
}

function addButtonFeedback(targetButton, clickEvent) {
  if (!targetButton || targetButton.disabled) return;
  targetButton.classList.remove("btn-feedback");
  // Restart animation class for repeated rapid clicks.
  void targetButton.offsetWidth;
  targetButton.classList.add("btn-feedback");
  setTimeout(() => targetButton.classList.remove("btn-feedback"), 180);

  const rect = targetButton.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "btn-ripple";
  ripple.style.left = `${clickEvent.clientX - rect.left}px`;
  ripple.style.top = `${clickEvent.clientY - rect.top}px`;
  targetButton.appendChild(ripple);
  setTimeout(() => ripple.remove(), 420);
}

function renderMiners() {
  minersGridEl.innerHTML = "";
  state.miners.forEach((miner, index) => {
    const btn = document.createElement("button");
    btn.className = `miner ${getColorClass(miner.level)} ${
      state.selected.includes(index) ? "selected" : ""
    }`;
    btn.textContent = String(miner.level);
    btn.addEventListener("click", () => mergeMiners(index));
    minersGridEl.appendChild(btn);
  });
}

function render() {
  normalizeNumericState();
  coinEl.textContent = Math.floor(state.coins).toLocaleString();
  incomeEl.textContent = getDisplayedIncome().toLocaleString();
  boostMarkEl.textContent = state.boostActive ? "🔥" : "";
  marketEl.textContent = state.market.toFixed(2);
  minerCountEl.textContent = String(state.miners.length);
  durabilityEl.textContent = state.durability.toFixed(1);
  sessionTimeEl.textContent = formatTime(state.sessionSeconds);
  eventEl.textContent = state.event;
  tierEl.textContent = state.tier;
  vaultEl.textContent = Math.floor(state.vault).toLocaleString();
  vaultPerSecEl.textContent = (state.vault * getVaultRatePerSecond()).toFixed(3);
  metaLineEl.textContent = `Surge streak: ${state.surgeStreak} | Outage streak: ${state.powerOutageStreak} | Event: ${state.frenzyTimeLeft > 0 ? `Rush ${state.frenzyTimeLeft}s` : `Next rush ${state.frenzyCooldown}s`}`;
  messageEl.textContent = state.message;

  boostBtnEl.textContent = state.boostCooldown > 0 ? `⚡ Boost (${state.boostCooldown}s)` : "⚡ Boost";
  supplyBtnEl.textContent = state.supplyCooldown > 0 ? `🎁 Supply Drop (${state.supplyCooldown}s)` : "🎁 Supply Drop";
  autoMergeBtnEl.textContent = `🤖 Auto Merge (${autoMergeCostPerPair}/pair)`;
  boostBtnEl.disabled = state.boostCooldown > 0;
  supplyBtnEl.disabled = state.supplyCooldown > 0;

  renderProgress();
  renderBadges();
  renderMiners();
  renderUpgrades();
  renderMission();
  renderDailyAndPrestige();
  renderMillionaireGoal();
  renderLeaderboard();
  renderAdAdmin();
}

function loadMonetagConfig() {
  const raw = localStorage.getItem(MONETAG_CONFIG_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    monetagConfig = {
      pin: saved.pin || "1234",
      sdkUrl: saved.sdkUrl || "https://libtl.com/sdk.js",
      mainZone: saved.mainZone || "",
      rewardedZone: saved.rewardedZone || "",
      rewardedCoins: Number(saved.rewardedCoins) > 0 ? Number(saved.rewardedCoins) : 400,
      ownershipScript: saved.ownershipScript || ""
    };
  } catch (error) {
    localStorage.removeItem(MONETAG_CONFIG_KEY);
  }
}

function saveMonetagConfig() {
  localStorage.setItem(MONETAG_CONFIG_KEY, JSON.stringify(monetagConfig));
}

function getMonetagFnName() {
  const zone = monetagConfig.mainZone.trim();
  return zone ? `show_${zone}` : "";
}

function getMonetagShowFn() {
  const fnName = getMonetagFnName();
  const fn = window[fnName];
  if (!fnName || typeof fn !== "function") return null;
  return fn;
}

function showMonetagAd(requestVar) {
  const showFn = getMonetagShowFn();
  if (!showFn) return Promise.reject(new Error("Monetag not ready"));
  const eventId = `${state.playerName}-${Date.now()}-${requestVar}`;
  return showFn({ ymid: eventId, requestVar });
}

function loadMonetagSdk() {
  monetagReady = false;
  const existing = document.querySelector("script[data-monetag-sdk='1']");
  if (existing) existing.remove();

  if (!monetagConfig.mainZone.trim()) return;

  const script = document.createElement("script");
  script.src = monetagConfig.sdkUrl || "https://libtl.com/sdk.js";
  script.async = true;
  script.dataset.zone = monetagConfig.mainZone.trim();
  script.dataset.sdk = getMonetagFnName();
  script.dataset.monetagSdk = "1";
  script.onload = () => {
    monetagReady = typeof window[getMonetagFnName()] === "function";
    render();
  };
  script.onerror = () => {
    monetagReady = false;
    setMessage("Monetag SDK failed to load");
    render();
  };
  document.head.appendChild(script);
}

function applyOwnershipScript() {
  const previousNodes = document.querySelectorAll("[data-monetag-ownership='1']");
  previousNodes.forEach((node) => node.remove());
  // Monetag's verification snippet runs in this document and can block or clear inputs.
  // While the backoffice is open, keep it stripped so you can paste zone IDs and ownership HTML safely.
  if (adAdminVisible) return;
  const html = (monetagConfig.ownershipScript || "").trim();
  if (!html) return;

  const holder = document.createElement("div");
  holder.innerHTML = html;
  [...holder.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    if (node.nodeName.toLowerCase() === "script") {
      const script = document.createElement("script");
      [...node.attributes].forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.textContent = node.textContent;
      script.dataset.monetagOwnership = "1";
      document.head.appendChild(script);
      return;
    }
    const wrap = document.createElement("div");
    wrap.dataset.monetagOwnership = "1";
    wrap.appendChild(node.cloneNode(true));
    document.head.appendChild(wrap);
  });
}

/** Do not call from render() every tick — it would wipe pasted text before Save. */
function syncMonetagFormFromConfig() {
  monetagMainZoneInputEl.value = monetagConfig.mainZone;
  monetagRewardedZoneInputEl.value = monetagConfig.rewardedZone;
  monetagScriptUrlInputEl.value = monetagConfig.sdkUrl;
  monetagRewardCoinsInputEl.value = String(monetagConfig.rewardedCoins);
  monetagOwnershipScriptInputEl.value = monetagConfig.ownershipScript || "";
}

function renderAdAdmin() {
  adAdminBoxEl.classList.toggle("hidden", !adAdminVisible);

  const adNotReady = !monetagConfig.mainZone.trim() || !monetagReady || rewardedAdCoolingDown > 0;
  rewardedBoostBtnEl.disabled = adNotReady || state.boostCooldown > 0;
  rewardedSupplyBtnEl.disabled = adNotReady || state.supplyCooldown > 0;
  rewardedBoostBtnEl.textContent =
    state.boostCooldown > 0
      ? `🎬 Watch Ad for Boost (Boost ${state.boostCooldown}s)`
      : rewardedAdCoolingDown > 0
        ? `🎬 Watch ad: Super Boost (${rewardedAdCoolingDown}s)`
        : "🎬 Watch ad: Super Boost (60s)";
  rewardedSupplyBtnEl.textContent =
    state.supplyCooldown > 0
      ? `🎬 Watch Ad for Supply Drop (Supply ${state.supplyCooldown}s)`
      : rewardedAdCoolingDown > 0
        ? `🎬 Watch ad: Mega Supply (${rewardedAdCoolingDown}s)`
        : "🎬 Watch ad: Mega Supply (300-900)";

  if (!adAdminVisible) return;

  adAdminLockEl.classList.toggle("hidden", adAdminUnlocked);
  adAdminPanelEl.classList.toggle("hidden", !adAdminUnlocked);
  adPlacementsListEl.innerHTML = "";

  if (!adAdminUnlocked) return;

  const status = document.createElement("div");
  status.className = "ad-placement-row";
  status.innerHTML = `
    <div class="ad-placement-meta">
      Main Zone: <strong>${monetagConfig.mainZone || "(not set)"}</strong><br />
      Rewarded Zone: <strong>${monetagConfig.rewardedZone || "(optional)"}</strong><br />
      Ownership Script: <strong>${monetagConfig.ownershipScript ? "Configured" : "Not set"}</strong><br />
      SDK: <strong>${monetagReady ? "Loaded" : "Not Ready"}</strong>
    </div>
  `;
  adPlacementsListEl.appendChild(status);
}

function unlockAdAdmin() {
  if (adAdminPinEl.value !== monetagConfig.pin) {
    setMessage("Invalid admin PIN");
    render();
    return;
  }
  adAdminUnlocked = true;
  syncMonetagFormFromConfig();
  setMessage("Monetag backoffice unlocked");
  render();
}

function toggleAdAdminVisibility() {
  adAdminVisible = !adAdminVisible;
  if (adAdminVisible) {
    setMessage("Monetag backoffice opened");
    if (adAdminUnlocked) syncMonetagFormFromConfig();
    setTimeout(() => adAdminPinEl.focus(), 0);
  } else {
    setMessage("Monetag backoffice hidden");
  }
  applyOwnershipScript();
  render();
}

function saveAdPlacement() {
  const mainZone = monetagMainZoneInputEl.value.trim();
  const rewardedZone = monetagRewardedZoneInputEl.value.trim();
  const sdkUrl = monetagScriptUrlInputEl.value.trim() || "https://libtl.com/sdk.js";
  const rewardCoins = Number(monetagRewardCoinsInputEl.value || 400);
  const ownershipScript = monetagOwnershipScriptInputEl.value || "";

  monetagConfig.mainZone = mainZone;
  monetagConfig.rewardedZone = rewardedZone;
  monetagConfig.sdkUrl = sdkUrl;
  monetagConfig.rewardedCoins = Number.isFinite(rewardCoins) && rewardCoins > 0 ? rewardCoins : 400;
  monetagConfig.ownershipScript = ownershipScript;
  saveMonetagConfig();
  applyOwnershipScript();
  loadMonetagSdk();
  syncMonetagFormFromConfig();
  if (!mainZone) {
    setMessage(
      "Draft saved (no Main Zone yet). Monetag often shows the zone ID only after site approval — add it here when ready, save again, then reload the game page. Rewarded ads stay off until Main Zone + SDK load."
    );
  } else {
    setMessage("Monetag config saved");
  }
  render();
}

function triggerRewardedBoostAd() {
  if (state.boostCooldown > 0) {
    setMessage(`Boost in ${state.boostCooldown}s`);
    render();
    return;
  }
  if (rewardedAdCoolingDown > 0) {
    setMessage(`Ad ready in ${rewardedAdCoolingDown}s`);
    render();
    return;
  }
  if (!getMonetagShowFn()) {
    setMessage("Monetag not ready. Configure zone and reload SDK.");
    render();
    return;
  }

  showMonetagAd("revmine_rewarded_boost")
    .then(() => {
      rewardedAdCoolingDown = 45;
      boost(60, 30, "⚡ Ad super boost for 60s");
      spawnFloatText("Boost Activated", rewardedBoostBtnEl);
    })
    .catch(() => {
      setMessage("Ad unavailable right now. Try again shortly.");
      render();
    });
}

function triggerRewardedSupplyAd() {
  if (state.supplyCooldown > 0) {
    setMessage(`Supply in ${state.supplyCooldown}s`);
    render();
    return;
  }
  if (rewardedAdCoolingDown > 0) {
    setMessage(`Ad ready in ${rewardedAdCoolingDown}s`);
    render();
    return;
  }
  if (!getMonetagShowFn()) {
    setMessage("Monetag not ready. Configure zone and reload SDK.");
    render();
    return;
  }

  showMonetagAd("revmine_rewarded_supply")
    .then(() => {
      rewardedAdCoolingDown = 45;
      supplyDrop(300, 900, "🎁 Ad supply drop");
      spawnFloatText("Supply Delivered", rewardedSupplyBtnEl);
    })
    .catch(() => {
      setMessage("Ad unavailable right now. Try again shortly.");
      render();
    });
}

function addMiner() {
  if (state.miners.length >= state.maxMiners) {
    setMessage("Max 10 miners");
    render();
    return;
  }

  const cost = minerBaseCost;
  if (state.coins < cost) {
    setMessage("Not enough coins");
    render();
    return;
  }

  state.coins -= cost;
  const chance = Math.random();
  let level = 1;
  if (chance > 0.98) level = 3;
  else if (chance > 0.9) level = 2;

  state.miners.push({ level });
  updateMission(0, 0);
  setMessage(level > 1 ? `✨ Rare level ${level}` : "⛏️ New miner");
  render();
}

function mergeMiners(index) {
  // Prevent selecting the same miner twice for a merge.
  if (state.selected.length === 1 && state.selected[0] === index) {
    state.selected = [];
    setMessage("Select a different miner");
    render();
    return;
  }

  let nextSelection = [...state.selected, index];
  if (nextSelection.length > 2) nextSelection = [index];
  state.selected = nextSelection;

  if (nextSelection.length === 2) {
    const [firstIdx, secondIdx] = nextSelection;
    const first = state.miners[firstIdx];
    const second = state.miners[secondIdx];

    if (first.level !== second.level) {
      state.selected = [];
      setMessage("Must be same level");
      render();
      return;
    }

    state.miners = state.miners.filter((_, idx) => idx !== firstIdx && idx !== secondIdx);
    state.miners.push({ level: first.level + 1 });
    state.selected = [];
    updateMission(0, 1);
    setMessage(`🔥 Merged to level ${first.level + 1}`);
    spawnFloatText(`Merge L${first.level + 1}!`, minersGridEl);
  }

  render();
}

function autoMerge() {
  let mergeCount = 0;
  state.selected = [];

  // Strict pair rule: every merge consumes exactly 2 miners of same level.
  const levelCounts = new Map();
  state.miners.forEach((miner) => {
    levelCounts.set(miner.level, (levelCounts.get(miner.level) || 0) + 1);
  });

  const maxLevel = Math.max(1, ...state.miners.map((miner) => miner.level));
  for (let level = 1; level <= maxLevel + 12; level += 1) {
    const count = levelCounts.get(level) || 0;
    const pairs = Math.floor(count / 2);
    const remainder = count % 2;
    if (pairs > 0) {
      mergeCount += pairs;
      levelCounts.set(level + 1, (levelCounts.get(level + 1) || 0) + pairs);
    }
    levelCounts.set(level, remainder);
  }

  if (mergeCount === 0) {
    setMessage("No matching miners to auto-merge");
    render();
    return;
  }

  const totalCost = mergeCount * autoMergeCostPerPair;
  if (state.coins < totalCost) {
    setMessage(`Need ${totalCost} coins for auto-merge`);
    render();
    return;
  }

  state.coins -= totalCost;

  state.miners = [];
  [...levelCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, count]) => {
      for (let i = 0; i < count; i += 1) {
        state.miners.push({ level });
      }
    });

  updateMission(0, mergeCount);
  setMessage(
    `🤖 Auto-merged ${mergeCount} pair${mergeCount > 1 ? "s" : ""} for ${totalCost} coins`
  );

  render();
}

function buyUpgrade(upgradeId) {
  const cost = getUpgradeCost(upgradeId);
  if (state.coins < cost) {
    setMessage("Not enough coins for research");
    render();
    return;
  }
  state.coins -= cost;
  state.upgrades[upgradeId] += 1;
  setMessage(`🧪 Upgraded ${upgrades.find((item) => item.id === upgradeId).name}`);
  render();
}

function depositVault() {
  const amount = Number(depositInputEl.value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > state.coins) {
    setMessage("Invalid amount");
    render();
    return;
  }

  state.coins -= amount;
  state.vault += amount;
  depositInputEl.value = "";
  setMessage(`🏦 Deposited ${Math.floor(amount)}`);
  render();
}

function withdrawVault() {
  const amount = Math.floor(state.vault);
  if (amount <= 0) {
    setMessage("Vault empty");
    render();
    return;
  }

  state.vault = 0;
  state.coins += amount;
  setMessage(`💰 Withdrew ${amount}`);
  render();
}

function boost(durationSeconds = 30, cooldownSeconds = 30, messageText = "") {
  if (!Number.isFinite(durationSeconds)) durationSeconds = 30;
  if (!Number.isFinite(cooldownSeconds)) cooldownSeconds = 30;
  durationSeconds = Math.max(1, Math.floor(durationSeconds));
  cooldownSeconds = Math.max(0, Math.floor(cooldownSeconds));
  if (typeof messageText !== "string") messageText = "";
  if (state.boostCooldown > 0) {
    setMessage(`Boost in ${state.boostCooldown}s`);
    render();
    return;
  }

  state.boostActive = true;
  state.boostTimeLeft = durationSeconds;
  state.boostCooldown = cooldownSeconds;
  setMessage(messageText || `⚡ 2x boost for ${durationSeconds}s`);
  render();
}

function supplyDrop(minReward = 100, maxReward = 400, sourceLabel = "") {
  if (!Number.isFinite(minReward)) minReward = 100;
  if (!Number.isFinite(maxReward)) maxReward = 400;
  const lo = Math.min(minReward, maxReward);
  const hi = Math.max(minReward, maxReward);
  const label = typeof sourceLabel === "string" ? sourceLabel : "";
  if (state.supplyCooldown > 0) {
    setMessage(`Supply in ${state.supplyCooldown}s`);
    render();
    return;
  }

  const supplyLevel = clampInt(state.upgrades.supplyChain, 0, 999);
  const supplyBonus = 1 + supplyLevel * 0.12;
  const spread = Math.max(1, hi - lo + 1);
  const reward = Math.floor((Math.random() * spread + lo) * supplyBonus);
  state.coins += reward;
  state.totalEarned += reward;
  state.supplyCooldown = 60;
  updateMission(reward, 0);
  checkBadges();
  updateTier();
  setMessage(label ? `${label}: +${reward} coins` : `🎁 +${reward} coins`);
  render();
}

function repairRig() {
  if (state.coins < repairCost) {
    setMessage("Need 100 coins to repair");
    render();
    return;
  }

  state.coins -= repairCost;
  state.durability = Math.min(100, state.durability + 20);
  setMessage("🔧 Repaired +20 durability");
  render();
}

function getDurabilityDecay() {
  const reduction = Math.min(0.75, state.upgrades.maintenance * 0.12);
  return 0.3 * (1 - reduction);
}

function getVaultRatePerSecond() {
  return vaultRatePerSecond * (1 + state.upgrades.vaultTech * 0.12);
}

function updateMission(deltaCoinsEarned, mergedPairs) {
  if (state.missionRewardReady) return;

  if (state.mission.type === "earn") {
    state.mission.progress += deltaCoinsEarned;
  } else if (state.mission.type === "merge") {
    state.mission.progress += mergedPairs;
  } else if (state.mission.type === "buy") {
    state.mission.progress = state.miners.length;
  }

  if (state.mission.progress >= state.mission.target) {
    state.missionRewardReady = true;
    setMessage("✅ Mission complete - claim reward");
  }
}

function rollNewMission() {
  const missionPool = [
    {
      type: "earn",
      target: 4000 + Math.floor(state.totalEarned * 0.01),
      reward: 600 + Math.floor(state.totalEarned * 0.004),
      label: "Earn coins from mining"
    },
    {
      type: "merge",
      target: 5,
      reward: 900 + Math.floor(state.totalEarned * 0.003),
      label: "Complete merges"
    },
    {
      type: "buy",
      target: Math.min(10, 4 + Math.floor(state.totalEarned / 25000)),
      reward: 700 + Math.floor(state.totalEarned * 0.0035),
      label: "Reach miner count"
    }
  ];
  const selected = missionPool[Math.floor(Math.random() * missionPool.length)];
  state.mission = { ...selected, progress: 0 };
  state.missionRewardReady = false;
}

function claimMissionReward() {
  if (!state.missionRewardReady) return;
  state.coins += state.mission.reward;
  state.totalEarned += state.mission.reward;
  setMessage(`📦 Mission reward: +${Math.floor(state.mission.reward).toLocaleString()} coins`);
  rollNewMission();
  checkBadges();
  updateTier();
  render();
}

function claimDailyReward() {
  const today = todayKey();
  if (state.dailyLastClaimDay === today) {
    setMessage("Daily reward already claimed");
    render();
    return;
  }

  const wasYesterday = state.dailyLastClaimDay === yesterdayKey();
  state.dailyStreak = wasYesterday ? state.dailyStreak + 1 : 1;
  const reward = getDailyRewardAmount();
  state.dailyLastClaimDay = today;
  state.coins += reward;
  state.totalEarned += reward;
  setMessage(`📅 Daily streak ${state.dailyStreak}: +${reward.toLocaleString()} coins`);
  spawnFloatText(`+${reward.toLocaleString()}`, dailyClaimBtnEl);
  checkBadges();
  updateTier();
  render();
}

function prestigeReset() {
  if (state.totalEarned < state.goal) {
    setMessage("Prestige locked until 1,000,000 total earned");
    render();
    return;
  }

  const keepName = state.playerName;
  const keepDailyStreak = state.dailyStreak;
  const keepDailyLastClaimDay = state.dailyLastClaimDay;
  const keepPrestigeLevel = state.prestigeLevel + 1;
  const keepPrestigeMultiplier = 1 + keepPrestigeLevel * 0.25;

  Object.assign(state, structuredClone(baseState));
  state.playerName = keepName;
  state.dailyStreak = keepDailyStreak;
  state.dailyLastClaimDay = keepDailyLastClaimDay;
  state.prestigeLevel = keepPrestigeLevel;
  state.prestigeMultiplier = keepPrestigeMultiplier;
  state.message = `🌟 Prestige ${state.prestigeLevel} activated (x${state.prestigeMultiplier.toFixed(2)} income)`;
  leaderboardCache.bucket = -1;
  saveGame(false);
  render();
}

function saveGame(showToast = false) {
  state.lastSaveAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showToast) {
    setMessage("💾 Progress saved");
    render();
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    Object.assign(state, baseState, saved);
    state.upgrades = { ...baseState.upgrades, ...(saved.upgrades || {}) };
    state.mission = { ...baseState.mission, ...(saved.mission || {}) };
    normalizeNumericState();
    applyOfflineProgress();
  } catch (error) {
    localStorage.removeItem(SAVE_KEY);
  }
}

function applyOfflineProgress() {
  const now = Date.now();
  const elapsedSeconds = Math.min(8 * 3600, Math.max(0, Math.floor((now - state.lastSaveAt) / 1000)));
  if (elapsedSeconds <= 0) return;

  const avgMarket = Math.max(0.8, state.market);
  const avgIncomePerSec = Math.floor(getBaseIncome() * avgMarket);
  const mined = avgIncomePerSec * elapsedSeconds;
  const vaultGain = state.vault * Math.pow(1 + getVaultRatePerSecond(), elapsedSeconds) - state.vault;

  state.coins += mined;
  state.totalEarned += mined;
  state.vault += vaultGain;
  state.sessionSeconds = 0;
  setMessage(`Welcome back! Offline gain: +${Math.floor(mined + vaultGain).toLocaleString()}`);
}

function hardReset() {
  localStorage.removeItem(SAVE_KEY);
  Object.assign(state, structuredClone(baseState));
  leaderboardCache.bucket = -1;
  isEditingName = false;
  setMessage("Game reset complete");
  render();
}

function tickGame() {
  let modifier = state.market;
  const chance = Math.random();

  if (chance < 0.05) {
    modifier *= 0.5;
    state.event = "⚠️ Power outage!";
    state.powerOutageStreak += 1;
    state.surgeStreak = 0;
  } else if (chance > 0.95) {
    modifier *= 2;
    state.event = "🔥 Crypto surge!";
    state.surgeStreak += 1;
    state.powerOutageStreak = 0;
  } else {
    state.event = "Stable operations";
    state.surgeStreak = 0;
    state.powerOutageStreak = 0;
  }

  const marketFloor = Math.min(1.4, 0.5 + state.upgrades.marketAI * 0.03);
  state.durability = Math.max(0, state.durability - getDurabilityDecay());
  if (state.durability <= 0) {
    state.event = "🛑 Mining halted (durability 0)";
  }

  let gain = 0;
  if (state.durability > 0) {
    const boostMultiplier = state.boostActive ? 2 : 1;
    const streakBonus = 1 + Math.min(0.6, state.surgeStreak * 0.08);
    const frenzyMultiplier = state.frenzyTimeLeft > 0 ? 1.75 : 1;
    gain = Math.floor(getBaseIncome() * modifier * boostMultiplier * streakBonus * frenzyMultiplier);
    state.coins += gain;
    state.totalEarned += gain;
  }

  state.market = Math.max(marketFloor, Math.min(2, state.market + (Math.random() - 0.5) * 0.2));
  state.vault += state.vault * getVaultRatePerSecond();
  state.sessionSeconds += 1;

  if (state.boostCooldown > 0) state.boostCooldown -= 1;
  if (state.supplyCooldown > 0) state.supplyCooldown -= 1;
  if (rewardedAdCoolingDown > 0) rewardedAdCoolingDown -= 1;

  if (state.boostActive) {
    state.boostTimeLeft -= 1;
    if (state.boostTimeLeft <= 0) {
      state.boostActive = false;
      setMessage("Boost ended");
    }
  }

  if (state.frenzyTimeLeft > 0) {
    state.frenzyTimeLeft -= 1;
    if (state.frenzyTimeLeft === 0) {
      setMessage("Market rush ended");
      state.frenzyCooldown = 55;
    }
  } else {
    state.frenzyCooldown -= 1;
    if (state.frenzyCooldown <= 0) {
      state.frenzyTimeLeft = 10;
      state.frenzyCooldown = 55;
      setMessage("⚡ Limited Event: Market Rush x1.75 for 10s");
    }
  }

  updateMission(gain, 0);
  checkBadges();
  updateTier();
  if (state.totalEarned >= state.goal) {
    setMessage("👑 Millionaire status achieved! You are the Crypto King.");
  }

  const remaining = state.goal - state.totalEarned;
  if (remaining > 0 && remaining <= 100_000 && state.sessionSeconds - state.nearGoalHintAt >= 20) {
    state.nearGoalHintAt = state.sessionSeconds;
    setMessage(`🚀 So close! ${Math.floor(remaining).toLocaleString()} coins to millionaire`);
  }

  if (state.sessionSeconds % 15 === 0) {
    saveGame(false);
  }

  render();
}

document.getElementById("buyMiner").addEventListener("click", addMiner);
document.getElementById("repair").addEventListener("click", repairRig);
document.getElementById("depositBtn").addEventListener("click", depositVault);
document.getElementById("withdrawBtn").addEventListener("click", withdrawVault);
boostBtnEl.addEventListener("click", () => boost());
supplyBtnEl.addEventListener("click", () => supplyDrop());
autoMergeBtnEl.addEventListener("click", autoMerge);
claimMissionBtnEl.addEventListener("click", claimMissionReward);
saveBtnEl.addEventListener("click", () => saveGame(true));
resetBtnEl.addEventListener("click", hardReset);
dailyClaimBtnEl.addEventListener("click", claimDailyReward);
prestigeBtnEl.addEventListener("click", prestigeReset);
saveNameBtnEl.addEventListener("click", setPlayerName);
editNameBtnEl.addEventListener("click", toggleNameEditor);
adUnlockBtnEl.addEventListener("click", unlockAdAdmin);
adSavePlacementBtnEl.addEventListener("click", saveAdPlacement);
rewardedBoostBtnEl.addEventListener("click", triggerRewardedBoostAd);
rewardedSupplyBtnEl.addEventListener("click", triggerRewardedSupplyAd);
playerNameInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setPlayerName();
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  addButtonFeedback(button, event);
});

function isBackofficeToggleShortcut(event) {
  const key = (event.key || "").toLowerCase();
  const primary = event.ctrlKey || event.metaKey;
  return primary && event.shiftKey && (key === "x" || event.code === "KeyX");
}

function onGlobalKeydown(event) {
  const key = (event.key || "").toLowerCase();
  if (isBackofficeToggleShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    toggleAdAdminVisibility();
    return;
  }
  if (key === "escape" && adAdminVisible) {
    event.preventDefault();
    adAdminVisible = false;
    setMessage("Monetag backoffice hidden");
    render();
  }
}

document.addEventListener("keydown", onGlobalKeydown, true);

// Keyboard shortcut is easy to miss (browser/extensions). Triple-click the title toggles the same panel.
const gameTitleEl = document.getElementById("gameTitle");
let gameTitleClickCount = 0;
let gameTitleClickTimer = null;
if (gameTitleEl) {
  gameTitleEl.addEventListener("click", () => {
    gameTitleClickCount += 1;
    clearTimeout(gameTitleClickTimer);
    gameTitleClickTimer = setTimeout(() => {
      gameTitleClickCount = 0;
    }, 700);
    if (gameTitleClickCount >= 3) {
      gameTitleClickCount = 0;
      clearTimeout(gameTitleClickTimer);
      toggleAdAdminVisibility();
    }
  });
}

loadMonetagConfig();
syncMonetagFormFromConfig();
applyOwnershipScript();
loadMonetagSdk();
loadGame();
setInterval(tickGame, 1000);
render();
