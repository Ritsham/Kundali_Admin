const fs = require('fs');
const stylesFile = 'styles.css';
let styles = fs.readFileSync(stylesFile, 'utf8');

styles += `
/* EXACT UI Match Part 3 (Extra Details) */
.exact-extra-section { margin-top: 48px; }
.exact-extra-section h3 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #000; }
.exact-extra-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.exact-extra-card {
  background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px;
}
.exact-extra-card h4 { font-size: 16px; margin-bottom: 16px; color: #333; }

.exact-compat-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
.exact-compat-item {
  background: #fff; border: 1px solid #eaeaea; border-radius: 12px; padding: 20px;
}
.ec-name { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px; }
.ec-score { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.ec-score.strong { color: #2e7d32; }
.ec-score.moderate { color: #f57f17; }
.ec-score.review { color: #c62828; }
.ec-score.clear { color: #2e7d32; }
.ec-desc { font-size: 14px; color: #555; line-height: 1.5; }
`;
fs.writeFileSync(stylesFile, styles);
