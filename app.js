const API_BASE = "https://tanda-mini-bot.onrender.com";
const STATUS_ENDPOINTS = ["/health", "/api/health", "/status"];
const PAIR_ENDPOINTS = ["/pair", "/api/pair", "/pairing"];

const statusText = document.getElementById("statusText");
const statusDetail = document.getElementById("statusDetail");
const refreshStatusButton = document.getElementById("refreshStatus");
const pairForm = document.getElementById("pairForm");
const phoneInput = document.getElementById("phoneNumber");
const pairButton = document.getElementById("pairButton");
const pairResult = document.getElementById("pairResult");
const toast = document.getElementById("toast");

document.getElementById("year").textContent = new Date().getFullYear();

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function setServiceState(state, message) {
  statusText.textContent = state;
  statusDetail.textContent = message;
  const dot = document.querySelector(".status-dot");
  if (state.toLowerCase().includes("online")) {
    dot.style.background = "#50f2a0";
    dot.style.color = "#50f2a0";
  } else if (state.toLowerCase().includes("offline")) {
    dot.style.background = "#ff7777";
    dot.style.color = "#ff7777";
  } else {
    dot.style.background = "#e9b75a";
    dot.style.color = "#e9b75a";
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function refreshStatus() {
  refreshStatusButton.disabled = true;
  setServiceState("Checking service", "Checking the Render service…");
  try {
    const response = await fetchWithTimeout(API_BASE, { method: "GET", mode: "cors" }, 10000);
    if (response.ok) {
      setServiceState("Service online", "Render is responding. Bot connection status may require a dedicated status endpoint.");
    } else {
      setServiceState("Service online", `Render responded with HTTP ${response.status}.`);
    }
  } catch (error) {
    setServiceState("Status unavailable", "The service may be waking up, or its response may not allow browser requests. Try again shortly.");
  } finally {
    refreshStatusButton.disabled = false;
  }
}

function normalizePhone(raw) {
  return raw.replace(/\D/g, "");
}

function showPairResult(title, message, code = "") {
  pairResult.hidden = false;
  pairResult.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = title;
  pairResult.appendChild(heading);
  if (code) {
    const codeRow = document.createElement("div");
    codeRow.className = "pair-code";
    const codeText = document.createElement("span");
    codeText.textContent = code;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-button";
    copy.textContent = "▢";
    copy.setAttribute("aria-label", "Copy pairing code");
    copy.addEventListener("click", async () => {
      await copyText(code);
      showToast("Pairing code copied");
    });
    codeRow.append(codeText, copy);
    pairResult.appendChild(codeRow);
  }
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  pairResult.appendChild(paragraph);
}

function extractPairingCode(data) {
  if (!data || typeof data !== "object") return "";
  const candidates = [
    data.code,
    data.pairingCode,
    data.pairing_code,
    data.pairCode,
    data.pair_code,
    data.result && data.result.code,
    data.data && data.data.code
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

async function tryPairEndpoint(path, phone) {
  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, number: phone, phoneNumber: phone })
  }, 20000);
  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }
  return { response, data };
}

pairForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const phone = normalizePhone(phoneInput.value);
  if (!/^254\d{9}$/.test(phone)) {
    showPairResult("Check your number", "Enter a Kenyan WhatsApp number in international format, for example 2547XXXXXXXX. Do not include the leading zero or + sign.");
    return;
  }

  pairButton.disabled = true;
  pairButton.querySelector("span").textContent = "Requesting pairing code…";
  pairResult.hidden = true;

  let lastError = "";
  try {
    for (const endpoint of PAIR_ENDPOINTS) {
      try {
        const { response, data } = await tryPairEndpoint(endpoint, phone);
        if (response.status === 404 || response.status === 405) {
          lastError = `Endpoint ${endpoint} is not available`;
          continue;
        }
        if (!response.ok) {
          lastError = data && (data.error || data.message) ? String(data.error || data.message) : `Request failed with HTTP ${response.status}`;
          if (response.status >= 500) break;
          continue;
        }
        const code = extractPairingCode(data);
        if (code) {
          showPairResult("Your pairing code", "Open WhatsApp → Settings → Linked devices → Link a device → Link with phone number instead. Keep this code private.", code);
          return;
        }
        const message = data && (data.message || data.error || data.status)
          ? String(data.message || data.error || data.status)
          : "The endpoint responded, but no pairing code field was found in its response.";
        showPairResult("Pairing request received", message);
        return;
      } catch (error) {
        lastError = error.name === "AbortError" ? "The pairing request timed out." : error.message;
        if (error instanceof TypeError) {
          lastError = "The browser could not reach this API endpoint. Check the endpoint path and CORS settings on Render.";
        }
      }
    }
    showPairResult("Could not generate a code", `${lastError || "No supported pairing endpoint was found."} The website needs to use the exact pairing endpoint implemented by your Render server.`);
  } finally {
    pairButton.disabled = false;
    pairButton.querySelector("span").textContent = "Generate pairing code";
  }
});

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", async () => {
    const command = button.dataset.command;
    await copyText(command);
    showToast(`${command} copied to clipboard`);
  });
});

refreshStatusButton.addEventListener("click", refreshStatus);

refreshStatus();
