const fs = require('fs');

// ── 1. Fix CSS clipping, dasha height, and layout ───────────────────────────
let styles = fs.readFileSync('styles.css', 'utf8');

styles += `

/* ===== LAYOUT FIX: prevent right-side clipping ===== */
.main-shell, .panel, section.panel {
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100% !important;
}
.exact-match-result {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  padding: 0;
}
.exact-match-result * { box-sizing: border-box; }

.exact-top-section {
  width: 100%;
  max-width: 100%;
}
.exact-header-layout {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
}
.exact-header-info { flex: 1 1 auto; min-width: 0; }
.exact-score-circle { flex: 0 0 90px; }

.exact-participants,
.charts-info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}
.exact-pc-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.exact-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}
.exact-chart-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.exact-extra-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}
.exact-extra-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.exact-compat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
}
.exact-compat-item {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.info-table-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  width: 100%;
}
.info-table-row span:first-child { flex: 0 0 auto; }
.info-table-row span:last-child { flex: 1; text-align: right; word-break: break-word; }

/* ===== DASHA: much taller for proper viewing ===== */
.exact-dashas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
  min-width: 0;
}
.exact-dashas-grid > div {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}
.dasha-widget {
  min-height: 520px;
}
.dasha-widget-table-wrap {
  min-height: 340px;
  max-height: 600px;
  overflow-y: auto;
}
.dasha-widget-summary {
  min-height: 80px;
}

/* ===== Planet position table fix ===== */
.exact-position-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}
.exact-pos-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* ===== Chart pill row wrap ===== */
.chart-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.chart-pill {
  font-size: 11px;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 900px) {
  .exact-participants,
  .charts-info-cards,
  .exact-charts-grid,
  .exact-extra-grid,
  .exact-compat-grid,
  .exact-position-grid,
  .exact-dashas-grid { grid-template-columns: 1fr; }
}
`;

fs.writeFileSync('styles.css', styles);

// ── 2. Fix app.js: add console.log to debug dossier, and fix data paths ──────
let appJs = fs.readFileSync('app.js', 'utf8');

// Add debug log right after dossier extraction
const oldDossierLine = "  const dossier = report?.dossier || {};";
const newDossierLine = `  const dossier = report?.dossier || {};
  // Debug: log the full dossier so we can see actual field names in console
  console.log('[Matchmaking Dossier Keys]', Object.keys(dossier));
  if (dossier) {
    ['seventh_house','marriage_house','marriage_indicators','karakas','karaka','navamsa','d9','d9_navamsa','compatibility_indicators','compat'].forEach(k => {
      if (dossier[k]) console.log('[Dossier] Found key:', k, JSON.stringify(dossier[k]).slice(0, 200));
    });
  }`;

// Fix data extraction to try all possible key variants for seventh house, karakas, navamsa
const oldSeventhLine = `  const boySeventh = dossier.seventh_house?.boy || dossier.marriage_house?.boy || {};
  const girlSeventh = dossier.seventh_house?.girl || dossier.marriage_house?.girl || {};
  const boyKarakas = dossier.karakas?.boy || {};
  const girlKarakas = dossier.karakas?.girl || {};
  const boyNavamsa = dossier.navamsa?.boy || {};
  const girlNavamsa = dossier.navamsa?.girl || {};`;

const newSeventhLine = `  // Try all possible backend field names for these sections
  const _seventhData = dossier.seventh_house || dossier.marriage_house || dossier.marriage_indicators || {};
  const _karakasData = dossier.karakas || dossier.karaka || dossier.karakas_analysis || {};
  const _navamsaData = dossier.navamsa || dossier.d9 || dossier.d9_navamsa || dossier.navamsa_analysis || {};
  const boySeventh = _seventhData.boy || _seventhData.male || {};
  const girlSeventh = _seventhData.girl || _seventhData.female || {};
  const boyKarakas = _karakasData.boy || _karakasData.male || {};
  const girlKarakas = _karakasData.girl || _karakasData.female || {};
  const boyNavamsa = _navamsaData.boy || _navamsaData.male || {};
  const girlNavamsa = _navamsaData.girl || _navamsaData.female || {};`;

const oldCompatLine = `  const compatList = dossier.compatibility_indicators || summary.compatibility_indicators || [];`;
const newCompatLine = `  const compatList = dossier.compatibility_indicators || dossier.compat || dossier.compatibility || summary.compatibility_indicators || [];`;

if (appJs.includes(oldDossierLine)) {
  appJs = appJs.replace(oldDossierLine, newDossierLine);
  console.log('✓ Added dossier debug logging');
} else {
  console.log('⚠ Could not find dossier line to patch');
}

if (appJs.includes(oldSeventhLine)) {
  appJs = appJs.replace(oldSeventhLine, newSeventhLine);
  console.log('✓ Fixed data extraction paths');
} else {
  console.log('⚠ Could not find seventh house line to patch');
}

if (appJs.includes(oldCompatLine)) {
  appJs = appJs.replace(oldCompatLine, newCompatLine);
  console.log('✓ Fixed compat list path');
}

fs.writeFileSync('app.js', appJs);
console.log('Done!');
