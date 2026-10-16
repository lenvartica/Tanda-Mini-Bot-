const API_BASE = "";
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
  } else if (state.toLowerCase().includes("offline") || state.toLowerCase().includes("unavailable")) {
    dot.style.background = "#ff7777";
    dot.style.color = "#ff7777";
  } else {
    dot.style.background = "#e9b75a";
    dot.style.color = "#e9b75a";
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  return { message: text };
}

async function refreshStatus() {
  refreshStatusButton.disabled = true;
  setServiceState("Checking service", "Checking the Render backend through the Vercel API proxy…");
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/health`, { method: "GET" }, 12000);
    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    const active = Number.isFinite(data.activeSessions) ? ` Active sessions: ${data.activeSessions}.` : "";
    const uptime = Number.isFinite(data.uptime) ? ` Uptime: ${Math.floor(data.uptime)} seconds.` : "";
    setServiceState("Service online", `${data.name || "Tanda Mini Bot"} is responding.${active}${uptime}`);
  } catch (error) {
    setServiceState("Status unavailable", error.message || "Unable to reach the backend. Check the Vercel deployment logs.");
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

  try {
    const response = await fetchWithTimeout("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    }, 30000);

    const data = await readJsonResponse(response);
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.message || `Pairing failed with HTTP ${response.status}`);
    }

    const code = typeof data.code === "string" ? data.code.trim() : "";
    if (!code) {
      showPairResult("Pairing response received", data.message || "The backend responded but did not include a pairing code. Check the Render logs for the pairing request.");
      return;
    }

    showPairResult("Your pairing code", data.message || "Open WhatsApp → Settings → Linked devices → Link a device → Link with phone number instead. Keep this code private.", code);
  } catch (error) {
    const message = error.name === "AbortError"
      ? "The pairing request timed out. Check whether the Render service is awake and inspect its logs."
      : error.message || "Could not contact the pairing service.";
    showPairResult("Could not generate a code", message);
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
