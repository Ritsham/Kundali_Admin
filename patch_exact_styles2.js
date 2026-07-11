const fs = require('fs');
const stylesFile = 'styles.css';
let styles = fs.readFileSync(stylesFile, 'utf8');

styles += `
/* EXACT UI Match Part 2 (Doshas, SWOT, Charts) */
.exact-dosha-section { margin-top: 48px; }
.exact-dosha-section h3 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #000; }
.exact-dosha-list {
  background: #fff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.exact-dosha-item {
  padding: 20px 24px; border-bottom: 1px solid #eaeaea;
}
.exact-dosha-item:last-child { border-bottom: none; }
.ed-row1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ed-name { font-size: 16px; font-weight: 600; color: #1b1e6d; }
.ed-badge {
  padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;
}
.ed-desc { font-size: 14px; color: #555; margin-bottom: 8px; line-height: 1.5; }
.ed-rec { font-size: 14px; font-weight: 500; color: #333; }

.exact-swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; }
.swot-card {
  background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.swot-card h4 { font-size: 16px; font-weight: 600; color: #2e7d32; margin-bottom: 16px; }
.concern-card h4 { color: #c62828; }
.swot-list { padding-left: 20px; font-size: 14px; color: #444; line-height: 1.8; }

.exact-file-header { margin-bottom: 32px; }
.exact-file-header h2 { font-size: 22px; font-weight: 500; color: #333; margin-bottom: 8px; }
.exact-file-header p { font-size: 14px; color: #666; line-height: 1.5; }

.charts-info-cards { margin-bottom: 48px; }
.info-table-card { padding: 0; overflow: hidden; }
.exact-pc-title { padding: 20px 24px; background: #fafafa; border-bottom: 1px solid #eaeaea; margin-bottom: 0; }
.info-table-row {
  display: flex; justify-content: space-between; padding: 12px 24px;
  border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #333;
}
.info-table-row:last-child { border-bottom: none; }
.info-table-row span:first-child { font-weight: 600; color: #666; }

.exact-chart-section { margin-bottom: 48px; }
.exact-chart-section h3 { font-size: 18px; font-weight: 600; margin-bottom: 4px; color: #000; }
.exact-chart-section p { font-size: 13px; color: #777; margin-bottom: 24px; }
.exact-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.exact-chart-card {
  background: #fff; border: 1px solid #e1cbb3; border-radius: 12px; padding: 24px;
}
.chart-gender-label {
  font-size: 12px; font-weight: 700; margin-bottom: 16px;
}
.male { color: #d4a017; }
.female { color: #d4a017; }
.chart-pill-row {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;
}
.chart-pill {
  border: 1px solid #e1cbb3; background: #fefdf8; border-radius: 20px;
  padding: 4px 12px; font-size: 11px; color: #555;
}
.chart-pill strong { color: #333; }
.chart-canvas-container {
  width: 100%; border: 1px solid #e1cbb3; aspect-ratio: 1;
}
.chart-canvas-container canvas { width: 100% !important; height: 100% !important; }

.exact-dashas-grid { margin-bottom: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

.exact-position-section h3 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #000; }
.exact-position-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.exact-pos-card {
  border: 1px solid #eaeaea; background: #fff; padding: 24px; border-radius: 12px;
}
.exact-pos-card h4 { font-size: 16px; margin-bottom: 16px; color: #333; }
.exact-pos-card .planet-position-card { box-shadow: none; border: none; padding: 0; }
.exact-pos-card .planet-position-card h3 { display: none; }
`;
fs.writeFileSync(stylesFile, styles);
