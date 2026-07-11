const fs = require('fs');

const appFile = 'app.js';
let appJs = fs.readFileSync(appFile, 'utf8');

const target = `  const dossier = report?.dossier || {};`;
const replacement = `  const dossier = report?.dossier || {};
  const mandatory = dossier.charts_to_send?.mandatory || [];
  const chartPairs = [
    { boy: mandatory[0], girl: mandatory[1] },
    { boy: mandatory[2], girl: mandatory[3] },
    { boy: mandatory[4], girl: mandatory[5] },
    { boy: mandatory[6], girl: mandatory[7] },
  ];`;

appJs = appJs.replace(target, replacement);
fs.writeFileSync(appFile, appJs);
