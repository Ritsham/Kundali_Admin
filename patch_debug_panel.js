const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Find the Marriage House section in the template and add a debug inspector before it
const oldMarriageSection = `          <div class="exact-extra-section">
            <h3>Marriage House, Karakas &amp; Navamsa</h3>`;

const newMarriageSection = `          <div class="exact-extra-section">
            <h3>Marriage House, Karakas &amp; Navamsa</h3>
            \${(Object.keys(boySeventh).length === 0 && Object.keys(girlSeventh).length === 0) ? \`
              <div class="debug-inspector">
                <strong>⚠ No seventh_house / karakas / navamsa found in dossier.</strong><br>
                <small>Available dossier keys: <code>\${Object.keys(dossier).join(', ') || '(empty)'}</code></small>
              </div>
            \` : ''}`;

if (appJs.includes(oldMarriageSection)) {
  appJs = appJs.replace(oldMarriageSection, newMarriageSection);
  console.log('✓ Added debug inspector panel');
} else {
  console.log('⚠ Could not find marriage section marker');
}

fs.writeFileSync('app.js', appJs);

let styles = fs.readFileSync('styles.css', 'utf8');
styles += `
.debug-inspector {
  background: #fffde7;
  border: 1px solid #f9a825;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #5d4037;
  line-height: 1.8;
}
.debug-inspector code {
  background: rgba(0,0,0,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
`;
fs.writeFileSync('styles.css', styles);
console.log('Done!');
