const fs = require('fs');

const appFile = 'app.js';
let appJs = fs.readFileSync(appFile, 'utf8');

const replacementHtml = `      <div id="tab-charts-positions" class="match-tab-content" style="display:none;">
        <section class="kundali-panel worksheet-panel" style="margin-bottom: 24px;">
          <div class="worksheet-toolbar"><div><p class="panel-kicker">Worksheet</p><h3>Boy / Girl Charts</h3></div></div>
          <div class="case-worksheet-canvas kundali-worksheet-canvas">
            \${chartPairs.map((pair, index) => \`\${renderMatchChartCard(caseId, 'boy', pair.boy, index)}\${renderMatchChartCard(caseId, 'girl', pair.girl, index)}\`).join('')}
          </div>
        </section>
        <section class="kundali-panel dasha-position-panel">
          <div class="dasha-widget-grid admin-match-dashas">
            <div id="match-dasha-boy-\${escapeHtml(caseId)}"></div>
            <div id="match-dasha-girl-\${escapeHtml(caseId)}"></div>
          </div>
        </section>
        <section class="kundali-panel reading-admin-panel" style="margin-top:24px;">
          <div>
            <h3>Admin Actions</h3>
            <div class="admin-fields detail-actions-form">
              <select id="detail-status-\${escapeHtml(caseId)}">\${["pending", "reviewed", "accepted", "scheduled", "in_progress", "completed", "cancelled", "rejected"].map((s) => \`<option value="\${s}" \${s === status ? "selected" : ""}>\${s.replace("_", " ")}</option>\`).join("")}</select>
              <input id="detail-meeting-\${escapeHtml(caseId)}" placeholder="Google Meet / Zoom link" value="\${escapeHtml(item.meeting_link || "")}">
              <input id="detail-schedule-\${escapeHtml(caseId)}" placeholder="Scheduled date/time" value="\${escapeHtml(item.scheduled_at || "")}">
              <input id="detail-assignee-\${escapeHtml(caseId)}" placeholder="Assigned astrologer" value="\${escapeHtml(item.assigned_astrologer || "")}">
              <textarea id="detail-notes-\${escapeHtml(caseId)}" placeholder="Private admin notes">\${escapeHtml(item.admin_notes || "")}</textarea>
            </div>
            <div class="actions"><button class="primary" type="button" onclick="updateCaseDetail('\${escapeHtml(caseId)}')">Save Case Detail</button></div>
          </div>
        </section>
      </div>`;

appJs = appJs.replace('<div class="empty">Charts & Positions Details</div>', replacementHtml);
fs.writeFileSync(appFile, appJs);
