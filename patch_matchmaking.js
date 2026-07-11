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
  
  const bLagna = (dossier.planetary_positions?.boy || []).find(p => p.planet === 'Ascendant' || p.name === 'Ascendant')?.sign || '';
  const gLagna = (dossier.planetary_positions?.girl || []).find(p => p.planet === 'Ascendant' || p.name === 'Ascendant')?.sign || '';
  
  const bMoon = (dossier.planetary_positions?.boy || []).find(p => p.planet === 'Moon' || p.name === 'Moon');
  const gMoon = (dossier.planetary_positions?.girl || []).find(p => p.planet === 'Moon' || p.name === 'Moon');
  
  const bMoonSign = bMoon?.sign || '';
  const gMoonSign = gMoon?.sign || '';
  const bNak = (bMoon?.nakshatra ? \`\${bMoon.nakshatra}, Pada \${bMoon.pada}\` : '');
  const gNak = (gMoon?.nakshatra ? \`\${gMoon.nakshatra}, Pada \${gMoon.pada}\` : '');

  caseDetailRoot.innerHTML = \`
    <div class="match-result-container">
      <div class="match-top-actions">
        <button class="ghost-btn" type="button" onclick="showPanel('consultations')">← Back</button>
      </div>
      <div class="match-result-header">
        <div class="match-result-info">
          <div class="match-result-label">MATCH RESULT</div>
          <div class="match-result-title">\${escapeHtml(summary.overall_result || 'Needs Astrologer Review')}</div>
          <div class="match-result-desc">\${escapeHtml(summary.final_recommendation || 'This match has sensitive factors that should be reviewed by an astrologer before drawing conclusions.')}</div>
        </div>
        <div class="match-result-score-circle">
          <svg viewBox="0 0 36 36" class="circular-chart orange">
            <path class="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="circle"
              stroke-dasharray="\${(ashtakoota.total_score / 36) * 100}, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="score-text">
            <div class="score-value">\${escapeHtml(ashtakoota.total_score || '0')}</div>
            <div class="score-max">/ 36</div>
          </div>
        </div>
      </div>

      <div class="match-result-tabs">
        <button class="active" onclick="switchMatchTab('system-analysis', this)">System Analysis</button>
        <button onclick="switchMatchTab('charts-positions', this)">Charts & Positions</button>
      </div>

      <div id="tab-system-analysis" class="match-tab-content active">
        <div class="participants-cards">
          <div class="participant-card">
            <div class="pc-title">Boy: \${escapeHtml(boy.name || 'Boy')}</div>
            <div class="pc-row"><span>Lagna</span><span>\${escapeHtml(bLagna)}</span></div>
            <div class="pc-row"><span>Moon Sign</span><span>\${escapeHtml(bMoonSign)}</span></div>
            <div class="pc-row"><span>Nakshatra</span><span>\${escapeHtml(bNak)}</span></div>
            <div class="pc-row"><span>Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>
          </div>
          <div class="participant-card">
            <div class="pc-title">Girl: \${escapeHtml(girl.name || 'Girl')}</div>
            <div class="pc-row"><span>Lagna</span><span>\${escapeHtml(gLagna)}</span></div>
            <div class="pc-row"><span>Moon Sign</span><span>\${escapeHtml(gMoonSign)}</span></div>
            <div class="pc-row"><span>Nakshatra</span><span>\${escapeHtml(gNak)}</span></div>
            <div class="pc-row"><span>Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>
          </div>
        </div>
        
        <div class="koota-breakdown">
          <h3>8 Koota Breakdown</h3>
          <div class="koota-list">
             \${(dossier.complete_guna_milan || ashtakoota.kootas || []).map(k => {
               let badgeClass = 'badge-good';
               let badgeText = 'GOOD';
               let scoreNum = parseFloat(k.obtained ?? k.score ?? 0);
               let maxNum = parseFloat(k.maximum ?? k.max_score ?? 1);
               if(scoreNum === 0) { badgeClass = 'badge-concern'; badgeText = 'CONCERN'; }
               else if(scoreNum < maxNum / 2) { badgeClass = 'badge-review'; badgeText = 'REVIEW'; }
               
               return \`<div class="koota-item">
                 <div class="k-name">\${escapeHtml(k.name || '')}</div>
                 <div class="k-score">\${escapeHtml(k.obtained ?? k.score ?? '-')}/\${escapeHtml(k.maximum ?? k.max_score ?? '-')}</div>
                 <div class="k-badge \${badgeClass}">\${badgeText}</div>
                 <div class="k-desc">\${escapeHtml(k.explanation || k.interpretation || '')}</div>
               </div>\`;
             }).join('')}
          </div>
        </div>
      </div>

      <div id="tab-charts-positions" class="match-tab-content" style="display:none;">
        <div class="empty">Charts & Positions Details</div>
      </div>
    </div>
  \`;
}`;

const newAppJs = appJs.substring(0, startIndex) + newRenderMatchmakingCaseDetail + '\n\nwindow.switchMatchTab = function(tabId, btn) {\n  document.querySelectorAll(".match-result-tabs button").forEach(b => b.classList.remove("active"));\n  if(btn) btn.classList.add("active");\n  document.querySelectorAll(".match-tab-content").forEach(el => el.style.display = "none");\n  document.getElementById("tab-" + tabId).style.display = "block";\n};\n' + appJs.substring(endIndex);

fs.writeFileSync(appFile, newAppJs);

const stylesFile = 'styles.css';
let styles = fs.readFileSync(stylesFile, 'utf8');

styles += `
/* Match Making Result UI */
.match-result-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.match-top-actions { margin-bottom: 24px; }
.match-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.match-result-info { max-width: 60%; }
.match-result-label {
  font-size: 12px;
  font-weight: 700;
  color: #D32F2F;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.match-result-title {
  font-size: 32px;
  color: #1a237e;
  margin-bottom: 8px;
}
.match-result-desc {
  font-size: 15px;
  color: #424242;
}

.match-result-score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}
.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 250px;
}
.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.8;
}
.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke: #ff9800;
}
.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #333;
}
.score-value { font-size: 28px; font-weight: 700; }
.score-max { font-size: 14px; color: #777; }

.match-result-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 24px;
}
.match-result-tabs button {
  padding: 12px 24px;
  border: 1px solid #eee;
  border-bottom: none;
  background: #fff;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  font-weight: 600;
  color: #555;
}
.match-result-tabs button.active {
  color: #1a237e;
  border-color: #ddd;
  background: #fafafa;
}

.participants-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}
.participant-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
}
.pc-title {
  color: #1a237e;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}
.pc-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
}
.pc-row span:first-child { font-weight: 600; color: #777; }

.koota-breakdown h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}
.koota-list {
  border: 1px solid #eee;
  border-radius: 8px;
}
.koota-item {
  display: grid;
  grid-template-columns: 120px 60px 100px 1fr;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}
.koota-item:last-child { border-bottom: none; }
.k-name { font-weight: 600; color: #333; }
.k-score { color: #555; }
.k-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.badge-good { background: #e8f5e9; color: #2e7d32; }
.badge-concern { background: #ffebee; color: #c62828; }
.badge-review { background: #fff8e1; color: #f57f17; }
.k-desc { color: #666; font-size: 14px; }
`;
fs.writeFileSync(stylesFile, styles);
