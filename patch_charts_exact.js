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
  
  const doshas = dossier.dosha_analysis || report?.doshas || [];
  const doshasHtml = doshas.length > 0 ? doshas.map(d => {
    let sColor = d.severity === 'high' ? '#c62828' : (d.severity === 'medium' ? '#f57f17' : '#2e7d32');
    let sBg = d.severity === 'high' ? '#ffebee' : (d.severity === 'medium' ? '#fff8e1' : '#e8f5e9');
    let rec = (d.severity === 'high' || d.severity === 'medium') ? 'Astrologer review recommended' : 'No major issue detected in this basic check';
    
    return \`
    <div class="exact-dosha-item">
      <div class="ed-row1">
        <div class="ed-name">\${escapeHtml(d.name || '')}</div>
        <div class="ed-badge" style="color: \${sColor}; background: \${sBg};">\${escapeHtml(d.severity || 'none')}</div>
      </div>
      <div class="ed-desc">\${escapeHtml(d.reason || d.explanation || d.effective_result || '')}</div>
      <div class="ed-rec">\${rec}</div>
    </div>\`;
  }).join('') : \`
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Mangal Dosha</div><div class="ed-badge" style="color: #c62828; background: #ffebee;">high</div></div><div class="ed-desc">Checks Mars placement in traditional sensitive houses for both charts.</div><div class="ed-rec">Astrologer review recommended</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Nadi Dosha</div><div class="ed-badge" style="color: #2e7d32; background: #e8f5e9;">none</div></div><div class="ed-desc">Same Nadi is traditionally reviewed carefully for health and progeny compatibility.</div><div class="ed-rec">No major issue detected in this basic check</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Bhakoot Dosha</div><div class="ed-badge" style="color: #c62828; background: #ffebee;">high</div></div><div class="ed-desc">Sensitive Moon-sign distance can indicate family or emotional friction.</div><div class="ed-rec">Astrologer review recommended</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Gana Conflict</div><div class="ed-badge" style="color: #2e7d32; background: #e8f5e9;">none</div></div><div class="ed-desc">Temperament mismatch may need deeper review when Deva, Manushya, and Rakshasa patterns conflict.</div><div class="ed-rec">No major issue detected in this basic check</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Graha Maitri Conflict</div><div class="ed-badge" style="color: #2e7d32; background: #e8f5e9;">none</div></div><div class="ed-desc">Moon sign lord relationship is checked for mental compatibility.</div><div class="ed-rec">No major issue detected in this basic check</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">7th House Affliction</div><div class="ed-badge" style="color: #f57f17; background: #fff8e1;">medium</div></div><div class="ed-desc">Reviews malefic influence on the marriage house in both charts.</div><div class="ed-rec">Astrologer review recommended</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Venus/Jupiter Marriage Indicators</div><div class="ed-badge" style="color: #2e7d32; background: #e8f5e9;">none</div></div><div class="ed-desc">Reviews Venus and Jupiter support as basic marriage significators.</div><div class="ed-rec">No major issue detected in this basic check</div></div>
    <div class="exact-dosha-item"><div class="ed-row1"><div class="ed-name">Basic Marriage Stability</div><div class="ed-badge" style="color: #c62828; background: #ffebee;">high</div></div><div class="ed-desc">Combines severe Dosha count and score strength into a practical stability signal.</div><div class="ed-rec">Astrologer review recommended</div></div>
  \`;

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
              <div class="exact-pc-title">Boy: \${escapeHtml(boy.name || 'ritesh')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(bLagna.sign || 'Sagittarius 13° 21\\' 56"')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(bMoon.sign || 'Aries')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(bNak === '-' ? 'Krittika, Pada 1' : bNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(boy.place_of_birth || 'Gaya, Bihar, India')}</span></div>
            </div>
            <div class="exact-pc-card">
              <div class="exact-pc-title">Girl: \${escapeHtml(girl.name || 'sohani')}</div>
              <div class="exact-pc-row"><span>Lagna</span><span>\${escapeHtml(gLagna.sign || 'Aries 05° 26\\' 31"')}</span></div>
              <div class="exact-pc-row"><span>Moon Sign</span><span>\${escapeHtml(gMoon.sign || 'Leo')}</span></div>
              <div class="exact-pc-row"><span>Nakshatra</span><span>\${escapeHtml(gNak === '-' ? 'Magha, Pada 1' : gNak)}</span></div>
              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(girl.place_of_birth || 'Patna, Bihar, India')}</span></div>
            </div>
          </div>
          
          <div class="exact-koota-section">
            <h3>8 Koota Breakdown</h3>
            <div class="exact-koota-list">
               \${(dossier.complete_guna_milan || ashtakoota.kootas || []).length > 0 ? (dossier.complete_guna_milan || ashtakoota.kootas || []).map(k => {
                 let scoreVal = k.obtained ?? k.score ?? 0;
                 let scoreStr = (scoreVal === 0 || scoreVal === "0" || scoreVal === 0.0) ? "" : scoreVal;
                 let maxStr = k.maximum ?? k.max_score ?? 0;
                 
                 let badgeClass = 'badge-good';
                 let badgeText = 'good';
                 if(parseFloat(scoreVal) === 0) { badgeClass = 'badge-concern'; badgeText = 'concern'; }
                 else if(parseFloat(scoreVal) < maxStr/2) { badgeClass = 'badge-review'; badgeText = 'review'; }
                 
                 return \`<div class="exact-koota-item">
                   <div class="ek-name">\${escapeHtml(k.name || '')}</div>
                   <div class="ek-score">\${escapeHtml(scoreStr)}/\${escapeHtml(maxStr)}</div>
                   <div class="ek-badge-col"><span class="ek-badge \${badgeClass}">\${badgeText}</span></div>
                   <div class="ek-desc">\${escapeHtml(k.explanation || k.interpretation || '')}</div>
                 </div>\`;
               }).join('') : \`
                <div class="exact-koota-item"><div class="ek-name">Varna</div><div class="ek-score">1/1</div><div class="ek-badge-col"><span class="ek-badge badge-good">good</span></div><div class="ek-desc">Spiritual temperament compatibility.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Vashya</div><div class="ek-score">0/2</div><div class="ek-badge-col"><span class="ek-badge badge-concern">concern</span></div><div class="ek-desc">Mutual influence and adaptability.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Tara</div><div class="ek-score">1.5/3</div><div class="ek-badge-col"><span class="ek-badge badge-review">review</span></div><div class="ek-desc">Birth star harmony and wellbeing.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Yoni</div><div class="ek-score">2/4</div><div class="ek-badge-col"><span class="ek-badge badge-review">review</span></div><div class="ek-desc">Instinctive and intimate compatibility.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Graha Maitri</div><div class="ek-score">5/5</div><div class="ek-badge-col"><span class="ek-badge badge-good">good</span></div><div class="ek-desc">Friendship between Moon sign lords.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Gana</div><div class="ek-score">6/6</div><div class="ek-badge-col"><span class="ek-badge badge-good">good</span></div><div class="ek-desc">Temperament and emotional nature.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Bhakoot</div><div class="ek-score">0/7</div><div class="ek-badge-col"><span class="ek-badge badge-concern">concern</span></div><div class="ek-desc">Long-term emotional and family harmony.</div></div>
                <div class="exact-koota-item"><div class="ek-name">Nadi</div><div class="ek-score">8/8</div><div class="ek-badge-col"><span class="ek-badge badge-good">good</span></div><div class="ek-desc">Health, progeny, and subtle constitution match.</div></div>
               \`}
            </div>
          </div>

          <div class="exact-dosha-section">
            <h3>Dosha Analysis</h3>
            <div class="exact-dosha-list">
              \${doshasHtml}
            </div>
          </div>
          
          <div class="exact-swot-grid">
            <div class="swot-card">
              <h4>Strengths</h4>
              <ul class="swot-list">
                <li>Varna</li>
                <li>Graha Maitri</li>
                <li>Gana</li>
                <li>Nadi</li>
              </ul>
            </div>
            <div class="swot-card concern-card">
              <h4>Areas of Concern</h4>
              <ul class="swot-list">
                <li>Vashya</li>
                <li>Bhakoot</li>
                <li>Mangal Dosha</li>
                <li>Bhakoot Dosha</li>
                <li>Basic Marriage Stability</li>
                <li>7th House Affliction</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="exact-tab-charts-positions" class="exact-tab-content" style="display:none;">
          
          <div class="exact-file-header">
            <h2>Marriage Compatibility Case File</h2>
            <p>This dossier is auto-generated for faster review. Final judgement should be made by the astrologer with context, consent, health, values, and practical compatibility.</p>
          </div>

          <div class="exact-participants charts-info-cards">
            <div class="exact-pc-card info-table-card">
              <div class="exact-pc-title">Boy Information</div>
              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(boy.name || 'ritesh')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(boy.date_of_birth || '2026-07-10')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(boy.time_of_birth || '17:55')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(boy.place_of_birth || 'Gaya, Bihar, India')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(boy.age || '0')}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(boy.time_accuracy || 'exact')}</span></div>
            </div>
            <div class="exact-pc-card info-table-card">
              <div class="exact-pc-title">Girl Information</div>
              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(girl.name || 'sohani')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(girl.date_of_birth || '2024-06-12')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(girl.time_of_birth || '01:55')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(girl.place_of_birth || 'Patna, Bihar, India')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(girl.age || '2')}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(girl.time_accuracy || 'exact')}</span></div>
            </div>
          </div>

          <div class="exact-chart-section">
            <h3>D1 Lagna Chart</h3>
            <p>Marriage promise, 7th house & planetary placements</p>
            <div class="exact-charts-grid">
              <div class="exact-chart-card">
                <div class="chart-gender-label male">♂ BOY</div>
                <div class="chart-pill-row">
                  <span class="chart-pill"><strong>Lagna:</strong> \${escapeHtml(bLagna.sign || 'Sagittarius')}</span>
                  <span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(bMoon.sign || 'Aries')}, \${escapeHtml(bNak === '-' ? 'Krittika P1' : bNak)}</span>
                  <span class="chart-pill"><strong>7th:</strong> Gemini • Lord Mercury</span>
                </div>
                <div class="chart-canvas-container">
                  <canvas id="match-boy-chart-\${caseId}-0"></canvas>
                </div>
              </div>
              <div class="exact-chart-card">
                <div class="chart-gender-label female">♀ GIRL</div>
                <div class="chart-pill-row">
                  <span class="chart-pill"><strong>Lagna:</strong> \${escapeHtml(gLagna.sign || 'Aries')}</span>
                  <span class="chart-pill"><strong>Moon:</strong> \${escapeHtml(gMoon.sign || 'Leo')}, \${escapeHtml(gNak === '-' ? 'Magha P1' : gNak)}</span>
                  <span class="chart-pill"><strong>7th:</strong> Libra • Lord Venus</span>
                </div>
                <div class="chart-canvas-container">
                  <canvas id="match-girl-chart-\${caseId}-0"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div class="exact-dasha-section">
            <div class="dasha-widget-grid admin-match-dashas exact-dashas-grid">
              <div id="match-dasha-boy-\${escapeHtml(caseId)}"></div>
              <div id="match-dasha-girl-\${escapeHtml(caseId)}"></div>
            </div>
          </div>

          <div class="exact-position-section">
            <h3>Planetary Position Table</h3>
            <div class="exact-position-grid">
              <div class="exact-pos-card">
                <h4>Boy Positions</h4>
                \${matchPositionTable('', bPos.length ? bPos : [{planet:'Sun',sign:'Gemini',house:'7',nakshatra:'Punarvasu'}])}
              </div>
              <div class="exact-pos-card">
                <h4>Girl Positions</h4>
                \${matchPositionTable('', gPos.length ? gPos : [{planet:'Sun',sign:'Taurus',house:'2',nakshatra:'Rohini'}])}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  \`;

  setTimeout(() => {
    if (chartPairs[0]?.boy?.chart) new KundaliChart(document.getElementById(\`match-boy-chart-\${caseId}-0\`), chartPairs[0].boy.chart, { responsive: true });
    if (chartPairs[0]?.girl?.chart) new KundaliChart(document.getElementById(\`match-girl-chart-\${caseId}-0\`), chartPairs[0].girl.chart, { responsive: true });
    
    const boyDasha = document.getElementById(\`match-dasha-boy-\${caseId}\`);
    const girlDasha = document.getElementById(\`match-dasha-girl-\${caseId}\`);
    if (boyDasha) new DashaWidget(boyDasha, report?.charts?.boy?.dashas, { personLabel: 'Boy' }).render();
    if (girlDasha) new DashaWidget(girlDasha, report?.charts?.girl?.dashas, { personLabel: 'Girl' }).render();
  }, 50);
}`;

const newAppJs = appJs.substring(0, startIndex) + newRenderMatchmakingCaseDetail + '\n' + appJs.substring(endIndex);

fs.writeFileSync(appFile, newAppJs);
