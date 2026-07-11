const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// ─── Fix 1: participant data - use couple_information for birth place, age, accuracy ───
// The backend sends: report.participants = {boy, girl} with keys name/date_of_birth/time_of_birth/birth_place/birth_time_accuracy
// but report.dossier.couple_information has the enriched version with age calculated
const oldParticipantBoy = `  const boy = report?.participants?.boy || {};
  const girl = report?.participants?.girl || {};`;
const newParticipantBoy = `  const boy = report?.participants?.boy || report?.dossier?.couple_information?.boy || {};
  const girl = report?.participants?.girl || report?.dossier?.couple_information?.girl || {};`;

// Fix 2: correct dossier field names from backend 
const oldSeventhLine = `  // Try all possible backend field names for these sections
  const _seventhData = dossier.seventh_house || dossier.marriage_house || dossier.marriage_indicators || {};
  const _karakasData = dossier.karakas || dossier.karaka || dossier.karakas_analysis || {};
  const _navamsaData = dossier.navamsa || dossier.d9 || dossier.d9_navamsa || dossier.navamsa_analysis || {};
  const boySeventh = _seventhData.boy || _seventhData.male || {};
  const girlSeventh = _seventhData.girl || _seventhData.female || {};
  const boyKarakas = _karakasData.boy || _karakasData.male || {};
  const girlKarakas = _karakasData.girl || _karakasData.female || {};
  const boyNavamsa = _navamsaData.boy || _navamsaData.male || {};
  const girlNavamsa = _navamsaData.girl || _navamsaData.female || {};`;

const newSeventhLine = `  // Exact field names from matchmaking_service.py backend
  const boySeventh = dossier.marriage_house_analysis?.boy || {};
  const girlSeventh = dossier.marriage_house_analysis?.girl || {};
  const boyKarakas = dossier.marriage_karakas?.boy || {};
  const girlKarakas = dossier.marriage_karakas?.girl || {};
  const boyNavamsa = dossier.navamsa_analysis?.boy || {};
  const girlNavamsa = dossier.navamsa_analysis?.girl || {};`;

// Fix 3: participant birth details - backend uses birth_place not place_of_birth, birth_time_accuracy not time_accuracy
const oldBoyInfoRows = `              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(boy.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(boy.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(boy.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(boy.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(boy.time_accuracy || '-')}</span></div>`;
const newBoyInfoRows = `              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(boy.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(boy.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(boy.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(boy.birth_place || boy.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(boy.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(boy.birth_time_accuracy || boy.time_accuracy || '-')}</span></div>`;

const oldGirlInfoRows = `              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(girl.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(girl.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(girl.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(girl.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(girl.time_accuracy || '-')}</span></div>`;
const newGirlInfoRows = `              <div class="info-table-row"><span>Name</span><span>\${escapeHtml(girl.name || '-')}</span></div>
              <div class="info-table-row"><span>DOB</span><span>\${escapeHtml(girl.date_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Time</span><span>\${escapeHtml(girl.time_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Birth Place</span><span>\${escapeHtml(girl.birth_place || girl.place_of_birth || '-')}</span></div>
              <div class="info-table-row"><span>Age</span><span>\${escapeHtml(String(girl.age ?? '-'))}</span></div>
              <div class="info-table-row"><span>Time Accuracy</span><span>\${escapeHtml(girl.birth_time_accuracy || girl.time_accuracy || '-')}</span></div>`;

// Fix 4: system analysis participant cards also need birth_place fix
const oldBoyPcCard = `              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(boy.place_of_birth || '-')}</span></div>`;
const newBoyPcCard = `              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(boy.birth_place || boy.place_of_birth || '-')}</span></div>`;
const oldGirlPcCard = `              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(girl.place_of_birth || '-')}</span></div>`;
const newGirlPcCard = `              <div class="exact-pc-row"><span>Place</span><span>\${escapeHtml(girl.birth_place || girl.place_of_birth || '-')}</span></div>`;

// Fix 5: compat list - backend sends 'remarks' not 'description'/'reason'
const oldCompatMap = `      return \`<div class="exact-compat-item">
        <div class="ec-name">\${escapeHtml(c.name || c.indicator || '')}</div>
        <div class="ec-score \${colorClass}">\${escapeHtml(c.status || c.score || '')}</div>
        <div class="ec-desc">\${escapeHtml(c.description || c.reason || c.detail || '')}</div>
      </div>\`;`;
const newCompatMap = `      return \`<div class="exact-compat-item">
        <div class="ec-name">\${escapeHtml(c.name || c.indicator || '')}</div>
        <div class="ec-score \${colorClass}">\${escapeHtml(c.status || c.score || '')}</div>
        <div class="ec-desc">\${escapeHtml(c.remarks || c.description || c.reason || c.detail || '')}</div>
      </div>\`;`;

// Fix 6: buildInfoRows - flatten arrays like planets_in_seventh and supportive_factors
const oldBuildInfoRows = `  const buildInfoRows = (obj) => {
    if (!obj || typeof obj !== 'object') return '<div>No data</div>';
    return Object.entries(obj).filter(([k,v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').map(([key, value]) => {
      const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return \`<div class="info-table-row"><span>\${escapeHtml(formattedKey)}</span><span>\${escapeHtml(String(value))}</span></div>\`;
    }).join('');
  };`;
const newBuildInfoRows = `  const buildInfoRows = (obj) => {
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
      return \`<div class="info-table-row"><span>\${escapeHtml(formattedKey)}</span><span>\${escapeHtml(displayVal)}</span></div>\`;
    }).filter(Boolean).join('');
  };`;

let replaced = 0;
const patch = (old, replacement, label) => {
  if (appJs.includes(old)) {
    appJs = appJs.replace(old, replacement);
    console.log('✓', label);
    replaced++;
  } else {
    console.log('⚠ NOT FOUND:', label);
  }
};

patch(oldParticipantBoy, newParticipantBoy, 'Fixed participant data source');
patch(oldSeventhLine, newSeventhLine, 'Fixed seventh/karakas/navamsa field names');
patch(oldBoyInfoRows, newBoyInfoRows, 'Fixed boy info rows (birth_place/time_accuracy)');
patch(oldGirlInfoRows, newGirlInfoRows, 'Fixed girl info rows (birth_place/time_accuracy)');
patch(oldBoyPcCard, newBoyPcCard, 'Fixed boy participant card place');
patch(oldGirlPcCard, newGirlPcCard, 'Fixed girl participant card place');
patch(oldCompatMap, newCompatMap, 'Fixed compat remarks field');
patch(oldBuildInfoRows, newBuildInfoRows, 'Fixed buildInfoRows to handle arrays');

fs.writeFileSync('app.js', appJs);
console.log(`\nDone. ${replaced} patches applied.`);
