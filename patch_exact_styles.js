const fs = require('fs');
const stylesFile = 'styles.css';
let styles = fs.readFileSync(stylesFile, 'utf8');

styles += `
/* EXACT UI Match */
.exact-match-result {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background: #fdfaf6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.exact-top-section {
  background: #fff;
  padding: 32px 48px 0 48px;
  border-bottom: 1px solid #eaeaea;
}

.exact-back-btn {
  background: #808080;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 32px;
}
.exact-back-btn:hover { background: #666; }

.exact-header-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
}

.exact-header-info { max-width: 60%; }
.exact-label {
  color: #e53935;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.exact-title {
  color: #1b1e6d;
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 8px;
}
.exact-desc {
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.exact-score-circle {
  position: relative;
  width: 110px;
  height: 110px;
}
.exact-circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 250px;
}
.exact-circle-bg {
  fill: none;
  stroke: #f5f5f5;
  stroke-width: 4;
}
.exact-circle {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke: #ff9800;
}
.exact-score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.exact-score-value {
  font-size: 26px;
  font-weight: 700;
  color: #000;
  line-height: 1;
}
.exact-score-max {
  font-size: 13px;
  color: #777;
  margin-top: 2px;
}

.exact-tabs {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
}
.exact-tab-btn {
  background: transparent;
  border: 1px solid #eaeaea;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #1b1e6d;
  cursor: pointer;
  transition: all 0.2s ease;
}
.exact-tab-btn.active {
  background: #fdfaf6;
  border-color: #fdfaf6;
  color: #000;
}

.exact-bottom-section {
  padding: 48px;
  background: #fdfaf6;
}

.exact-participants {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 48px;
}
.exact-pc-card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.exact-pc-title {
  color: #1b1e6d;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 24px;
}
.exact-pc-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 13px;
  color: #333;
}
.exact-pc-row span:first-child {
  color: #666;
}

.exact-koota-section h3 {
  font-size: 18px;
  color: #000;
  font-weight: 600;
  margin-bottom: 24px;
}
.exact-koota-list {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.exact-koota-item {
  display: grid;
  grid-template-columns: 140px 60px 120px 1fr;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
}
.exact-koota-item:last-child {
  border-bottom: none;
}
.ek-name {
  font-weight: 600;
  color: #000;
  font-size: 14px;
}
.ek-score {
  color: #555;
  font-size: 14px;
}
.ek-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-good {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge-concern {
  background: #ffebee;
  color: #c62828;
}
.ek-desc {
  color: #555;
  font-size: 13px;
}
`;
fs.writeFileSync(stylesFile, styles);
