const MONETAG_CONFIG_KEY = "revmine_monetag_v1";
const DEFAULT_MONETAG_SDK_URL = "https://libtl.com/sdk.js";

const pinInput = document.getElementById("setupPin");
const unlockBtn = document.getElementById("setupUnlockBtn");
const lockBlock = document.getElementById("setupLock");
const formBlock = document.getElementById("setupForm");
const mainEl = document.getElementById("setupMainZone");
const rewardedEl = document.getElementById("setupRewardedZone");
const sdkEl = document.getElementById("setupSdkUrl");
const coinsEl = document.getElementById("setupRewardCoins");
const ownershipEl = document.getElementById("setupOwnership");
const saveBtn = document.getElementById("setupSaveBtn");
const statusEl = document.getElementById("setupStatus");

let config = {
  pin: "1234",
  sdkUrl: DEFAULT_MONETAG_SDK_URL,
  mainZone: "",
  rewardedZone: "",
  rewardedCoins: 400,
  ownershipScript: ""
};

let unlocked = false;

function loadConfig() {
  const raw = localStorage.getItem(MONETAG_CONFIG_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    config = {
      pin: saved.pin || "1234",
      sdkUrl: saved.sdkUrl || DEFAULT_MONETAG_SDK_URL,
      mainZone: saved.mainZone || "",
      rewardedZone: saved.rewardedZone || "",
      rewardedCoins: Number(saved.rewardedCoins) > 0 ? Number(saved.rewardedCoins) : 400,
      ownershipScript: saved.ownershipScript || ""
    };
  } catch {
    localStorage.removeItem(MONETAG_CONFIG_KEY);
  }
}

function syncForm() {
  mainEl.value = config.mainZone;
  rewardedEl.value = config.rewardedZone;
  sdkEl.value = config.sdkUrl;
  coinsEl.value = String(config.rewardedCoins);
  ownershipEl.value = config.ownershipScript;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function normalizeMonetagSdkUrlInput(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: true, url: DEFAULT_MONETAG_SDK_URL };

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message:
        "Invalid SDK URL. Use Monetag’s .js file URL, or leave blank for the default. Do not use your GitHub Pages game link here."
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "SDK URL must start with https:// (or http://)." };
  }

  const host = parsed.hostname.toLowerCase();
  const pathPlus = `${parsed.pathname}${parsed.search}`.toLowerCase();
  const looksLikeGithubPagesOrRepo =
    host.endsWith("github.io") || host === "github.com" || host.endsWith(".github.com");
  if (looksLikeGithubPagesOrRepo && !/\.js(\?|#|$)/i.test(pathPlus)) {
    return {
      ok: false,
      message:
        "That looks like your GitHub site/repo URL, not Monetag’s SDK. Clear the SDK field for the default. Put your game’s https://….github.io/… URL only in Monetag’s dashboard site settings."
    };
  }

  return { ok: true, url: trimmed };
}

function applyUi() {
  lockBlock.classList.toggle("hidden", unlocked);
  formBlock.classList.toggle("hidden", !unlocked);
}

unlockBtn.addEventListener("click", () => {
  if (pinInput.value !== config.pin) {
    setStatus("Wrong PIN.");
    return;
  }
  unlocked = true;
  syncForm();
  setStatus("Unlocked. Nothing is injected on this page — safe to paste. Close RevMine backoffice tab if it is open.");
  applyUi();
});

saveBtn.addEventListener("click", () => {
  if (!unlocked) {
    setStatus("Unlock with PIN first.");
    return;
  }
  const sdkNorm = normalizeMonetagSdkUrlInput(sdkEl.value);
  if (!sdkNorm.ok) {
    setStatus(sdkNorm.message);
    return;
  }
  const rewardCoins = Number(coinsEl.value || 400);
  config.mainZone = mainEl.value.trim();
  config.rewardedZone = rewardedEl.value.trim();
  config.sdkUrl = sdkNorm.url;
  config.rewardedCoins = Number.isFinite(rewardCoins) && rewardCoins > 0 ? rewardCoins : 400;
  config.ownershipScript = ownershipEl.value || "";
  localStorage.setItem(MONETAG_CONFIG_KEY, JSON.stringify(config));
  if (!config.mainZone) {
    setStatus(
      "Saved (draft, no main zone). Reload your RevMine game tab so ownership can inject there when the backoffice is closed."
    );
  } else {
    setStatus("Saved. Reload the RevMine game tab to load the SDK.");
  }
});

loadConfig();
syncForm();
applyUi();
setStatus("This page only edits localStorage — it never runs the ownership script.");
