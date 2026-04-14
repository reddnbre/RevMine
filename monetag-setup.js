const MONETAG_CONFIG_KEY = "revmine_monetag_v1";

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
  sdkUrl: "https://libtl.com/sdk.js",
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
      sdkUrl: saved.sdkUrl || "https://libtl.com/sdk.js",
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
  const rewardCoins = Number(coinsEl.value || 400);
  config.mainZone = mainEl.value.trim();
  config.rewardedZone = rewardedEl.value.trim();
  config.sdkUrl = sdkEl.value.trim() || "https://libtl.com/sdk.js";
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
