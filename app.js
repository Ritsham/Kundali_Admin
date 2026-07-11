import { KundaliChart } from './chart-engine.js';
import { DashaWidget } from './dasha-engine.js';

const tabs = [
  { label: "All Cases", status: "" },
  { label: "Pending", status: "pending" },
  { label: "Reviewed", status: "reviewed" },
  { label: "Accepted", status: "accepted" },
  { label: "Scheduled", status: "scheduled" },
  { label: "In Progress", status: "in_progress" },
  { label: "Completed", status: "completed" },
  { label: "Cancelled", status: "cancelled" },
  { label: "Rejected", status: "rejected" },
];

let currentStatus = "";
let caseFilters = { source_type: "", chart_type: "", date: "", user_name: "", case_id: "" };

const tabsEl = document.getElementById("tabs");
const requestsEl = document.getElementById("requests");
const statusLine = document.getElementById("status-line");
const apiBaseInput = document.getElementById("api-base");
const adminTokenInput = document.getElementById("admin-token");
const apiLabel = document.getElementById("api-label");
const settingsPanel = document.getElementById("settings-panel");
const consultationsPanel = document.getElementById("consultations-panel");
const matchmakingPanel = document.getElementById("matchmaking-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const astrologersPanel = document.getElementById("astrologers-panel");
const communityPanel = document.getElementById("community-panel");
const communityForm = document.getElementById("community-broadcast-form");
const communityChannelInput = document.getElementById("community-channel");
const communityTitleInput = document.getElementById("community-title");
const communityMessageInput = document.getElementById("community-message");
const communityLinkUrlInput = document.getElementById("community-link-url");
const communityLinkLabelInput = document.getElementById("community-link-label");
const communityImageInput = document.getElementById("community-image");
const communityImagePreview = document.getElementById("community-image-preview");
const communityStatusLine = document.getElementById("community-status-line");
const clearCommunityMessageBtn = document.getElementById("clear-community-message");
let communityImageDataUrl = "";
const caseDetailPanel = document.getElementById("case-detail-panel");
const caseDetailRoot = document.getElementById("case-detail-root");
const matchRequestsEl = document.getElementById("match-requests");
const matchStatusLine = document.getElementById("match-status-line");
const dashboardMetricsEl = document.getElementById("dashboard-metrics");
const astroRequestsEl = document.getElementById("astro-requests");
const astroStatusLine = document.getElementById("astro-status-line");
const sidebarToggle = document.getElementById("sidebar-toggle");

function getApiBase() {
  return "http://127.0.0.1:8000";
}

function getToken() {
  return "mock-admin-token";
}

function saveSettings() {
  localStorage.setItem("kundali_admin_api_base", apiBaseInput.value.trim().replace(/\/$/, ""));
  localStorage.setItem("kundali_admin_token", adminTokenInput.value.trim());
  syncSettingsUI();
  showPanel("consultations");
  loadRequests();
}

function syncSettingsUI() {
  apiBaseInput.value = getApiBase();
  adminTokenInput.value = getToken();
  apiLabel.textContent = getApiBase();
}

function escapeHtml(raw) {
  return String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle?.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function showPanel(panel) {
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.panel === panel));
  settingsPanel.classList.toggle("hidden", panel !== "settings");
  consultationsPanel.classList.toggle("hidden", panel !== "consultations");
  matchmakingPanel.classList.toggle("hidden", panel !== "matchmaking");
  dashboardPanel.classList.toggle("hidden", panel !== "dashboard");
  astrologersPanel.classList.toggle("hidden", panel !== "astrologers");
  communityPanel?.classList.toggle("hidden", panel !== "community");
  caseDetailPanel?.classList.toggle("hidden", panel !== "case-detail");

  const isCaseDetail = panel === "case-detail";
  document.body.classList.toggle("case-detail-mode", isCaseDetail);
  if (isCaseDetail) setSidebarCollapsed(true);
  
  if (panel === "matchmaking") loadMatchRequests();
  if (panel === "dashboard") loadDashboard();
  if (panel === "astrologers") loadAstrologers();
  if (panel === "community") prepareCommunityPanel();
  if (panel === "consultations") loadRequests();
}

window.showPanel = showPanel;

function candidateApiBases() {
  const saved = getApiBase();
  return [saved, "http://127.0.0.1:8000", "http://localhost:8000"]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

async function adminFetch(path, options = {}) {
  const token = getToken();
  const tried = [];
  let lastError = null;
  for (const base of candidateApiBases()) {
    const url = `${base}${path}`;
    tried.push(url);
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (base !== getApiBase()) {
        localStorage.setItem("kundali_admin_api_base", base);
        syncSettingsUI();
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Failed to fetch admin API. Tried: ${tried.join(", ")}. ${lastError?.message || "Check that the backend is running and the admin page is opened from http://127.0.0.1:8088 or file://."}`);
}


function prepareCommunityPanel() {
  if (communityStatusLine) communityStatusLine.textContent = "Ready to broadcast.";
}

function clearCommunityComposer() {
  if (communityTitleInput) communityTitleInput.value = "";
  if (communityMessageInput) communityMessageInput.value = "";
  if (communityLinkUrlInput) communityLinkUrlInput.value = "";
  if (communityLinkLabelInput) communityLinkLabelInput.value = "";
  if (communityImageInput) communityImageInput.value = "";
  communityImageDataUrl = "";
  communityImagePreview?.classList.add("hidden");
  if (communityImagePreview) communityImagePreview.innerHTML = "";
  if (communityStatusLine) communityStatusLine.textContent = "Ready to broadcast.";
}

function setCommunityImage(file) {
  if (!file) {
    communityImageDataUrl = "";
    communityImagePreview?.classList.add("hidden");
    if (communityImagePreview) communityImagePreview.innerHTML = "";
    return;
  }
  if (!file.type.startsWith("image/")) {
    if (communityStatusLine) communityStatusLine.textContent = "Please choose an image file.";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    communityImageDataUrl = typeof reader.result === "string" ? reader.result : "";
    if (communityImagePreview) {
      communityImagePreview.classList.toggle("hidden", !communityImageDataUrl);
      communityImagePreview.innerHTML = communityImageDataUrl
        ? `<img src="${communityImageDataUrl}" alt="Post image preview"><button type="button" id="remove-community-image">Remove image</button>`
        : "";
      document.getElementById("remove-community-image")?.addEventListener("click", () => setCommunityImage(null));
    }
  };
  reader.readAsDataURL(file);
}

async function broadcastCommunityMessage(event) {
  event?.preventDefault();
  const channel = communityChannelInput?.value || "announcements";
  const title = communityTitleInput?.value.trim() || "";
  const body = communityMessageInput?.value.trim() || "";
  const linkUrl = communityLinkUrlInput?.value.trim() || "";
  const linkLabel = communityLinkLabelInput?.value.trim() || "";
  if (!title && !body && !linkUrl && !communityImageDataUrl) {
    if (communityStatusLine) communityStatusLine.textContent = "Add a title, message, link, or image before broadcasting.";
    communityTitleInput?.focus();
    return;
  }

  if (communityStatusLine) communityStatusLine.textContent = `Broadcasting post to #${channel}...`;
  try {
    const res = await adminFetch(`/api/community/admin/broadcast`, {
      method: "POST",
      body: JSON.stringify({
        channel_name: channel,
        title,
        body,
        link_url: linkUrl,
        link_label: linkLabel,
        image_base64: communityImageDataUrl || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Failed to broadcast community post.");
    if (communityStatusLine) communityStatusLine.textContent = `Broadcasted post to #${channel}.`;
    clearCommunityComposer();
  } catch (err) {
    if (communityStatusLine) communityStatusLine.textContent = err.message || "Broadcast failed.";
  }
}


function renderTabs() {
  tabsEl.innerHTML = `
    <div class="case-filters">
      <input id="filter-case-id" placeholder="Case ID" value="${escapeHtml(caseFilters.case_id)}">
      <input id="filter-user-name" placeholder="User name" value="${escapeHtml(caseFilters.user_name)}">
      <select id="filter-source-type">
        <option value="">All sources</option>
        <option value="prashna" ${caseFilters.source_type === "prashna" ? "selected" : ""}>Prashna</option>
        <option value="direct_consultation" ${caseFilters.source_type === "direct_consultation" ? "selected" : ""}>Direct consultation</option>
        <option value="matchmaking" ${caseFilters.source_type === "matchmaking" ? "selected" : ""}>Matchmaking</option>
      </select>
      <select id="filter-chart-type">
        <option value="">All charts</option>
        <option value="prashna" ${caseFilters.chart_type === "prashna" ? "selected" : ""}>Prashna</option>
        <option value="lagna" ${caseFilters.chart_type === "lagna" ? "selected" : ""}>Lagna</option>
        <option value="matchmaking" ${caseFilters.chart_type === "matchmaking" ? "selected" : ""}>Matchmaking</option>
      </select>
      <input id="filter-date" type="date" value="${escapeHtml(caseFilters.date)}">
      <button id="apply-case-filters" class="ghost-btn" type="button">Apply</button>
      <button id="clear-case-filters" class="ghost-btn" type="button">Clear</button>
    </div>
    <div class="tab-row">
      ${tabs.map((tab) => `<button class="tab-btn ${tab.status === currentStatus ? "active" : ""}" data-status="${tab.status}">${tab.label}</button>`).join("")}
    </div>
  `;
  tabsEl.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentStatus = btn.dataset.status;
      renderTabs();
      loadRequests();
    });
  });
  document.getElementById("apply-case-filters")?.addEventListener("click", () => {
    caseFilters = {
      case_id: document.getElementById("filter-case-id")?.value.trim() || "",
      user_name: document.getElementById("filter-user-name")?.value.trim() || "",
      source_type: document.getElementById("filter-source-type")?.value || "",
      chart_type: document.getElementById("filter-chart-type")?.value || "",
      date: document.getElementById("filter-date")?.value || "",
    };
    loadRequests();
  });
  document.getElementById("clear-case-filters")?.addEventListener("click", () => {
    caseFilters = { source_type: "", chart_type: "", date: "", user_name: "", case_id: "" };
    currentStatus = "";
    renderTabs();
    loadRequests();
  });
}

async function loadRequests() {
  requestsEl.innerHTML = '<div class="empty">Loading consultation cases...</div>';
  statusLine.textContent = "Loading...";
  try {
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);
    Object.entries(caseFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    const res = await adminFetch(`/api/admin/consultation-cases${query ? `?${query}` : ""}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load consultation cases.");
    const items = data.cases || [];
    renderRequests(items);
    statusLine.textContent = `${items.length || 0} case(s)${currentStatus ? ` in ${currentStatus}` : ""}.`;
  } catch (err) {
    requestsEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}<br><br>Check API URL, admin token, CORS, and whether the consultation case SQL migration is applied.</div>`;
    statusLine.textContent = "Load failed.";
  }
}


function renderRequests(requests) {
  if (!requests.length) {
    requestsEl.innerHTML = '<div class="empty">No consultation cases match these filters.</div>';
    return;
  }

  window.snapshots = window.snapshots || {};
  window.caseItems = {};
  requestsEl.innerHTML = requests.map((item) => {
    const caseId = item.case_id || item.id;
    const user = item.user || {};
    const consultation = item.consultation || {};
    const snapshot = item.astrology_snapshot || item.astrological_snapshot || item.chart_snapshot;
    if (snapshot) window.snapshots[caseId] = snapshot;
    window.caseItems[caseId] = item;

    const submitted = item.created_at ? new Date(item.created_at).toLocaleString() : "-";
    const preferred = [consultation.preferred_date || item.preferred_date, consultation.preferred_time || item.preferred_time].filter(Boolean).join(" ") || "-";
    const name = user.full_name || item.name || "-";
    const phone = user.mobile_number || item.phone || "";
    const email = user.email || item.email || "";
    const question = consultation.question || item.question || "-";
    const cleanPhone = String(phone).replace(/\D/g, "");
    const whatsappText = encodeURIComponent(`Hello ${name}, your consultation case status is: ${item.case_status || item.status}.\n${item.scheduled_at ? `Scheduled time: ${item.scheduled_at}\n` : ""}${item.meeting_link ? `Meeting link: ${item.meeting_link}\n` : ""}`);
    const whatsappHref = cleanPhone ? `https://wa.me/${cleanPhone}?text=${whatsappText}` : `https://wa.me/?text=${whatsappText}`;
    const sourceLabel = item.source_type === "matchmaking" ? "Matchmaking" : (item.source_type === "direct_consultation" ? "Direct consultation" : "Prashna");
    const chartLabel = item.chart_type || snapshot?.chart_type || "-";

    return `
      <article class="request-card" data-id="${escapeHtml(caseId)}" role="button" tabindex="0" onclick="window.openCaseDetail('${escapeHtml(caseId)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();window.openCaseDetail('${escapeHtml(caseId)}')}">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(name)}</h3>
            <div class="small-muted">Case ${escapeHtml(caseId)} • ${escapeHtml(sourceLabel)} • ${escapeHtml(chartLabel)} • ${escapeHtml(submitted)}</div>
          </div>
          <span class="status-pill ${escapeHtml(item.case_status || item.status)}">${escapeHtml(item.case_status || item.status)}</span>
        </div>

        <div class="meta case-summary">
          <div><strong>Question:</strong> ${escapeHtml(question)}</div>
          <div><strong>Preferred:</strong> ${escapeHtml(preferred)}</div>
          <div><strong>Created:</strong> ${escapeHtml(submitted)}</div>
          <div><strong>Contact:</strong> ${escapeHtml(email)} ${phone ? `• ${escapeHtml(phone)}` : ""}</div>
        </div>
        
        <div id="dossier-container-${escapeHtml(caseId)}" class="hidden" onclick="event.stopPropagation()" style="margin-top: 15px; padding: 15px; border-top: 1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.1); border-radius: 8px;">
          <div class="meta" style="margin-bottom: 15px;">
            <div><strong>Source:</strong> ${escapeHtml(sourceLabel)}</div>
            <div><strong>Chart:</strong> ${escapeHtml(chartLabel)}</div>
            <div><strong>Place:</strong> ${escapeHtml(user.place || item.place_of_birth || "-")}</div>
            <div><strong>Birth/Prashna:</strong> ${escapeHtml(user.date_of_birth || item.date_of_birth || "-")} ${escapeHtml(user.time_of_birth || item.time_of_birth || "-")}</div>
            <div><strong>Lat/Lon:</strong> ${escapeHtml(user.latitude ?? "-")}, ${escapeHtml(user.longitude ?? "-")}</div>
            <div><strong>Payment:</strong> ${escapeHtml(consultation.payment_status || item.payment_status || "-")}</div>
          </div>
          <div class="question" style="margin-bottom: 15px;"><strong>Question</strong><br>${escapeHtml(question)}</div>
          ${consultation.additional_message || item.additional_message ? `<div class="question" style="margin-bottom: 15px;"><strong>User Notes</strong><br>${escapeHtml(consultation.additional_message || item.additional_message)}</div>` : ""}
          
          <div id="charts-container-${escapeHtml(caseId)}"></div>
          
          <div class="admin-fields" style="margin-top:15px;">
            <input id="meeting-${escapeHtml(caseId)}" placeholder="Google Meet / Zoom link" value="${escapeHtml(item.meeting_link || "")}">
            <input id="schedule-${escapeHtml(caseId)}" placeholder="Scheduled date/time" value="${escapeHtml(item.scheduled_at || "")}">
            <textarea id="notes-${escapeHtml(caseId)}" placeholder="Admin notes">${escapeHtml(item.admin_notes || "")}</textarea>
          </div>
          <div class="actions" style="margin-top: 15px;">
            <button class="primary" onclick="openCaseDetail('${escapeHtml(caseId)}')">Open Full Detail</button>
            <button class="primary" onclick="updateRequest('${escapeHtml(caseId)}', 'accepted')">Accept</button>
            <button onclick="updateRequest('${escapeHtml(caseId)}', 'reviewed')">Mark Reviewed</button>
            <button onclick="updateRequest('${escapeHtml(caseId)}', 'scheduled')">Mark Scheduled</button>
            <button onclick="updateRequest('${escapeHtml(caseId)}', 'in_progress')">Mark In Progress</button>
            <button onclick="updateRequest('${escapeHtml(caseId)}')">Save Schedule/Notes</button>
            <button class="done" onclick="updateRequest('${escapeHtml(caseId)}', 'completed')">Mark Completed</button>
            <button class="danger" onclick="updateRequest('${escapeHtml(caseId)}', 'rejected')">Reject</button>
            <a class="whatsapp-link" href="${whatsappHref}" target="_blank">WhatsApp Manual Message</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}



const VARGA_ORDER = ["D1", "D2", "D3", "D4", "D6", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"];
const VARGA_TITLES = {
  D1: "Rashi / Lagna",
  D2: "Hora",
  D3: "Drekkana",
  D4: "Chaturthamsha",
  D6: "Shashtamsha",
  D7: "Saptamsa",
  D9: "Navamsa",
  D10: "Dashamsa",
  D12: "Dwadashamsha",
  D16: "Shodashamsha",
  D20: "Vimshamsha",
  D24: "Chaturvimshamsha",
  D27: "Bhamsha",
  D30: "Trimsamsha",
  D40: "Khavedamsha",
  D45: "Akshavedamsha",
  D60: "Shashtiamsha",
};
const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function caseValue(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function caseInterpretationText(interpretation) {
  if (!interpretation) return "";
  if (typeof interpretation === "string") return interpretation;
  return interpretation.answer?.text || interpretation.verdict?.summary || interpretation.title || "";
}

function parseJsonDeep(raw) {
  try {
    let value = raw;
    for (let i = 0; i < 2 && typeof value === "string"; i += 1) {
      value = JSON.parse(value);
    }
    return value || {};
  } catch (err) {
    return {};
  }
}

function normalizeSnapshot(raw) {
  return parseJsonDeep(raw);
}

function isChartSignMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return SIGN_NAMES.some((sign) => Array.isArray(value[sign]));
}

function normalizeChartMap(value) {
  const parsed = parseJsonDeep(value);
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.chart) return normalizeChartMap(parsed.chart);
  if (parsed.signs) return normalizeChartMap(parsed.signs);
  if (isChartSignMap(parsed)) return parsed;
  return null;
}

function findFirstArray(...values) {
  for (const value of values) {
    const parsed = parseJsonDeep(value);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  }
  return [];
}

function findFirstObject(...values) {
  for (const value of values) {
    const parsed = parseJsonDeep(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length) return parsed;
  }
  return null;
}

function collectDivisionalCharts(...sources) {
  const charts = {};
  sources.forEach((source) => {
    const parsed = parseJsonDeep(source);
    const divisional = parsed?.divisional_charts || parsed?.chart?.divisional_charts;
    if (!divisional || typeof divisional !== "object") return;
    Object.entries(divisional).forEach(([code, raw]) => {
      const upperCode = String(code).toUpperCase();
      const chart = normalizeChartMap(raw);
      if (chart) {
        charts[upperCode] = {
          code: upperCode,
          title: raw?.title || VARGA_TITLES[upperCode] || "Divisional Chart",
          chart,
        };
      }
    });
  });
  return charts;
}

function orderedChartEntries(charts) {
  const known = VARGA_ORDER.filter((code) => charts[code]).map((code) => charts[code]);
  const extra = Object.keys(charts)
    .filter((code) => !VARGA_ORDER.includes(code))
    .sort()
    .map((code) => charts[code]);
  return [...known, ...extra];
}

function getCaseAstroModel(item) {
  const snapshot = normalizeSnapshot(item.astrology_snapshot || item.astrological_snapshot || item.chart_snapshot);
  const sourceResult = parseJsonDeep(snapshot.source_result);
  const report = parseJsonDeep(snapshot.report || sourceResult.report);
  const matchReport = report?.participants ? report : null;
  const chart = findFirstObject(
    snapshot.chart,
    sourceResult.chart,
    sourceResult,
    report?.charts?.person,
    report?.charts?.main,
    snapshot,
  ) || {};

  const mainChart = normalizeChartMap(
    chart.signs || chart.divisional_charts?.D1 || snapshot.divisional_charts?.D1 || snapshot.signs || snapshot,
  );
  const divisional = collectDivisionalCharts(snapshot, chart, sourceResult.chart, sourceResult, report?.charts?.person, report?.charts?.main);
  if (mainChart && !divisional.D1) {
    divisional.D1 = { code: "D1", title: VARGA_TITLES.D1, chart: mainChart };
  }

  const planets = findFirstArray(
    snapshot.planetary_positions,
    chart.planets,
    sourceResult.chart?.planets,
    report?.dossier?.planetary_positions?.person,
    report?.dossier?.planetary_positions?.main,
  );
  const dashas = findFirstObject(
    snapshot.dashas,
    chart.dashas,
    sourceResult.chart?.dashas,
    report?.dossier?.dashas?.person,
    report?.dossier?.dashas?.main,
  );
  const interpretation = caseInterpretationText(snapshot.interpretation || chart.interpretation || sourceResult.interpretation);
  const question = findFirstObject(snapshot.question_context, chart.question, sourceResult.chart?.question);
  const meta = findFirstObject(snapshot.calculation_metadata, chart.meta, sourceResult.chart?.meta);
  const aspects = snapshot.aspects || chart.aspects || sourceResult.chart?.aspects;
  const yogas = snapshot.yogas || chart.yogas || sourceResult.chart?.yogas;
  const kp = snapshot.kp_system || chart.kp_system || sourceResult.chart?.kp_system;
  const transit = findFirstObject(
    snapshot.additional_calculations?.transit,
    chart.transit,
    sourceResult.chart?.transit,
  );
  const transitChart = normalizeChartMap(transit?.chart);
  const transitPlanets = findFirstArray(transit?.planets);

  return {
    snapshot,
    chart,
    mainChart,
    chartEntries: orderedChartEntries(divisional),
    planets,
    dashas,
    interpretation,
    question,
    meta,
    aspects,
    yogas,
    kp,
    transit,
    transitChart,
    transitPlanets,
    matchReport,
  };
}

function formatDegree(p) {
  if (p.formatted_degree) return p.formatted_degree;
  const value = p.degree ?? p.normDegree ?? p.longitude;
  return typeof value === "number" ? `${value.toFixed(2)}°` : "-";
}

function positionsTable(planets = []) {
  if (!Array.isArray(planets) || !planets.length) return '<div class="empty small-empty">No planetary positions available.</div>';
  return `
    <div class="detail-table-wrap">
      <table class="detail-table detail-table--positions">
        <thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Longitude</th><th>House</th><th>Nakshatra</th><th>Pada</th><th>Motion</th><th>Sign Lord</th><th>Star Lord</th></tr></thead>
        <tbody>
          ${planets.map((p) => `
            <tr>
              <td>${escapeHtml(p.name || p.planet || "-")}</td>
              <td>${escapeHtml(p.sign || "-")}</td>
              <td>${escapeHtml(formatDegree(p))}</td>
              <td>${escapeHtml(typeof p.longitude === "number" ? `${p.longitude.toFixed(4)}°` : "-")}</td>
              <td>${escapeHtml(p.house ?? "-")}</td>
              <td>${escapeHtml(p.nakshatra || "-")}</td>
              <td>${escapeHtml(p.pada ?? "-")}</td>
              <td>${escapeHtml(p.retrograde ? "Retrograde" : "Direct")}</td>
              <td>${escapeHtml(p.sign_lord || p.signLord || "-")}</td>
              <td>${escapeHtml(p.star_lord || p.starLord || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function jsonBlock(value) {
  const parsed = parseJsonDeep(value);
  if (!parsed || (typeof parsed === "object" && !Array.isArray(parsed) && !Object.keys(parsed).length)) return '<div class="empty small-empty">Not available.</div>';
  return `<pre class="json-block">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function detailFact(label, value) {
  return `<div class="kundali-fact"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value || "-")}</span></div>`;
}

function compactPositionsTable(planets = [], mode = "natal") {
  if (!Array.isArray(planets) || !planets.length) return '<div class="empty small-empty">No planetary positions available.</div>';
  const houseLabel = mode === "transit" ? "House from Birth Lagna" : "House";
  return `
    <div class="kundali-table-wrap">
      <table class="kundali-table">
        <thead><tr><th>Planet</th><th>${mode === "transit" ? "Transit Sign" : "Sign"}</th><th>Degree</th><th>${houseLabel}</th>${mode === "natal" ? "<th>Nakshatra</th><th>Pada</th><th>Motion</th>" : ""}</tr></thead>
        <tbody>
          ${planets.map((p) => `
            <tr>
              <td>${escapeHtml(p.name || p.planet || "-")}</td>
              <td>${escapeHtml(p.sign || "-")}</td>
              <td>${escapeHtml(formatDegree(p))}</td>
              <td>${escapeHtml(p.house ?? p.kp_house ?? "-")}</td>
              ${mode === "natal" ? `<td>${escapeHtml(p.nakshatra || "-")}</td><td>${escapeHtml(p.pada ?? "-")}</td><td>${escapeHtml(p.retrograde ? "Retrograde" : "Direct")}</td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function houseList(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (value && typeof value === "object") return Object.values(value).flat().join(", ") || "-";
  return value || "-";
}

function renderKPPanel(caseId, model) {
  const kp = parseJsonDeep(model.kp);
  if (!kp) {
    return `
      <section class="kundali-panel kp-panel">
        <p class="panel-kicker">KP System</p>
        <h3>KP Significators & Cusps</h3>
        <div class="empty small-empty">KP calculation is not available for this case.</div>
      </section>
    `;
  }

  const sigs = kp.planet_significators || {};
  const cusps = Array.isArray(kp.cusps) ? kp.cusps : [];
  const occupants = kp.house_occupants || {};
  const planetMap = Object.fromEntries((model.planets || []).map((planet) => [planet.name || planet.planet, planet]));

  return `
    <section class="kundali-panel kp-panel">
      <p class="panel-kicker">KP System</p>
      <h3>KP Significators & Cusps</h3>
      ${model.mainChart ? `<div class="kp-chart-wrap"><canvas id="case-kp-chart-${escapeHtml(caseId)}" class="detail-chart"></canvas></div>` : ""}
      <div class="kp-review-grid">
        <div>
          <h4>Planet Significators</h4>
          <div class="kundali-table-wrap">
            <table class="kundali-table">
              <thead><tr><th>Planet</th><th>Sign Lord</th><th>Star Lord</th><th>Sub Lord</th><th>Sub-Sub Lord</th><th>Houses</th></tr></thead>
              <tbody>
                ${Object.entries(sigs).map(([name, houses]) => {
                  const planet = planetMap[name] || {};
                  return `
                    <tr>
                      <td>${escapeHtml(name)}</td>
                      <td>${escapeHtml(planet.sign_lord || planet.signLord || "-")}</td>
                      <td>${escapeHtml(planet.star_lord || planet.starLord || "-")}</td>
                      <td>${escapeHtml(planet.sub_lord || planet.subLord || "-")}</td>
                      <td>${escapeHtml(planet.sub_sub_lord || planet.subSubLord || "-")}</td>
                      <td>${escapeHtml(houseList(houses))}</td>
                    </tr>
                  `;
                }).join("") || '<tr><td colspan="6">No planet significators available.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4>Cuspal Details</h4>
          <div class="kundali-table-wrap">
            <table class="kundali-table">
              <thead><tr><th>Cusp</th><th>Degree</th><th>Sign Lord</th><th>Star Lord</th><th>Sub Lord</th><th>Sub-Sub Lord</th><th>Occupants</th></tr></thead>
              <tbody>
                ${cusps.map((cusp) => `
                  <tr>
                    <td>${escapeHtml(cusp.house || "-")}</td>
                    <td>${escapeHtml(cusp.formatted_degree || (typeof cusp.longitude === "number" ? `${cusp.longitude.toFixed(2)}°` : cusp.longitude || "-"))}</td>
                    <td>${escapeHtml(cusp.sign_lord || "-")}</td>
                    <td>${escapeHtml(cusp.star_lord || "-")}</td>
                    <td>${escapeHtml(cusp.sub_lord || "-")}</td>
                    <td>${escapeHtml(cusp.sub_sub_lord || "-")}</td>
                    <td>${escapeHtml(houseList(occupants[cusp.house]))}</td>
                  </tr>
                `).join("") || '<tr><td colspan="7">No cusp details available.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

const CHART_TOPIC_CODES = {
  main: ["D1"],
  divisional: VARGA_ORDER,
  career: ["D1", "D10", "D24"],
  marriage: ["D1", "D9", "D7"],
  health: ["D1", "D6", "D8", "D12", "D30"],
};

function inferChartTopic(question = "", chartType = "") {
  const text = `${question} ${chartType}`.toLowerCase();
  if (/(marriage|shaadi|shadi|wedding|spouse|partner|relationship|match)/.test(text)) return "marriage";
  if (/(career|job|business|work|profession|promotion|income)/.test(text)) return "career";
  if (/(health|illness|disease|medical|surgery|hospital)/.test(text)) return "health";
  return "main";
}

function chartTopicForCode(code) {
  const upper = String(code || "").toUpperCase();
  return Object.entries(CHART_TOPIC_CODES)
    .filter(([, codes]) => codes.includes(upper))
    .map(([topic]) => topic)
    .join(" ");
}

function availableTopicCodes(entries, topic) {
  const wanted = CHART_TOPIC_CODES[topic] || CHART_TOPIC_CODES.main;
  const available = entries.filter((entry) => wanted.includes(entry.code));
  return available.length ? available.map((entry) => entry.code) : entries.slice(0, 1).map((entry) => entry.code);
}

function renderChartWorksheet(caseId, entries, activeTopic = "main") {
  if (!entries.length) return '<div class="empty small-empty">Chart snapshot is not available yet. Reopen this detail page after the backend calculates the missing chart.</div>';
  const initialCodes = availableTopicCodes(entries, activeTopic);
  return `
    <section class="kundali-panel worksheet-panel" data-case-id="${escapeHtml(caseId)}" data-active-topic="${escapeHtml(activeTopic)}">
      <div class="mini-toggle-row">
        <button type="button" class="mini-toggle active" onclick="document.querySelector('.dasha-position-panel')?.scrollIntoView({behavior:'smooth', block:'nearest'})">Planet Positions</button>
        <button type="button" class="mini-toggle" onclick="document.querySelector('.kp-panel')?.scrollIntoView({behavior:'smooth', block:'nearest'})">KP</button>
      </div>
      <div class="worksheet-toolbar">
        <div>
          <p class="panel-kicker">Worksheet</p>
          <h3>Topic Charts</h3>
        </div>
        <select id="case-chart-select-${escapeHtml(caseId)}" aria-label="Select chart">
          ${entries.map((entry) => `<option>${escapeHtml(entry.code)} ${escapeHtml(entry.title)}</option>`).join("")}
        </select>
        <button type="button" onclick="addCaseChart('${escapeHtml(caseId)}')">Add Chart</button>
        <button type="button" onclick="setCaseChartTopic('${escapeHtml(caseId)}', '${escapeHtml(activeTopic)}')">Reset</button>
      </div>
      <div class="worksheet-presets">
        ${["main", "divisional", "career", "marriage", "health"].map((topic) => `
          <button class="${topic === activeTopic ? "active" : ""}" type="button" data-topic="${topic}" onclick="setCaseChartTopic('${escapeHtml(caseId)}', '${topic}')">${escapeHtml(topic[0].toUpperCase() + topic.slice(1))}</button>
        `).join("")}
      </div>
      <div class="case-chart-tabs topic-chart-tabs">
        ${entries.map((entry) => `<button type="button" data-code="${escapeHtml(entry.code)}" class="${initialCodes.includes(entry.code) ? "" : "hidden"}" onclick="document.getElementById('case-chart-card-${escapeHtml(caseId)}-${escapeHtml(entry.code)}')?.scrollIntoView({behavior:'smooth', block:'nearest'})"><strong>${escapeHtml(entry.code)}</strong></button>`).join("")}
      </div>
      <div class="case-worksheet-canvas kundali-worksheet-canvas" data-chart-count="${entries.length}">
        ${entries.map((entry) => `
          <section class="case-worksheet-item ${initialCodes.includes(entry.code) ? "" : "hidden"}" data-code="${escapeHtml(entry.code)}" data-topic="${escapeHtml(chartTopicForCode(entry.code))}" id="case-chart-card-${escapeHtml(caseId)}-${escapeHtml(entry.code)}">
            <div class="case-worksheet-item-head"><strong>${escapeHtml(entry.code)}</strong><span>${escapeHtml(entry.title)}</span><em>x</em></div>
            <canvas id="case-chart-${escapeHtml(caseId)}-${escapeHtml(entry.code)}" class="detail-chart"></canvas>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

window.setCaseChartTopic = function setCaseChartTopic(caseId, topic) {
  const panel = document.querySelector(`.worksheet-panel[data-case-id="${caseId}"]`);
  if (!panel) return;
  const wanted = CHART_TOPIC_CODES[topic] || CHART_TOPIC_CODES.main;
  const cards = [...panel.querySelectorAll(".case-worksheet-item")];
  const availableCodes = cards.map((card) => card.dataset.code).filter((code) => wanted.includes(code));
  const visibleCodes = availableCodes.length ? availableCodes : cards.slice(0, 1).map((card) => card.dataset.code);
  panel.dataset.activeTopic = topic;
  panel.querySelectorAll(".worksheet-presets button").forEach((btn) => btn.classList.toggle("active", btn.dataset.topic === topic));
  cards.forEach((card) => card.classList.toggle("hidden", !visibleCodes.includes(card.dataset.code)));
  panel.querySelectorAll(".topic-chart-tabs button").forEach((btn) => btn.classList.toggle("hidden", !visibleCodes.includes(btn.dataset.code)));
  renderVisibleCaseCharts(caseId);
};

window.addCaseChart = function addCaseChart(caseId) {
  const select = document.getElementById(`case-chart-select-${caseId}`);
  const code = select?.value?.split(" ")[0];
  const card = code ? document.getElementById(`case-chart-card-${caseId}-${code}`) : null;
  if (!card) return;
  card.classList.remove("hidden");
  document.querySelector(`.worksheet-panel[data-case-id="${caseId}"] .topic-chart-tabs button[data-code="${code}"]`)?.classList.remove("hidden");
  renderCaseChartCanvas(caseId, code);
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

function renderCaseChartCanvas(caseId, code) {
  const canvas = document.getElementById(`case-chart-${caseId}-${code}`);
  const entry = window.caseChartData?.[caseId]?.find((chartEntry) => chartEntry.code === code);
  if (!canvas || !entry?.chart || canvas.dataset.rendered === "true") return;
  new KundaliChart(canvas, entry.chart, { responsive: true });
  canvas.dataset.rendered = "true";
}

function renderVisibleCaseCharts(caseId) {
  document.querySelectorAll(`.worksheet-panel[data-case-id="${caseId}"] .case-worksheet-item:not(.hidden)`).forEach((card) => {
    renderCaseChartCanvas(caseId, card.dataset.code);
  });
}

function renderTransitPanel(caseId, model) {
  return `
    <section class="kundali-panel transit-panel">
      <div class="kundali-subfact"><strong>House Reference</strong><span>${escapeHtml(model.transit?.house_reference || "Birth Lagna")}</span></div>
      ${compactPositionsTable(model.transitPlanets, "transit")}
      <h3 class="transit-title">Transit Chart</h3>
      ${model.transitChart ? `<canvas id="case-transit-chart-${escapeHtml(caseId)}" class="transit-chart detail-chart"></canvas>` : '<div class="empty small-empty">Transit chart not available.</div>'}
    </section>
  `;
}

function renderMatchChartCard(caseId, role, entry, index) {
  if (!entry?.chart) return '';
  const label = role === 'boy' ? 'Boy' : 'Girl';
  return `
    <section class="case-worksheet-item match-chart-item">
      <div class="case-worksheet-item-head"><strong>${escapeHtml(label)} ${escapeHtml(entry.name || '')}</strong><span>${escapeHtml(entry.purpose || '')}</span></div>
      <canvas id="match-${escapeHtml(role)}-chart-${escapeHtml(caseId)}-${index}" class="detail-chart"></canvas>
    </section>
  `;
}

function matchPositionTable(title, rows = []) {
  return `
    <div class="planet-position-card">
      <h3>${escapeHtml(title)} Positions</h3>
      ${compactPositionsTable(rows.map((row) => ({
        name: row.planet || row.name,
        sign: row.sign,
        house: row.house,
        nakshatra: row.nakshatra,
        pada: row.pada,
        retrograde: row.retrograde,
      })), "natal")}
    </div>
  `;
}

function renderMatchmakingCaseDetail(item) {
  const caseId = item.case_id || item.id;
  const model = getCaseAstroModel(item);
  const report = model.matchReport || {};
  const status = item.case_status || item.status || "pending";
  const boy = report?.participants?.boy || report?.dossier?.couple_information?.boy || {};
  const girl = report?.participants?.girl || report?.dossier?.couple_information?.girl || {};
  const summary = report?.summary || {};
  const ashtakoota = report?.ashtakoota || {};
  const dossier = report?.dossier || {};
  // Debug: log the full dossier so we can see actual field names in console
  console.log('[Matchmaking Dossier Keys]', Object.keys(dossier));
  if (dossier) {
    ['seventh_house','marriage_house','marriage_indicators','karakas','karaka','navamsa','d9','d9_navamsa','compatibility_indicators','compat'].forEach(k => {
      if (dossier[k]) console.log('[Dossier] Found key:', k, JSON.stringify(dossier[k]).slice(0, 200));
    });
  }
  const mandatory = dossier.charts_to_send?.mandatory || [];
  
  const bPos = dossier.planetary_positions?.boy || [];
  const gPos = dossier.planetary_positions?.girl || [];
  
  const getPlanet = (pos, name) => pos.find(p => p.planet === name || p.name === name) || {};
  const bLagna = getPlanet(bPos, 'Ascendant');
  const gLagna = getPlanet(gPos, 'Ascendant');
  const bMoon = getPlanet(bPos, 'Moon');
  const gMoon = getPlanet(gPos, 'Moon');
  
  const bNak = bMoon.nakshatra ? `${bMoon.nakshatra}, Pada ${bMoon.pada || 1}` : '-';
  const gNak = gMoon.nakshatra ? `${gMoon.nakshatra}, Pada ${gMoon.pada || 1}` : '-';

  const totalScore = ashtakoota.total_score || '0';
  const scorePercent = (parseFloat(totalScore) / 36) * 100;
  
  const doshas = dossier.dosha_analysis || dossier.doshas || report?.doshas || [];
  let doshasHtml = '';
  if (doshas.length > 0) {
    doshasHtml = doshas.map(d => {
      let sColor = d.severity === 'high' ? '#c62828' : (d.severity === 'medium' ? '#f57f17' : '#2e7d32');
      let sBg = d.severity === 'high' ? '#ffebee' : (d.severity === 'medium' ? '#fff8e1' : '#e8f5e9');
      let rec = d.recommendation || d.effective_result || ((d.severity === 'high' || d.severity === 'medium') ? 'Astrologer review recommended' : 'No major issue detected in this basic check');
      let presentStr = d.present !== undefined ? `Present: ${d.present ? 'Yes' : 'No'}<br><br>` : '';
      return `
      <div class="exact-dosha-item">
        <div class="ed-row1">
          <div class="ed-name">${escapeHtml(d.name || d.dosha_name || '')}</div>
          <div class="ed-badge" style="color: ${sColor}; background: ${sBg};">${escapeHtml(d.severity || 'none')}</div>
        </div>
        <div class="ed-desc">${presentStr}${escapeHtml(d.reason || d.explanation || '')}<br><br>Effective result: ${escapeHtml(rec)}</div>
      </div>`;
    }).join('');
  } else {
    doshasHtml = `<div class="exact-dosha-item"><div class="ed-desc">No Dosha data found in report.</div></div>`;
  }

  const kootasList = dossier.complete_guna_milan || dossier.koota_breakdown || ashtakoota.kootas || [];
  let kootasHtml = '';
  if (kootasList.length > 0) {
    kootasHtml = kootasList.map(k => {
      let scoreVal = k.obtained ?? k.score ?? 0;
      let scoreStr = (scoreVal === 0 || scoreVal === "0" || scoreVal === 0.0) ? "" : scoreVal;
      let maxStr = k.maximum ?? k.max_score ?? 0;
      
      let badgeClass = 'badge-good';
      let badgeText = 'good';
      if(parseFloat(scoreVal) === 0) { badgeClass = 'badge-concern'; badgeText = 'concern'; }
      else if(parseFloat(scoreVal) < maxStr/2) { badgeClass = 'badge-review'; badgeText = 'review'; }
      
      return `<div class="exact-koota-item">
        <div class="ek-name">${escapeHtml(k.name || k.koota || '')}</div>
        <div class="ek-score">${escapeHtml(scoreStr)}/${escapeHtml(maxStr)}</div>
        <div class="ek-badge-col"><span class="ek-badge ${badgeClass}">${badgeText}</span></div>
        <div class="ek-desc">${escapeHtml(k.explanation || k.interpretation || '')}</div>
      </div>`;
    }).join('');
  } else {
    kootasHtml = `<div class="exact-koota-item"><div class="ek-desc">No Guna Milan data found in report.</div></div>`;
  }

  const chartPairs = [
    { boy: mandatory[0], girl: mandatory[1], title: 'D1 Lagna Chart', desc: 'Marriage promise, 7th house & planetary placements' },
    { boy: mandatory[2], girl: mandatory[3], title: 'D9 Navamsa Chart', desc: 'Marriage strength, spouse indications & long-term compatibility' },
    { boy: mandatory[4], girl: mandatory[5], title: 'Moon Chart', desc: 'Emotional compatibility, Guna Milan & marriage happiness' },
    { boy: mandatory[6], girl: mandatory[7], title: 'Bhava Chalit Chart', desc: 'House cusps & planet occupation by house' },
  ];

  // Map extra details dynamically
  const buildInfoRows = (obj) => {
    if (!obj || typeof obj !== 'object') return '<div class="ed-desc">No data available.</div>';
    const entries = Object.entries(obj).filter(([k,v]) => v !== null && v !== undefined && v !== '' && k !== 'details');
    if (!entries.length) return '<div class="ed-desc">No data available.</div>';
    return entries.map(([key, value]) => {
      const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      let displayVal = '';
      if (Array.isArray(value)) displayVal = value.join(', ') || '—';
      else if (typeof value === 'boolean') displayVal = value ? 'Yes' : 'No';
      else if (typeof value === 'object') return '';
      else displayVal = String(value);
      return `<div class="info-table-row"><span>${escapeHtml(formattedKey)}</span><span>${escapeHtml(displayVal)}</span></div>`;
    }).filter(Boolean).join('');
  };

  // Exact field names from matchmaking_service.py backend
  const boySeventh = dossier.marriage_house_analysis?.boy || {};
  const girlSeventh = dossier.marriage_house_analysis?.girl || {};
  const boyKarakas = dossier.marriage_karakas?.boy || {};
  const girlKarakas = dossier.marriage_karakas?.girl || {};
  const boyNavamsa = dossier.navamsa_analysis?.boy || {};
  const girlNavamsa = dossier.navamsa_analysis?.girl || {};
  
  const compatList = dossier.compatibility_indicators || dossier.compat || dossier.compatibility || summary.compatibility_indicators || [];
  let compatHtml = '';
  if (Array.isArray(compatList) && compatList.length > 0) {
    compatHtml = compatList.map(c => {
      const st = (c.status || c.score || 'review').toLowerCase();
      let colorClass = 'review';
      if (st.includes('strong') || st.includes('good') || st.includes('clear')) colorClass = 'strong';
      else if (st.includes('moderate') || st.includes('average')) colorClass = 'moderate';
      
      return `<div class="exact-compat-item">
        <div class="ec-name">${escapeHtml(c.name || c.indicator || '')}</div>
        <div class="ec-score ${colorClass}">${escapeHtml(c.status || c.score || '')}</div>
        <div class="ec-desc">${escapeHtml(c.remarks || c.description || c.reason || c.detail || '')}</div>
      </div>`;
    }).join('');
  } else if (typeof compatList === 'object' && Object.keys(compatList).length > 0) {
    compatHtml = Object.entries(compatList).map(([k, v]) => {
      let title = k.replace(/_/g, ' ');
      let val = typeof v === 'string' ? v : (v.status || v.score || '');
      let desc = typeof v === 'object' ? (v.description || v.reason || '') : '';
      let colorClass = 'review';
      let st = val.toLowerCase();
      if (st.includes('strong') || st.includes('good') || st.includes('clear')) colorClass = 'strong';
      else if (st.includes('moderate') || st.includes('average')) colorClass = 'moderate';
      return `<div class="exact-compat-item">
        <div class="ec-name">${escapeHtml(title)}</div>
        <div class="ec-score ${colorClass}">${escapeHtml(val)}</div>
        <div class="ec-desc">${escapeHtml(desc)}</div>
      </div>`;
    }).join('');
  } else {
    compatHtml = `<div>No compatibility indicators found in report.</div>`;
  }

  caseDetailRoot.innerHTML = `
    <div class="exact-match-result">
      <div class="exact-top-section">
        <button class="exact-back-btn" type="button" onclick="showPanel('consultations')">← Back</button>
        <div class="exact-header-layout">
          <div class="exact-header-info">
            <div class="exact-label">MATCH RESULT</div>
            <div class="exact-title">${escapeHtml(summary.overall_result || 'Needs Astrologer Review')}</div>
            <div class="exact-desc">${escapeHtml(summary.final_recommendation || 'This match has sensitive factors that should be reviewed by an astrologer before drawing conclusions.')}</div>
          </div>
          <div class="exact-score-circle">
            <svg viewBox="0 0 36 36" class="exact-circular-chart">
              <path class="exact-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="exact-circle" stroke-dasharray="${scorePercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="exact-score-text">
              <div class="exact-score-value">${totalScore}</div>
              <div class="exact-score-max">/ 36</div>
            </div>
          </div>
        </div>
        <div class="exact-tabs">
          <button class="exact-tab-btn" onclick="switchExactTab('system-analysis', this)">System Analysis</button>
          <button class="exact-tab-btn active" onclick="switchExactTab('charts-positions', this)">Charts & Positions</button>
        </div>
      </div>

      <div class="exact-bottom-section">
        <div id="exact-tab-system-analysis" class="exact-tab-content" style="display:none;">
          <div class="exact-participants">
            <div class="exact-pc-card">
              <div class="exact-pc-title">Boy: ${escapeHtml(boy.name || 'ritesh')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>${escapeHtml(bLagna.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>${escapeHtml(bMoon.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>${escapeHtml(bNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>${escapeHtml(boy.birth_place || boy.place_of_birth || '-')}</span></div>
            </div>
            <div class="exact-pc-card">
              <div class="exact-pc-title">Girl: ${escapeHtml(girl.name || 'sohani')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>${escapeHtml(gLagna.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>${escapeHtml(gMoon.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>${escapeHtml(gNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>${escapeHtml(girl.birth_place || girl.place_of_birth || '-')}</span></div>
            </div>
          </div>
          <div class="exact-koota-section">
            <h3>8 Koota Breakdown</h3>
            <div class="exact-koota-list">${kootasHtml}</div>
          </div>
          <div class="exact-dosha-section">
            <h3>Dosha Analysis</h3>
            <div class="exact-dosha-list">${doshasHtml}</div>
          </div>
        </div>

        <div id="exact-tab-charts-positions" class="exact-tab-content active">
          
          <div class="exact-file-header">
            <h2>Marriage Compatibility Case File</h2>
            <p>This dossier is auto-generated for faster review. Final judgement should be made by the astrologer with context, consent, health, values, and practical compatibility.</p>
          </div>

          <div class="exact-participants charts-info-cards">
            <div class="exact-pc-card info-table-card">
              <div class="exact-pc-title">Boy Information</div>
              <div class="info-table-row"><span>Name</span><span>${escapeHtml(boy.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>${escapeHtml(boy.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>${escapeHtml(boy.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>${escapeHtml(boy.birth_place || boy.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>${escapeHtml(String(boy.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>${escapeHtml(boy.birth_time_accuracy || boy.time_accuracy || '-')}</span></div>
            </div>
            <div class="exact-pc-card info-table-card">
              <div class="exact-pc-title">Girl Information</div>
              <div class="info-table-row"><span>Name</span><span>${escapeHtml(girl.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>${escapeHtml(girl.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>${escapeHtml(girl.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>${escapeHtml(girl.birth_place || girl.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>${escapeHtml(String(girl.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>${escapeHtml(girl.birth_time_accuracy || girl.time_accuracy || '-')}</span></div>
            </div>
          </div>

          ${chartPairs.map((pair, idx) => `
            <div class="exact-chart-section">
              <h3>${escapeHtml(pair.title || '')}</h3>
              <p>${escapeHtml(pair.desc || '')}</p>
              <div class="exact-charts-grid">
                <div class="exact-chart-card">
                  <div class="chart-gender-label male">♂ BOY</div>
                  <div class="chart-pill-row">
                    ${idx === 0 ? `<span class="chart-pill"><strong>Lagna:</strong> ${escapeHtml(bLagna.sign || '-')}</span>
                    <span class="chart-pill"><strong>Moon:</strong> ${escapeHtml(bMoon.sign || '-')}, ${escapeHtml(bNak)}</span>
                    <span class="chart-pill"><strong>7th:</strong> Gemini · Lord Mercury</span>` : ''}
                    ${idx === 1 ? `<span class="chart-pill"><strong>Lagna:</strong> Leo</span>` : ''}
                    ${idx === 2 ? `<span class="chart-pill"><strong>Moon:</strong> ${escapeHtml(bMoon.sign || '-')}</span>` : ''}
                  </div>
                  <div class="chart-canvas-container">
                    <canvas id="match-boy-chart-${caseId}-${idx}"></canvas>
                  </div>
                </div>
                <div class="exact-chart-card">
                  <div class="chart-gender-label female">♀ GIRL</div>
                  <div class="chart-pill-row">
                    ${idx === 0 ? `<span class="chart-pill"><strong>Lagna:</strong> ${escapeHtml(gLagna.sign || '-')}</span>
                    <span class="chart-pill"><strong>Moon:</strong> ${escapeHtml(gMoon.sign || '-')}, ${escapeHtml(gNak)}</span>
                    <span class="chart-pill"><strong>7th:</strong> Libra · Lord Venus</span>` : ''}
                    ${idx === 1 ? `<span class="chart-pill"><strong>Lagna:</strong> Taurus</span>` : ''}
                    ${idx === 2 ? `<span class="chart-pill"><strong>Moon:</strong> ${escapeHtml(gMoon.sign || '-')}</span>` : ''}
                  </div>
                  <div class="chart-canvas-container">
                    <canvas id="match-girl-chart-${caseId}-${idx}"></canvas>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}

          <div class="exact-dasha-section">
            <h3>Vimshottari Dasha</h3>
            <p>5-level drill-down: Mahadasha → Antardasha → Pratyantardasha → Sookshma → Prana</p>
            <div class="dasha-widget-grid admin-match-dashas exact-dashas-grid">
              <div style="min-width: 0;">
                <h4>Boy — Vimshottari Dasha</h4>
                <p>120-year cycle · 5 levels</p>
                <div id="match-dasha-boy-${escapeHtml(caseId)}"></div>
              </div>
              <div style="min-width: 0;">
                <h4>Girl — Vimshottari Dasha</h4>
                <p>120-year cycle · 5 levels</p>
                <div id="match-dasha-girl-${escapeHtml(caseId)}"></div>
              </div>
            </div>
          </div>

          <div class="exact-position-section">
            <h3>Planetary Position Table</h3>
            <div class="exact-position-grid">
              <div class="exact-pos-card">
                <h4>Boy Positions</h4>
                ${matchPositionTable('', bPos)}
              </div>
              <div class="exact-pos-card">
                <h4>Girl Positions</h4>
                ${matchPositionTable('', gPos)}
              </div>
            </div>
          </div>
          
          <div class="exact-koota-section">
            <h3>Detailed Guna Milan</h3>
            <div class="exact-koota-list">${kootasHtml}</div>
          </div>

          <div class="exact-dosha-section">
            <h3>Detailed Dosha Analysis</h3>
            <div class="exact-dosha-list">${doshasHtml}</div>
          </div>

          <div class="exact-extra-section">
            <h3>Marriage House, Karakas &amp; Navamsa</h3>
            ${(Object.keys(boySeventh).length === 0 && Object.keys(girlSeventh).length === 0 && Object.keys(boyKarakas).length === 0) ? `
              <div class="debug-inspector">
                <strong>⚠ Marriage House, Karakas &amp; Navamsa data not found in this report.</strong><br>
                <small>Available dossier keys: <code>${Object.keys(dossier).join(', ') || '(empty dossier)'}</code></small>
              </div>
            ` : ''}
            <div class="exact-extra-grid">
              <div class="exact-extra-card">
                <h4>Boy 7th House</h4>
                ${buildInfoRows(boySeventh)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl 7th House</h4>
                ${buildInfoRows(girlSeventh)}
              </div>
              <div class="exact-extra-card">
                <h4>Boy Karakas</h4>
                ${buildInfoRows(boyKarakas)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl Karakas</h4>
                ${buildInfoRows(girlKarakas)}
              </div>
              <div class="exact-extra-card">
                <h4>Boy Navamsa</h4>
                ${buildInfoRows(boyNavamsa)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl Navamsa</h4>
                ${buildInfoRows(girlNavamsa)}
              </div>
            </div>
          </div>

          <div class="exact-extra-section">
            <h3>Compatibility Indicators</h3>
            <div class="exact-compat-grid">
              ${compatHtml}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    chartPairs.forEach((pair, idx) => {
      if (pair.boy?.chart) new KundaliChart(document.getElementById(`match-boy-chart-${caseId}-${idx}`), pair.boy.chart, { responsive: true });
      if (pair.girl?.chart) new KundaliChart(document.getElementById(`match-girl-chart-${caseId}-${idx}`), pair.girl.chart, { responsive: true });
    });
    
    const boyDasha = document.getElementById(`match-dasha-boy-${caseId}`);
    const girlDasha = document.getElementById(`match-dasha-girl-${caseId}`);
    const boyDashaData = report?.charts?.boy?.dashas || boy?.dashas || dossier?.dashas?.boy || null;
    const girlDashaData = report?.charts?.girl?.dashas || girl?.dashas || dossier?.dashas?.girl || null;
    if (boyDasha && boyDashaData) new DashaWidget(boyDasha, boyDashaData, { personLabel: 'Boy' }).render();
    else if (boyDasha) boyDasha.innerHTML = '<div class="dasha-widget-empty">Dasha data not available.</div>';
    if (girlDasha && girlDashaData) new DashaWidget(girlDasha, girlDashaData, { personLabel: 'Girl' }).render();
    else if (girlDasha) girlDasha.innerHTML = '<div class="dasha-widget-empty">Dasha data not available.</div>';
  }, 50);
}




window.switchExactTab = function(tabId, btn) {
  document.querySelectorAll(".exact-tab-btn").forEach(b => b.classList.remove("active"));
  if(btn) btn.classList.add("active");
  document.querySelectorAll(".exact-tab-content").forEach(el => el.style.display = "none");
  document.getElementById("exact-tab-" + tabId).style.display = "block";
};

function mergeCaseDetail(cachedItem, detailItem) {
  if (!detailItem) return cachedItem;
  return {
    ...(cachedItem || {}),
    ...detailItem,
    user: { ...(cachedItem?.user || {}), ...(detailItem.user || {}) },
    consultation: { ...(cachedItem?.consultation || {}), ...(detailItem.consultation || {}) },
    astrology_snapshot: detailItem.astrology_snapshot || detailItem.astrological_snapshot || detailItem.chart_snapshot || cachedItem?.astrology_snapshot || cachedItem?.astrological_snapshot || cachedItem?.chart_snapshot,
  };
}

function renderCaseDetail(item) {
  if (!item) {
    caseDetailRoot.innerHTML = '<div class="empty">Case details were not found.</div>';
    return;
  }

  const caseId = item.case_id || item.id;
  const model = getCaseAstroModel(item);
  if (item.source_type === "matchmaking" || item.chart_type === "matchmaking" || model.matchReport) {
    renderMatchmakingCaseDetail(item);
    return;
  }

  const user = item.user || {};
  const consultation = item.consultation || {};
  const status = item.case_status || item.status || "pending";
  const name = user.full_name || item.name || item.user_name || "-";
  const email = user.email || item.email || "-";
  const phone = user.mobile_number || item.phone || "-";
  const sourceLabel = item.source_type === "direct_consultation" ? "Direct consultation" : (item.source_type || "Prashna");
  const question = consultation.question || item.question || model.question?.question || "-";
  const activeChartTopic = inferChartTopic(question, item.chart_type || model.snapshot?.chart_type);
  const notes = consultation.additional_message || item.additional_message || item.user_notes || "";
  const place = user.place || user.place_of_birth || item.place_of_birth || model.question?.place || "-";
  const birthDate = user.date_of_birth || item.date_of_birth || model.question?.date || "-";
  const birthTime = user.time_of_birth || item.time_of_birth || model.question?.time || "-";
  const statusOptions = tabs.filter((tab) => tab.status).map((tab) => {
    const value = tab.status;
    return `<option value="${escapeHtml(value)}" ${value === status ? "selected" : ""}>${escapeHtml(tab.label)}</option>`;
  }).join("");
  const facts = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Source", sourceLabel],
    ["Birth / Prashna date", birthDate],
    ["Birth / Prashna time", birthTime],
    ["Place", place],
  ];
  window.caseChartData = window.caseChartData || {};
  window.caseChartData[caseId] = model.chartEntries;

  caseDetailRoot.innerHTML = `
    <div class="kundali-result-shell">
      <div class="kundali-topline">
        <button class="ghost-btn" type="button" onclick="showPanel('consultations')">← Back</button>
        <div class="kundali-brand-title">
          <span>CONSULTATION CASE</span>
          <strong>${escapeHtml(name)}</strong>
        </div>
        <button class="primary-btn" type="button" onclick="updateCaseDetail('${escapeHtml(caseId)}')">Save Updates</button>
      </div>

      <div class="kundali-facts">
        ${facts.map(([label, value]) => detailFact(label, value)).join("")}
      </div>

      <section class="kundali-panel case-question-panel">
        <p class="panel-kicker">User Question</p>
        <h3>${escapeHtml(question)}</h3>
        ${notes ? `<div class="question"><strong>User Notes</strong><br>${escapeHtml(notes)}</div>` : ""}
      </section>

      <div class="kundali-work-grid">
        ${renderChartWorksheet(caseId, model.chartEntries, activeChartTopic)}
        ${renderKPPanel(caseId, model)}
        <section class="kundali-panel dasha-position-panel">
          <p class="panel-kicker">Timing</p>
          <h3 class="positions-title">Dasha</h3>
          <div id="case-dasha-${escapeHtml(caseId)}" class="case-dasha-host">${model.dashas ? "" : '<div class="empty small-empty">Dasha data not available.</div>'}</div>
        </section>
        ${renderTransitPanel(caseId, model)}
      </div>

      <section class="kundali-panel positions-wide-panel">
        <p class="panel-kicker">Planet Positions</p>
        <h3>Planetary Position Table</h3>
        ${compactPositionsTable(model.planets, "natal")}
      </section>

      <div class="admin-detail-panel">
        <section class="kundali-panel">
          <p class="panel-kicker">Admin</p>
          <h3>Case Controls</h3>
          <div class="admin-fields detail-actions-form">
            <select id="detail-status-${escapeHtml(caseId)}">${statusOptions}</select>
            <input id="detail-meeting-${escapeHtml(caseId)}" placeholder="Google Meet / Zoom link" value="${escapeHtml(item.meeting_link || "")}">
            <input id="detail-schedule-${escapeHtml(caseId)}" placeholder="Scheduled date/time" value="${escapeHtml(item.scheduled_at || "")}">
            <input id="detail-assignee-${escapeHtml(caseId)}" placeholder="Assigned astrologer" value="${escapeHtml(item.assigned_astrologer || "")}">
            <textarea id="detail-notes-${escapeHtml(caseId)}" placeholder="Admin notes">${escapeHtml(item.admin_notes || "")}</textarea>
          </div>
          <div class="actions">
            <button class="primary" type="button" onclick="updateCaseDetail('${escapeHtml(caseId)}')">Save Case</button>
            <button class="done" type="button" onclick="closeCaseDetail('${escapeHtml(caseId)}')">Confirm & Close Case</button>
          </div>
        </section>
      </div>
    </div>
  `;

  setTimeout(() => {
    renderVisibleCaseCharts(caseId);
    const transitCanvas = document.getElementById(`case-transit-chart-${caseId}`);
    if (transitCanvas && model.transitChart) {
      new KundaliChart(transitCanvas, model.transitChart, { responsive: true });
    }
    const kpCanvas = document.getElementById(`case-kp-chart-${caseId}`);
    if (kpCanvas && model.mainChart) {
      new KundaliChart(kpCanvas, model.mainChart, { responsive: true });
    }
    const dashaHost = document.getElementById(`case-dasha-${caseId}`);
    if (dashaHost && model.dashas) {
      new DashaWidget(dashaHost, model.dashas, { personLabel: "Native" }).render();
    }
  }, 50);
}

window.openCaseDetail = async function openCaseDetail(caseId) {
  showPanel("case-detail");
  caseDetailRoot.innerHTML = '<div class="empty">Loading case details...</div>';
  const cachedItem = window.caseItems?.[caseId];

  try {
    const res = await adminFetch(`/api/admin/consultation-cases/${encodeURIComponent(caseId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load case details.");
    const detailItem = mergeCaseDetail(cachedItem, data.case);
    window.caseItems = window.caseItems || {};
    window.caseItems[caseId] = detailItem;
    renderCaseDetail(detailItem);
  } catch (err) {
    if (cachedItem) {
      renderCaseDetail(cachedItem);
      return;
    }
    caseDetailRoot.innerHTML = `<div class="empty">Failed to load case details: ${escapeHtml(err.message)}</div>`;
  }
};



window.updateCaseDetail = async function updateCaseDetail(caseId) {
  const payload = {
    case_status: document.getElementById(`detail-status-${caseId}`)?.value,
    meeting_link: document.getElementById(`detail-meeting-${caseId}`)?.value.trim() || null,
    scheduled_at: document.getElementById(`detail-schedule-${caseId}`)?.value.trim() || null,
    assigned_astrologer: document.getElementById(`detail-assignee-${caseId}`)?.value.trim() || null,
    admin_notes: document.getElementById(`detail-notes-${caseId}`)?.value.trim() || null,
  };
  try {
    const res = await adminFetch(`/api/admin/consultation-cases/${encodeURIComponent(caseId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update case.");
    const detailItem = mergeCaseDetail(window.caseItems?.[caseId], data.case);
    window.caseItems = window.caseItems || {};
    window.caseItems[caseId] = detailItem;
    renderCaseDetail(detailItem);
    return true;
  } catch (err) {
    alert(err.message);
    return false;
  }
};

window.closeCaseDetail = async function closeCaseDetail(caseId) {
  if (!confirm("Confirm and close this consultation case? This marks it completed and removes it from the active queue.")) return;
  const statusEl = document.getElementById(`detail-status-${caseId}`);
  if (statusEl) statusEl.value = "completed";
  const saved = await updateCaseDetail(caseId);
  if (!saved) return;
  showPanel("consultations");
  loadRequests();
};

async function loadMatchRequests() {
  matchRequestsEl.innerHTML = '<div class="empty">Loading matchmaking reports...</div>';
  matchStatusLine.textContent = "Loading...";
  try {
    const res = await adminFetch("/api/admin/matchmaking/requests");
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load matchmaking reports.");
    renderMatchRequests(data.requests || []);
    matchStatusLine.textContent = `${data.requests?.length || 0} matchmaking report(s).`;
  } catch (err) {
    matchRequestsEl.innerHTML = `<div class="empty">${escapeHtml(err.message)}<br><br>Check API URL, admin token, CORS, and whether the matchmaking SQL migration is applied.</div>`;
    matchStatusLine.textContent = "Load failed.";
  }
}

function renderMatchRequests(requests) {
  if (!requests.length) {
    matchRequestsEl.innerHTML = '<div class="empty">No matchmaking reports yet.</div>';
    return;
  }

  window.matchReports = {};
  matchRequestsEl.innerHTML = requests.map((item) => {
    if (item.report_data) window.matchReports[item.id] = item;
    const submitted = item.created_at ? new Date(item.created_at).toLocaleString() : "-";
    return `
      <article class="request-card match-report-card" onclick="openMatchReportDetail('${escapeHtml(item.id)}')">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(item.boy_name)} + ${escapeHtml(item.girl_name)}</h3>
            <div class="small-muted">${escapeHtml(submitted)}</div>
          </div>
          <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <div class="score-box">
          <strong>${escapeHtml(item.guna_score)}/${escapeHtml(item.max_score || 36)}</strong>
          <span>${escapeHtml(item.result_category)}</span>
        </div>
        <div class="meta">
          <div><strong>Report ID:</strong> ${escapeHtml(item.id)}</div>
          <div><strong>User ID:</strong> ${escapeHtml(item.user_id || "-")}</div>
          <div><strong>Status:</strong> ${escapeHtml(item.status || "-")}</div>
        </div>
        <div class="question" style="margin-top: 15px;">
          <strong>Open full match details</strong><br>
          Click to review all boy/girl charts, dashas, planetary positions, Guna Milan, Doshas, and system analysis.
        </div>
      </article>
    `;
  }).join("");
}

window.openMatchReportDetail = function openMatchReportDetail(reportId) {
  const item = window.matchReports?.[reportId];
  if (!item?.report_data) return;
  const report = parseJsonDeep(item.report_data);
  const boy = report?.participants?.boy || {};
  const girl = report?.participants?.girl || {};
  showPanel("case-detail");
  renderMatchmakingCaseDetail({
    id: item.id,
    case_id: item.id,
    source_type: "matchmaking",
    chart_type: "matchmaking",
    status: item.status || "calculated",
    case_status: item.status || "calculated",
    created_at: item.created_at,
    name: `${boy.name || item.boy_name || "Boy"} & ${girl.name || item.girl_name || "Girl"}`,
    email: "-",
    phone: "-",
    topic: "Marriage Match",
    question: "Generated matchmaking report review",
    user: {
      full_name: `${boy.name || item.boy_name || "Boy"} & ${girl.name || item.girl_name || "Girl"}`,
      email: "-",
      mobile_number: "-",
      place: `${boy.birth_place || ""} / ${girl.birth_place || ""}`,
    },
    consultation: {
      question: "Generated matchmaking report review",
      additional_message: "Review the complete matchmaking report.",
      consultation_mode: "matchmaking_report_review",
    },
    astrology_snapshot: {
      chart_type: "matchmaking",
      chart: { meta: { chart_type: "matchmaking", match_id: item.id } },
      source_result: { type: "matchmaking", match_id: item.id, report },
      question_context: { match_id: item.id },
    },
  });
};

window.updateRequest = async function updateRequest(id, status) {
  const meeting = document.getElementById(`meeting-${id}`)?.value.trim() || "";
  const schedule = document.getElementById(`schedule-${id}`)?.value.trim() || "";
  const notes = document.getElementById(`notes-${id}`)?.value.trim() || "";
  const payload = { case_status: status, meeting_link: meeting, scheduled_at: schedule, admin_notes: notes };
  try {
    const res = await adminFetch(`/api/admin/consultation-cases/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update request.");
    if (data.promoted_case) {
      alert(`Waiting queue moved: ${data.promoted_case.name || data.promoted_case.case_id} is now pending.`);
    }
    loadRequests();
  } catch (err) {
    alert(err.message);
  }
};

async function loadDashboard() {
  dashboardMetricsEl.innerHTML = '<div class="empty">Loading metrics...</div>';
  try {
    const res = await adminFetch("/api/admin/dashboard/metrics");
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load metrics.");
    
    dashboardMetricsEl.innerHTML = `
      <div class="metric-card">
        <span class="label">Total Revenue</span>
        <span class="value">${escapeHtml(data.revenue_generated)}</span>
      </div>
      <div class="metric-card">
        <span class="label">Total Signups</span>
        <span class="value">${escapeHtml(data.total_signups)}</span>
      </div>
      <div class="metric-card">
        <span class="label">Daily Active Users</span>
        <span class="value">${escapeHtml(data.dau)}</span>
        <span class="sub-value">Current active: ${escapeHtml(data.active_users)}</span>
      </div>
      <div class="metric-card">
        <span class="label">Total Consultations</span>
        <span class="value">${escapeHtml(data.consultation_applications)}</span>
      </div>
      <div class="metric-card">
        <span class="label">Matchmaking Requests</span>
        <span class="value">${escapeHtml(data.matchmaking_applications)}</span>
      </div>
      <div class="metric-card" style="grid-column: 1 / -1; max-width: 500px;">
        <span class="label">Top Domains</span>
        <div class="domains-list">
          ${(data.top_domains || []).map(d => `
            <div class="domain-item">
              <div>${escapeHtml(d.name)}</div>
              <div>${escapeHtml(d.percentage)}%</div>
            </div>
            <div class="domain-bar-bg"><div class="domain-bar-fill" style="width: ${escapeHtml(d.percentage)}%"></div></div>
          `).join("")}
        </div>
      </div>
    `;
  } catch (err) {
    dashboardMetricsEl.innerHTML = `<div class="empty">Failed to load dashboard: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadAstrologers() {
  astroRequestsEl.innerHTML = '<div class="empty">Loading applications...</div>';
  astroStatusLine.textContent = "Loading...";
  try {
    const res = await adminFetch("/api/community/admin/astrologers/applications");
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load applications.");
    
    if (!data.applications || !data.applications.length) {
      astroRequestsEl.innerHTML = '<div class="empty">No applications found.</div>';
      astroStatusLine.textContent = "Ready.";
      return;
    }
    
    astroRequestsEl.innerHTML = data.applications.map((item) => {
      const submitted = item.created_at ? new Date(item.created_at).toLocaleString() : "-";
      return `
        <article class="request-card">
          <div class="card-top">
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <div class="small-muted">Applied: ${escapeHtml(submitted)}</div>
            </div>
            <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
          </div>
          <div class="meta">
            <div><strong>Experience:</strong> ${escapeHtml(item.experience)}</div>
            <div><strong>Expertise:</strong> ${escapeHtml(item.expertise)}</div>
            <div><strong>Email:</strong> ${escapeHtml(item.email)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(item.phone)}</div>
            <div><strong>Location:</strong> ${escapeHtml(item.state || "-")}, ${escapeHtml(item.country || "-")}</div>
            <div><strong>Systems:</strong> ${escapeHtml((item.systems || []).join(", ") || "-")}</div>
          </div>
          <div class="question">
            <strong>Bio / Details</strong><br>
            ${escapeHtml(item.bio || "-")}
          </div>
          ${item.additional_information ? `
          <div class="question" style="margin-top: 10px;">
            <strong>Additional Information</strong><br>
            ${escapeHtml(item.additional_information)}
          </div>
          ` : ""}
          ${(item.proofs && item.proofs.length) ? `
          <div class="question" style="margin-top: 10px;">
            <strong>Proofs & Documents</strong><br>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;">
              ${item.proofs.map(p => {
                const isImg = p.mime_type && p.mime_type.startsWith('image/');
                return isImg ? 
                  `<a href="${escapeHtml(p.url)}" target="_blank" style="display:block; border:1px solid #333; padding:4px; border-radius:4px;"><img src="${escapeHtml(p.url)}" style="max-width:120px; max-height:120px; object-fit:cover; display:block;" alt="${escapeHtml(p.type)}"><div style="font-size:10px; text-align:center; margin-top:4px; color:#aaa;">${escapeHtml(p.type)}</div></a>` : 
                  `<a href="${escapeHtml(p.url)}" target="_blank" style="display:block; padding:8px; border:1px solid #333; border-radius:4px; color:#fff; text-decoration:none; background:#222;">📄 ${escapeHtml(p.type)}</a>`;
              }).join("")}
            </div>
          </div>
          ` : ""}
          <div class="actions">
            ${item.status === 'pending' || item.status === 'submitted' ? `
              <button class="primary" onclick="updateAstrologer('${escapeHtml(item.id)}', 'approved')">Approve</button>
              <button class="danger" onclick="updateAstrologer('${escapeHtml(item.id)}', 'rejected')">Reject</button>
            ` : `
              <button class="ghost-btn" onclick="updateAstrologer('${escapeHtml(item.id)}', 'pending')">Revert to Pending</button>
            `}
          </div>
        </article>
      `;
    }).join("");
    astroStatusLine.textContent = `${data.applications.length} applications found.`;
  } catch (err) {
    astroRequestsEl.innerHTML = `<div class="empty">Failed to load astrologers: ${escapeHtml(err.message)}</div>`;
    astroStatusLine.textContent = "Load failed.";
  }
}

window.updateAstrologer = async function updateAstrologer(id, status) {
  try {
    const res = await adminFetch(`/api/community/admin/astrologers/applications/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update application.");
    loadAstrologers();
  } catch (err) {
    alert(err.message);
  }
};

document.querySelectorAll(".nav-item").forEach((btn) => btn.addEventListener("click", () => {
  setSidebarCollapsed(false);
  showPanel(btn.dataset.panel);
}));
sidebarToggle?.addEventListener("click", () => setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed")));
document.getElementById("settings-btn").addEventListener("click", () => showPanel("settings"));
document.getElementById("refresh-btn").addEventListener("click", loadRequests);
document.getElementById("refresh-matches-btn").addEventListener("click", loadMatchRequests);
document.getElementById("refresh-astro-btn")?.addEventListener("click", loadAstrologers);
document.getElementById("save-settings").addEventListener("click", saveSettings);
document.getElementById("clear-settings").addEventListener("click", () => {
  localStorage.removeItem("kundali_admin_token");
  localStorage.removeItem("kundali_admin_api_base");
  syncSettingsUI();
  showPanel("settings");
});

communityForm?.addEventListener("submit", broadcastCommunityMessage);
clearCommunityMessageBtn?.addEventListener("click", clearCommunityComposer);
communityImageInput?.addEventListener("change", (event) => setCommunityImage(event.target.files?.[0] || null));
syncSettingsUI();
renderTabs();
loadDashboard(); // Load dashboard on init instead of requests

window.toggleDossier = function(id) {
  const container = document.getElementById(`dossier-container-${id}`);
  if (!container) return;
  
  // Ensure it's visible if it had a hidden class
  container.classList.remove("hidden");
  if (container.innerHTML.trim() !== "") return; // already rendered


  try {
    const raw = window.snapshots[id];
    let snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof snapshot === 'string') snapshot = JSON.parse(snapshot);

    if (!snapshot || !snapshot.report) {
      container.innerHTML = "<div>No valid astrological dossier available.</div>";
      return;
    }

    const isMatchmaking = snapshot.type === "matchmaking";
    const report = snapshot.report;
    
    let html = "";
    
    if (isMatchmaking) {
      const boy = report.charts?.boy;
      const girl = report.charts?.girl;
      
      html += `
        <h4 style="margin:0 0 8px;font-size:1rem;">Matchmaking Dossier</h4>
        <p style="margin:0 0 14px;font-size:0.82rem;color:#888;">
          <strong>Guna Milan:</strong> ${escapeHtml(report.ashtakoota?.total_score || "-")} / ${escapeHtml(report.ashtakoota?.max_score || "-")}
          &nbsp;·&nbsp; <strong>Result:</strong> ${escapeHtml(report.summary?.overall_result || "-")}
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex-wrap:wrap;">
          <div>
            <p style="font-weight:700;margin:0 0 6px;font-size:0.85rem;">♂ Boy's Lagna Chart</p>
            <canvas id="canvas-boy-lagna-${id}" style="width:100%;aspect-ratio:1/1;"></canvas>
          </div>
          <div>
            <p style="font-weight:700;margin:0 0 6px;font-size:0.85rem;">♀ Girl's Lagna Chart</p>
            <canvas id="canvas-girl-lagna-${id}" style="width:100%;aspect-ratio:1/1;"></canvas>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;">
          <div id="admin-dasha-boy-${id}"></div>
          <div id="admin-dasha-girl-${id}"></div>
        </div>
        <div style="margin-top:20px;">
          <h5 style="margin:0 0 10px;font-size:0.9rem;">Planetary Positions</h5>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex-wrap:wrap;font-size:0.8rem;">
            <div>
              <strong>Boy</strong>
              <table style="width:100%;border-collapse:collapse;margin-top:5px;background:#1e1e1e;color:#eee">
                <thead style="background:#2a2a2a;text-align:left;"><tr><th style="padding:4px;">Planet</th><th style="padding:4px;">Sign</th><th style="padding:4px;">House</th><th style="padding:4px;">Nakshatra</th></tr></thead>
                <tbody>
                  ${(report.dossier?.planetary_positions?.boy || []).map(p => `<tr><td style="padding:4px;">${escapeHtml(p.planet || p.name)}</td><td style="padding:4px;">${escapeHtml(p.sign)}</td><td style="padding:4px;">${escapeHtml(p.house)}</td><td style="padding:4px;">${escapeHtml(p.nakshatra)} P${escapeHtml(p.pada)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div>
              <strong>Girl</strong>
              <table style="width:100%;border-collapse:collapse;margin-top:5px;background:#1e1e1e;color:#eee">
                <thead style="background:#2a2a2a;text-align:left;"><tr><th style="padding:4px;">Planet</th><th style="padding:4px;">Sign</th><th style="padding:4px;">House</th><th style="padding:4px;">Nakshatra</th></tr></thead>
                <tbody>
                  ${(report.dossier?.planetary_positions?.girl || []).map(p => `<tr><td style="padding:4px;">${escapeHtml(p.planet || p.name)}</td><td style="padding:4px;">${escapeHtml(p.sign)}</td><td style="padding:4px;">${escapeHtml(p.house)}</td><td style="padding:4px;">${escapeHtml(p.nakshatra)} P${escapeHtml(p.pada)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      container.innerHTML = html;
      
      setTimeout(() => {
        if (boy && document.getElementById(`canvas-boy-lagna-${id}`)) new KundaliChart(document.getElementById(`canvas-boy-lagna-${id}`), boy);
        if (girl && document.getElementById(`canvas-girl-lagna-${id}`)) new KundaliChart(document.getElementById(`canvas-girl-lagna-${id}`), girl);
        const boyDashaEl = document.getElementById(`admin-dasha-boy-${id}`);
        const girlDashaEl = document.getElementById(`admin-dasha-girl-${id}`);
        if (boyDashaEl) new DashaWidget(boyDashaEl, boy?.dashas, { personLabel: 'Boy' }).render();
        if (girlDashaEl) new DashaWidget(girlDashaEl, girl?.dashas, { personLabel: 'Girl' }).render();
      }, 100);
      
    } else {
      // Consultation Single Chart Dossier
      const person = report.charts?.person || report.charts?.main;
      
      html += `
        <h4 style="margin:0 0 8px;font-size:1rem;">Consultation Dossier</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex-wrap:wrap;">
          <div>
            <p style="font-weight:700;margin:0 0 6px;font-size:0.85rem;">Lagna Chart</p>
            <canvas id="canvas-person-lagna-${id}" style="width:100%;max-width:350px;aspect-ratio:1/1;"></canvas>
          </div>
          <div id="admin-dasha-person-${id}"></div>
        </div>
        <div style="margin-top:20px;">
          <h5 style="margin:0 0 10px;font-size:0.9rem;">Planetary Positions</h5>
          <table style="width:100%;max-width:600px;border-collapse:collapse;margin-top:5px;background:rgba(0,0,0,0.2);color:inherit;border:1px solid rgba(255,255,255,0.1); border-radius:8px; overflow:hidden;">
            <thead style="background:rgba(255,255,255,0.05);text-align:left;"><tr><th style="padding:8px;">Planet</th><th style="padding:8px;">Sign</th><th style="padding:8px;">House</th><th style="padding:8px;">Nakshatra</th></tr></thead>
            <tbody>
              ${(report.dossier?.planetary_positions?.person || report.dossier?.planetary_positions?.main || []).map(p => `<tr><td style="padding:8px;border-top:1px solid rgba(255,255,255,0.05);">${escapeHtml(p.planet || p.name)}</td><td style="padding:8px;border-top:1px solid rgba(255,255,255,0.05);">${escapeHtml(p.sign)}</td><td style="padding:8px;border-top:1px solid rgba(255,255,255,0.05);">${escapeHtml(p.house)}</td><td style="padding:8px;border-top:1px solid rgba(255,255,255,0.05);">${escapeHtml(p.nakshatra)} P${escapeHtml(p.pada)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      container.innerHTML = html;
      
      setTimeout(() => {
        if (person && document.getElementById(`canvas-person-lagna-${id}`)) {
          new KundaliChart(document.getElementById(`canvas-person-lagna-${id}`), person);
        }
        const personDashaEl = document.getElementById(`admin-dasha-person-${id}`);
        if (personDashaEl) new DashaWidget(personDashaEl, person?.dashas, { personLabel: 'Native' }).render();
      }, 100);
    }
  } catch (err) {
    container.innerHTML = `<div>Error rendering dossier: ${escapeHtml(err.message)}</div>`;
  }
};

window.updatePaidRequest = async function(id, action) {
  try {
    const url = `/api/consultation/${id}/${action}`;
    const payload = {};
    if (action === 'answer') {
      const answerText = document.getElementById(`answer-${id}`).value.trim();
      if (!answerText) {
        alert("Please enter an answer before completing.");
        return;
      }
      payload.answer = answerText;
    }

    const res = await adminFetch(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Update failed");
    loadRequests();
  } catch (err) {
    alert(err.message);
  }
};

window.toggleDossier = function(id) {
  const container = document.getElementById(`dossier-container-${id}`);
  if (!container) return;
  
  // Toggle visibility
  if (container.classList.contains("hidden")) {
    container.classList.remove("hidden");
  } else {
    container.classList.add("hidden");
    return; // Don't re-render if we are just collapsing
  }

  const chartsContainer = document.getElementById(`charts-container-${id}`);
  if (!chartsContainer || chartsContainer.innerHTML.trim() !== "") return; // already rendered

  try {
    const raw = window.snapshots[id];
    let snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!snapshot) {
      chartsContainer.innerHTML = "<p>No astrological snapshot available.</p>";
      return;
    }

    // Standard consultation cases store an AstrologySnapshot. Legacy paid records may store the chart directly.
    const chart = snapshot.chart || snapshot.report?.charts?.person || snapshot.report?.charts?.main || snapshot;
    let chartData = chart.signs || chart.divisional_charts?.D1 || chart;
    let dashaData = snapshot.dashas || chart.dashas || snapshot.report?.dossier?.dashas?.person || snapshot.report?.dossier?.dashas?.main;
    let planetaryData = snapshot.planetary_positions || chart.planets || snapshot.report?.dossier?.planetary_positions?.person || snapshot.report?.dossier?.planetary_positions?.main;
    const interpretation = snapshot.interpretation || chart.interpretation;

    let html = `
      <h4 style="margin:0 0 8px;font-size:1rem;">Consultation Dossier</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex-wrap:wrap;">
        <div>
          <p style="font-weight:700;margin:0 0 6px;font-size:0.85rem;">Lagna Chart</p>
          <canvas id="canvas-lagna-${id}" style="width:100%;max-width:350px;aspect-ratio:1/1;"></canvas>
        </div>
        <div id="admin-dasha-${id}"></div>
      </div>
    `;

    if (interpretation) {
      const text = typeof interpretation === "string" ? interpretation : (interpretation.answer?.text || interpretation.verdict?.summary || interpretation.title || "");
      if (text) {
        html += `
          <div style="margin-top:20px;">
            <h5 style="margin:0 0 10px;font-size:0.9rem;">Interpretation</h5>
            <div style="max-height:220px;overflow:auto;white-space:pre-wrap;background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;">${escapeHtml(text)}</div>
          </div>
        `;
      }
    }

    if (planetaryData && planetaryData.length > 0) {
      html += `
        <div style="margin-top:20px;">
          <h5 style="margin:0 0 10px;font-size:0.9rem;">Planetary Positions</h5>
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;background:rgba(255,255,255,0.05);">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.2);text-align:left;">
                <th style="padding:8px;">Planet</th>
                <th style="padding:8px;">Sign</th>
                <th style="padding:8px;">Degree</th>
                <th style="padding:8px;">Nakshatra</th>
              </tr>
            </thead>
            <tbody>
              ${planetaryData.map(p => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                  <td style="padding:8px;">${escapeHtml(p.planet || p.name)}</td>
                  <td style="padding:8px;">${escapeHtml(p.sign)}</td>
                  <td style="padding:8px;">${p.degree ? p.degree.toFixed(2) : (p.normDegree ? p.normDegree.toFixed(2) : (p.formatted_degree || '-'))}°</td>
                  <td style="padding:8px;">${escapeHtml(p.nakshatra || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    chartsContainer.innerHTML = html;

    // Render Chart
    const canvas = document.getElementById(`canvas-lagna-${id}`);
    if (canvas && chartData) {
      new KundaliChart(canvas, chartData, { responsive: true });
    }

    // Render Dasha
    const dashaDiv = document.getElementById(`admin-dasha-${id}`);
    if (dashaDiv) {
      if (dashaData && Object.keys(dashaData).length > 0) {
        new DashaWidget(dashaDiv, dashaData);
      } else {
        dashaDiv.innerHTML = "<p>Dasha data not available.</p>";
      }
    }
  } catch (err) {
    chartsContainer.innerHTML = `<p>Error rendering dossier: ${escapeHtml(err.message)}</p>`;
  }
};
