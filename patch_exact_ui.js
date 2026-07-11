const fs = require('fs');

const appFile = 'app.js';
let appJs = fs.readFileSync(appFile, 'utf8');

const renderMatchStart = 'function renderMatchmakingCaseDetail(item) {';
const renderMatchEnd = '  }, 50);\n}';
const startIndex = appJs.indexOf(renderMatchStart);
const endIndex = appJs.indexOf(renderMatchEnd, startIndex) + renderMatchEnd.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries.");
  process.exit(1);
}

const newRenderMatchmakingCaseDetail = `function renderMatchmakingCaseDetail(item) {
  const caseId = item.case_id || item.id;
  const consultation = item.consultation || {};
  const model = getCaseAstroModel(item);
  const report = model.matchReport || {};
  const status = item.case_status || item.status || "pending";
  const boy = report?.participants?.boy || {};
  const girl = report?.participants?.girl || {};
  const summary = report?.summary || {};
  const ashtakoota = report?.ashtakoota || {};
  const dossier = report?.dossier || {};
  const mandatory = dossier.charts_to_send?.mandatory || [];
  const chartPairs = [
    { boy: mandatory[0], girl: mandatory[1] },
    { boy: mandatory[2], girl: mandatory[3] },
    { boy: mandatory[4], girl: mandatory[5] },
    { boy: mandatory[6], girl: mandatory[7] },
  ];
  
  const bLagna = (dossier.planetary_positions?.boy || []).find(p => p.planet === 'Ascendant' || p.name === 'Ascendant')?.sign || '';
  const gLagna = (dossier.planetary_positions?.girl || []).find(p => p.planet === 'Ascendant' || p.name === 'Ascendant')?.sign || '';
  
  const bMoon = (dossier.planetary_positions?.boy || []).find(p => p.planet === 'Moon' || p.name === 'Moon');
  const gMoon = (dossier.planetary_positions?.girl || []).find(p => p.planet === 'Moon' || p.name === 'Moon');
  
  const bMoonSign = bMoon?.sign || '';
  const gMoonSign = gMoon?.sign || '';
  const bNak = (bMoon?.nakshatra ? \`\${bMoon.nakshatra}, Pada \${bMoon.pada}\` : '');
  const gNak = (gMoon?.nakshatra ? \`\${gMoon.nakshatra}, Pada \${gMoon.pada}\` : '');

  const totalScore = ashtakoota.total_score || '0';
  const scoreNum = parseFloat(totalScore);
  const scorePercent = (scoreNum / 36) * 100;

  caseDetailRoot.innerHTML = \`
    <div class="exact-match-result">
      <div class="exact-top-section">
        <button class="exact-back-btn" type="button" onclick="showPanel('consultations')">← Back</button>
        
        <div class="exact-header-layout">
          <div class="exact-header-info">
            <div class="exact-label">MATCH RESULT</div>
            <div class="exact-title">\${escapeHtml(summary.overall_result || 'Needs Astrologer Review')}</div>
            <div class="exact-desc">\${escapeHtml(summary.final_recommendation || 'This match has sensitive factors that should be reviewed by an astrologer before drawing conclusions.')}</div>
          </div>
          
          <div class="exact-score-circle">
            <svg viewBox="0 0 36 36" class="exact-circular-chart">
              <path class="exact-circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="exact-circle"
                stroke-dasharray="\${scorePercent}, 100"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="exact-score-text">
              <div class="exact-score-value">\${totalScore}</div>
              <div class="exact-score-max">/ 36</div>
            </div>
          </div>
        </div>

        <div class="exact-tabs">
          <button class="exact-tab-btn active" onclick="switchExactTab('system-analysis', this)">System Analysis</button>
          <button class="exact-tab-btn" onclick="switchExactTab('charts-positions', this)">Charts & Positions</button>
        </div>
      </div>

      <div class="exact-bottom-section">
        <div id="exact-tab-system-analysis" class="exact-tab-content active">
          <div class="exact-participants">
            <div class="exact-pc-card">
              <div class="exact-pc-title">Boy: \${escapeHtml(boy.name || 'Boy')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(bLagna || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(bMoonSign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(bNak || '-')}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>
            </div>
            <div class="exact-pc-card">
              <div class="exact-pc-title">Girl: \${escapeHtml(girl.name || 'Girl')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(gLagna || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(gMoonSign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(gNak || '-')}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>
            </div>
          </div>
          
          <div class="exact-koota-section">
            <h3>8 Koota Breakdown</h3>
            <div class="exact-koota-list">
               \${(dossier.complete_guna_milan || ashtakoota.kootas || []).map(k => {
                 let scoreVal = k.obtained ?? k.score ?? 0;
                 let scoreStr = (scoreVal === 0 || scoreVal === "0" || scoreVal === 0.0) ? "" : scoreVal;
                 let maxStr = k.maximum ?? k.max_score ?? 0;
                 
                 let badgeClass = 'badge-good';
                 let badgeText = 'GOOD';
                 
                 if(parseFloat(scoreVal) === 0) {
                   badgeClass = 'badge-concern';
                   badgeText = 'CONCERN';
                 }
                 
                 return \`<div class="exact-koota-item">
                   <div class="ek-name">\${escapeHtml(k.name || '')}</div>
                   <div class="ek-score">\${escapeHtml(scoreStr)}/\${escapeHtml(maxStr)}</div>
                   <div class="ek-badge-col"><span class="ek-badge \${badgeClass}">\${badgeText}</span></div>
                   <div class="ek-desc">\${escapeHtml(k.explanation || k.interpretation || '')}</div>
                 </div>\`;
               }).join('')}
            </div>
          </div>
        </div>

        <div id="exact-tab-charts-positions" class="exact-tab-content" style="display:none;">
          <section class="kundali-panel worksheet-panel" style="margin-bottom: 24px; background:#fff; border-radius:8px;">
            <div class="worksheet-toolbar"><div><p class="panel-kicker">Worksheet</p><h3>Boy / Girl Charts</h3></div></div>
            <div class="case-worksheet-canvas kundali-worksheet-canvas">
              \${chartPairs.map((pair, index) => \`\${renderMatchChartCard(caseId, 'boy', pair.boy, index)}\${renderMatchChartCard(caseId, 'girl', pair.girl, index)}\`).join('')}
            </div>
          </section>
          <section class="kundali-panel dasha-position-panel" style="margin-bottom: 24px; background:#fff; border-radius:8px;">
            <div class="dasha-widget-grid admin-match-dashas">
              <div id="match-dasha-boy-\${escapeHtml(caseId)}"></div>
              <div id="match-dasha-girl-\${escapeHtml(caseId)}"></div>
            </div>
          </section>
          <section class="kundali-panel reading-admin-panel" style="background:#fff; border-radius:8px;">
            <div>
              <h3>Admin Actions</h3>
              <div class="admin-fields detail-actions-form">
                <select id="detail-status-\${escapeHtml(caseId)}">\${["pending", "reviewed", "accepted", "scheduled", "in_progress", "completed", "cancelled", "rejected"].map((s) => \`<option value="\${s}" \${s === status ? "selected" : ""}>\${s.replace("_", " ")}</option>\`).join("")}</select>
                <input id="detail-meeting-\${escapeHtml(caseId)}" placeholder="Google Meet / Zoom link" value="\${escapeHtml(item.meeting_link || "")}">
                <input id="detail-schedule-\${escapeHtml(caseId)}" placeholder="Scheduled date/time" value="\${escapeHtml(item.scheduled_at || "")}">
                <input id="detail-assignee-\${escapeHtml(caseId)}" placeholder="Assigned astrologer" value="\${escapeHtml(item.assigned_astrologer || "")}">
                <textarea id="detail-notes-\${escapeHtml(caseId)}" placeholder="Private admin notes">\${escapeHtml(item.admin_notes || "")}</textarea>
              </div>
              <div class="actions"><button class="primary" type="button" onclick="updateCaseDetail('\${escapeHtml(caseId)}')">Save Case Detail</button></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  \`;

  setTimeout(() => {
    chartPairs.forEach((pair, index) => {
      if (pair.boy?.chart) new KundaliChart(document.getElementById(\`match-boy-chart-\${caseId}-\${index}\`), pair.boy.chart, { responsive: true });
      if (pair.girl?.chart) new KundaliChart(document.getElementById(\`match-girl-chart-\${caseId}-\${index}\`), pair.girl.chart, { responsive: true });
    });
    const boyDasha = document.getElementById(\`match-dasha-boy-\${caseId}\`);
    const girlDasha = document.getElementById(\`match-dasha-girl-\${caseId}\`);
    if (boyDasha) new DashaWidget(boyDasha, report?.charts?.boy?.dashas, { personLabel: 'Boy' }).render();
    if (girlDasha) new DashaWidget(girlDasha, report?.charts?.girl?.dashas, { personLabel: 'Girl' }).render();
  }, 50);
}`;

const switchTabFunc = `
window.switchExactTab = function(tabId, btn) {
  document.querySelectorAll(".exact-tab-btn").forEach(b => b.classList.remove("active"));
  if(btn) btn.classList.add("active");
  document.querySelectorAll(".exact-tab-content").forEach(el => el.style.display = "none");
  document.getElementById("exact-tab-" + tabId).style.display = "block";
};
`;

const newAppJs = appJs.substring(0, startIndex) + newRenderMatchmakingCaseDetail + '\n' + switchTabFunc + '\n' + appJs.substring(endIndex);

fs.writeFileSync(appFile, newAppJs);
