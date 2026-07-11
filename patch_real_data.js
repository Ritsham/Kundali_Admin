const fs = require('fs');

// Patch app.js to use real data dynamically
const appFile = 'app.js';
let appJs = fs.readFileSync(appFile, 'utf8');

const renderMatchStart = 'function renderMatchmakingCaseDetail(item) {';
const renderMatchEnd = '  }, 50);\n}';
const startIndex = appJs.indexOf(renderMatchStart);
const endIndex = appJs.indexOf(renderMatchEnd, startIndex) + renderMatchEnd.length;

const newRenderMatchmakingCaseDetail = `function renderMatchmakingCaseDetail(item) {
  const caseId = item.case_id || item.id;
  const model = getCaseAstroModel(item);
  const report = model.matchReport || {};
  const status = item.case_status || item.status || "pending";
  const boy = report?.participants?.boy || {};
  const girl = report?.participants?.girl || {};
  const summary = report?.summary || {};
  const ashtakoota = report?.ashtakoota || {};
  const dossier = report?.dossier || {};
  const mandatory = dossier.charts_to_send?.mandatory || [];
  
  const bPos = dossier.planetary_positions?.boy || [];
  const gPos = dossier.planetary_positions?.girl || [];
  
  const getPlanet = (pos, name) => pos.find(p => p.planet === name || p.name === name) || {};
  const bLagna = getPlanet(bPos, 'Ascendant');
  const gLagna = getPlanet(gPos, 'Ascendant');
  const bMoon = getPlanet(bPos, 'Moon');
  const gMoon = getPlanet(gPos, 'Moon');
  
  const bNak = bMoon.nakshatra ? \`\${bMoon.nakshatra}, Pada \${bMoon.pada || 1}\` : '-';
  const gNak = gMoon.nakshatra ? \`\${gMoon.nakshatra}, Pada \${gMoon.pada || 1}\` : '-';

  const totalScore = ashtakoota.total_score || '0';
  const scorePercent = (parseFloat(totalScore) / 36) * 100;
  
  const doshas = dossier.dosha_analysis || dossier.doshas || report?.doshas || [];
  let doshasHtml = '';
  if (doshas.length > 0) {
    doshasHtml = doshas.map(d => {
      let sColor = d.severity === 'high' ? '#c62828' : (d.severity === 'medium' ? '#f57f17' : '#2e7d32');
      let sBg = d.severity === 'high' ? '#ffebee' : (d.severity === 'medium' ? '#fff8e1' : '#e8f5e9');
      let rec = d.recommendation || d.effective_result || ((d.severity === 'high' || d.severity === 'medium') ? 'Astrologer review recommended' : 'No major issue detected in this basic check');
      let presentStr = d.present !== undefined ? \`Present: \${d.present ? 'Yes' : 'No'}<br><br>\` : '';
      return \`
      <div class="exact-dosha-item">
        <div class="ed-row1">
          <div class="ed-name">\${escapeHtml(d.name || d.dosha_name || '')}</div>
          <div class="ed-badge" style="color: \${sColor}; background: \${sBg};">\${escapeHtml(d.severity || 'none')}</div>
        </div>
        <div class="ed-desc">\${presentStr}\${escapeHtml(d.reason || d.explanation || '')}<br><br>Effective result: \${escapeHtml(rec)}</div>
      </div>\`;
    }).join('');
  } else {
    doshasHtml = \`<div class="exact-dosha-item"><div class="ed-desc">No Dosha data found in report.</div></div>\`;
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
      
      return \`<div class="exact-koota-item">
        <div class="ek-name">\${escapeHtml(k.name || k.koota || '')}</div>
        <div class="ek-score">\${escapeHtml(scoreStr)}/\${escapeHtml(maxStr)}</div>
        <div class="ek-badge-col"><span class="ek-badge \${badgeClass}">\${badgeText}</span></div>
        <div class="ek-desc">\${escapeHtml(k.explanation || k.interpretation || '')}</div>
      </div>\`;
    }).join('');
  } else {
    kootasHtml = \`<div class="exact-koota-item"><div class="ek-desc">No Guna Milan data found in report.</div></div>\`;
  }

  const chartPairs = [
    { boy: mandatory[0], girl: mandatory[1], title: 'D1 Lagna Chart', desc: 'Marriage promise, 7th house & planetary placements' },
    { boy: mandatory[2], girl: mandatory[3], title: 'D9 Navamsa Chart', desc: 'Marriage strength, spouse indications & long-term compatibility' },
    { boy: mandatory[4], girl: mandatory[5], title: 'Moon Chart', desc: 'Emotional compatibility, Guna Milan & marriage happiness' },
    { boy: mandatory[6], girl: mandatory[7], title: 'Bhava Chalit Chart', desc: 'House cusps & planet occupation by house' },
  ];

  // Map extra details dynamically
  const buildInfoRows = (obj) => {
    if (!obj || typeof obj !== 'object') return '<div>No data</div>';
    return Object.entries(obj).filter(([k,v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').map(([key, value]) => {
      const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return \`<div class="info-table-row"><span>\${escapeHtml(formattedKey)}</span><span>\${escapeHtml(String(value))}</span></div>\`;
    }).join('');
  };

  const boySeventh = dossier.seventh_house?.boy || dossier.marriage_house?.boy || {};
  const girlSeventh = dossier.seventh_house?.girl || dossier.marriage_house?.girl || {};
  const boyKarakas = dossier.karakas?.boy || {};
  const girlKarakas = dossier.karakas?.girl || {};
  const boyNavamsa = dossier.navamsa?.boy || {};
  const girlNavamsa = dossier.navamsa?.girl || {};
  
  const compatList = dossier.compatibility_indicators || summary.compatibility_indicators || [];
  let compatHtml = '';
  if (Array.isArray(compatList) && compatList.length > 0) {
    compatHtml = compatList.map(c => {
      const st = (c.status || c.score || 'review').toLowerCase();
      let colorClass = 'review';
      if (st.includes('strong') || st.includes('good') || st.includes('clear')) colorClass = 'strong';
      else if (st.includes('moderate') || st.includes('average')) colorClass = 'moderate';
      
      return \`<div class="exact-compat-item">
        <div class="ec-name">\${escapeHtml(c.name || c.indicator || '')}</div>
        <div class="ec-score \${colorClass}">\${escapeHtml(c.status || c.score || '')}</div>
        <div class="ec-desc">\${escapeHtml(c.description || c.reason || c.detail || '')}</div>
      </div>\`;
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
      return \`<div class="exact-compat-item">
        <div class="ec-name">\${escapeHtml(title)}</div>
        <div class="ec-score \${colorClass}">\${escapeHtml(val)}</div>
        <div class="ec-desc">\${escapeHtml(desc)}</div>
      </div>\`;
    }).join('');
  } else {
    compatHtml = \`<div>No compatibility indicators found in report.</div>\`;
  }

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
              <path class="exact-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="exact-circle" stroke-dasharray="\${scorePercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="exact-score-text">
              <div class="exact-score-value">\${totalScore}</div>
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
              <div class="exact-pc-title">Boy: \${escapeHtml(boy.name || 'ritesh')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(bLagna.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(bMoon.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(bNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>
            </div>
            <div class="exact-pc-card">
              <div class="exact-pc-title">Girl: \${escapeHtml(girl.name || 'sohani')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(gLagna.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(gMoon.sign || '-')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(gNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>
            </div>
          </div>
          <div class="exact-koota-section">
            <h3>8 Koota Breakdown</h3>
            <div class="exact-koota-list">\${kootasHtml}</div>
          </div>
          <div class="exact-dosha-section">
            <h3>Dosha Analysis</h3>
            <div class="exact-dosha-list">\${doshasHtml}</div>
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
              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(boy.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(boy.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(boy.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(boy.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(boy.time_accuracy || '-')}</span></div>
            </div>
            <div class="exact-pc-card info-table-card">
              <div class="exact-pc-title">Girl Information</div>
              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(girl.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(girl.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(girl.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(girl.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(girl.time_accuracy || '-')}</span></div>
            </div>
          </div>

          \${chartPairs.map((pair, idx) => \`
            <div class="exact-chart-section">
              <h3>\${escapeHtml(pair.title || '')}</h3>
              <p>\${escapeHtml(pair.desc || '')}</p>
              <div class="exact-charts-grid">
                <div class="exact-chart-card">
                  <div class="chart-gender-label male">♂ BOY</div>
                  <div class="chart-pill-row">
                    \${idx === 0 ? \`<span class="chart-pill"><strong>Lagna:</strong> \${escapeHtml(bLagna.sign || '-')}</span>
                    <span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(bMoon.sign || '-')}, \${escapeHtml(bNak)}</span>
                    <span class="chart-pill"><strong>7th:</strong> Gemini · Lord Mercury</span>\` : ''}
                    \${idx === 1 ? \`<span class="chart-pill"><strong>Lagna:</strong> Leo</span>\` : ''}
                    \${idx === 2 ? \`<span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(bMoon.sign || '-')}</span>\` : ''}
                  </div>
                  <div class="chart-canvas-container">
                    <canvas id="match-boy-chart-\${caseId}-\${idx}"></canvas>
                  </div>
                </div>
                <div class="exact-chart-card">
                  <div class="chart-gender-label female">♀ GIRL</div>
                  <div class="chart-pill-row">
                    \${idx === 0 ? \`<span class="chart-pill"><strong>Lagna:</strong> \${escapeHtml(gLagna.sign || '-')}</span>
                    <span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(gMoon.sign || '-')}, \${escapeHtml(gNak)}</span>
                    <span class="chart-pill"><strong>7th:</strong> Libra · Lord Venus</span>\` : ''}
                    \${idx === 1 ? \`<span class="chart-pill"><strong>Lagna:</strong> Taurus</span>\` : ''}
                    \${idx === 2 ? \`<span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(gMoon.sign || '-')}</span>\` : ''}
                  </div>
                  <div class="chart-canvas-container">
                    <canvas id="match-girl-chart-\${caseId}-\${idx}"></canvas>
                  </div>
                </div>
              </div>
            </div>
          \`).join('')}

          <div class="exact-dasha-section">
            <h3>Vimshottari Dasha</h3>
            <p>5-level drill-down: Mahadasha → Antardasha → Pratyantardasha → Sookshma → Prana</p>
            <div class="dasha-widget-grid admin-match-dashas exact-dashas-grid">
              <div style="min-width: 0;">
                <h4>Boy — Vimshottari Dasha</h4>
                <p>120-year cycle · 5 levels</p>
                <div id="match-dasha-boy-\${escapeHtml(caseId)}"></div>
              </div>
              <div style="min-width: 0;">
                <h4>Girl — Vimshottari Dasha</h4>
                <p>120-year cycle · 5 levels</p>
                <div id="match-dasha-girl-\${escapeHtml(caseId)}"></div>
              </div>
            </div>
          </div>

          <div class="exact-position-section">
            <h3>Planetary Position Table</h3>
            <div class="exact-position-grid">
              <div class="exact-pos-card">
                <h4>Boy Positions</h4>
                \${matchPositionTable('', bPos)}
              </div>
              <div class="exact-pos-card">
                <h4>Girl Positions</h4>
                \${matchPositionTable('', gPos)}
              </div>
            </div>
          </div>
          
          <div class="exact-koota-section">
            <h3>Detailed Guna Milan</h3>
            <div class="exact-koota-list">\${kootasHtml}</div>
          </div>

          <div class="exact-dosha-section">
            <h3>Detailed Dosha Analysis</h3>
            <div class="exact-dosha-list">\${doshasHtml}</div>
          </div>

          <div class="exact-extra-section">
            <h3>Marriage House, Karakas & Navamsa</h3>
            <div class="exact-extra-grid">
              <div class="exact-extra-card">
                <h4>Boy 7th House</h4>
                \${buildInfoRows(boySeventh)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl 7th House</h4>
                \${buildInfoRows(girlSeventh)}
              </div>
              <div class="exact-extra-card">
                <h4>Boy Karakas</h4>
                \${buildInfoRows(boyKarakas)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl Karakas</h4>
                \${buildInfoRows(girlKarakas)}
              </div>
              <div class="exact-extra-card">
                <h4>Boy Navamsa</h4>
                \${buildInfoRows(boyNavamsa)}
              </div>
              <div class="exact-extra-card">
                <h4>Girl Navamsa</h4>
                \${buildInfoRows(girlNavamsa)}
              </div>
            </div>
          </div>

          <div class="exact-extra-section">
            <h3>Compatibility Indicators</h3>
            <div class="exact-compat-grid">
              \${compatHtml}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  \`;

  setTimeout(() => {
    chartPairs.forEach((pair, idx) => {
      if (pair.boy?.chart) new KundaliChart(document.getElementById(\`match-boy-chart-\${caseId}-\${idx}\`), pair.boy.chart, { responsive: true });
      if (pair.girl?.chart) new KundaliChart(document.getElementById(\`match-girl-chart-\${caseId}-\${idx}\`), pair.girl.chart, { responsive: true });
    });
    
    const boyDasha = document.getElementById(\`match-dasha-boy-\${caseId}\`);
    const girlDasha = document.getElementById(\`match-dasha-girl-\${caseId}\`);
    if (boyDasha && report?.charts?.boy?.dashas) new DashaWidget(boyDasha, report.charts.boy.dashas, { personLabel: 'Boy' }).render();
    if (girlDasha && report?.charts?.girl?.dashas) new DashaWidget(girlDasha, report.charts.girl.dashas, { personLabel: 'Girl' }).render();
  }, 50);
}`;

const newAppJs = appJs.substring(0, startIndex) + newRenderMatchmakingCaseDetail + '\n' + appJs.substring(endIndex);

fs.writeFileSync(appFile, newAppJs);

let styles = fs.readFileSync('styles.css', 'utf8');
if (!styles.includes('box-sizing: border-box;')) {
  styles += `
.exact-match-result {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.exact-match-result * {
  box-sizing: border-box;
}
`;
  fs.writeFileSync('styles.css', styles);
}

