// ============================================================
// Dashboard shell — Step 1
// Mobile menu, facility switcher, profile menu, notifications bell.
// Widget bodies (stock table, timeline, notifications, ledger reader)
// are wired up in their own steps — this file only owns the shell chrome.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('dash-nav-toggle');
  const mobilePanel = document.getElementById('dash-mobile-panel');

  const facilityBtn = document.getElementById('facility-switcher-btn');
  const facilityMenu = document.getElementById('facility-switcher-menu');
  const facilityBtnMobile = document.getElementById('facility-switcher-btn-mobile');
  const facilityMenuMobile = document.getElementById('facility-switcher-menu-mobile');

  const profileBtn = document.getElementById('dash-profile-btn');
  const profileMenu = document.getElementById('dash-profile-menu');

  const notifBtn = document.getElementById('notif-bell-btn');
  const logBloodBtnRef = document.getElementById('log-blood-btn');
  const logBloodMenuRef = document.getElementById('log-blood-menu');

  // Close every open dropdown/panel except the one passed in
  function closeAllExcept(keep) {
    [
      [navToggle, mobilePanel],
      [facilityBtn, facilityMenu],
      [facilityBtnMobile, facilityMenuMobile],
      [profileBtn, profileMenu],
      [logBloodBtnRef, logBloodMenuRef],
    ].forEach(([btn, menu]) => {
      if (!btn || !menu || btn === keep) return;
      menu.classList.remove('is-open');
      if (btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-active');
    });
  }

  function toggleMenu(btn, menu) {
    if (!btn || !menu) return;
    const isOpen = menu.classList.contains('is-open');
    closeAllExcept(btn);
    menu.classList.toggle('is-open', !isOpen);
    if (btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', String(!isOpen));
    btn.classList.toggle('is-active', !isOpen);
  }

  navToggle?.addEventListener('click', () => toggleMenu(navToggle, mobilePanel));
  facilityBtn?.addEventListener('click', () => toggleMenu(facilityBtn, facilityMenu));
  facilityBtnMobile?.addEventListener('click', () => toggleMenu(facilityBtnMobile, facilityMenuMobile));
  profileBtn?.addEventListener('click', () => toggleMenu(profileBtn, profileMenu));

  // Bell scrolls the notifications card into view (no dropdown of its own yet)
  notifBtn?.addEventListener('click', () => {
    document.getElementById('log-blood-btn')?.closest('.dash-card')?.previousElementSibling; // no-op guard
    document.querySelector('.notif-tabs')?.closest('.dash-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Activity timeline — click/hover a node to preview that entry (mock data for now)
  const nodeCard = document.getElementById('activity-node-card');
  const nodeData = {
    0: { type: 'in',  group: 'O+',  delta: '+18 units', source: 'Manual Entry',     meta: '6 days ago · logged by Dr. Ahmad' },
    1: { type: 'out', group: 'O−',  delta: '−6 units',  source: 'Manual Entry',     meta: '4 days ago · logged by Dr. Ahmad · crossed into Critical' },
    2: { type: 'in',  group: 'A+',  delta: '+9 units',  source: 'AI Ledger Reader', meta: '3 days ago · confirmed by Dr. Ahmad' },
    3: { type: 'out', group: 'A−',  delta: '−4 units',  source: 'Manual Entry',     meta: '2 days ago · logged by Dr. Ahmad · crossed into Low' },
    4: { type: 'in',  group: 'AB+', delta: '+5 units',  source: 'AI Ledger Reader', meta: 'Yesterday · confirmed by Dr. Ahmad' },
    5: { type: 'in',  group: 'B−',  delta: '+12 units', source: 'AI Ledger Reader', meta: 'Today · confirmed by Dr. Ahmad' },
  };
  function addTimelineNode(type, group, delta, source) {
    const track = document.querySelector('.activity-timeline__track');
    if (!track) return;
    const nodes = track.querySelectorAll('.activity-node');
    const i = nodes.length;
    nodeData[i] = { type, group, delta, source, meta: 'Just now · logged by Dr. Ahmad' };
    const node = document.createElement('span');
    node.className = 'activity-node';
    node.dataset.type = type;
    node.style.left = '97%';
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `Just now, ${group} ${delta}`);
    const tip = document.createElement('span');
    tip.className = 'activity-node__tooltip';
    tip.textContent = source;
    node.appendChild(tip);
    wireTimelineNode(node, i);
    track.appendChild(node);
  }
  function wireTimelineNode(node, i) {
    const show = () => {
      if (!nodeCard) return;
      const d = nodeData[i];
      nodeCard.dataset.type = d.type;
      nodeCard.querySelector('.activity-node__group').textContent = d.group;
      nodeCard.querySelector('.activity-node__delta').textContent = d.delta;
      nodeCard.querySelector('.activity-node__source-badge').textContent = d.source;
      nodeCard.querySelector('.activity-node__meta').textContent = d.meta;
      nodeCard.classList.add('is-visible');
    };
    node.addEventListener('click', show);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  }
  document.querySelectorAll('.activity-node').forEach((node, i) => wireTimelineNode(node, i));

  // Notifications tabs (Live Requests / History) — unchanged
  function setupTabs(tabSelector, panelSelector, tabAttr, panelAttr) {
    document.querySelectorAll(tabSelector).forEach((tab) => {
      tab.addEventListener('click', () => {
        const group = tab.closest('.dash-card');
        group.querySelectorAll(tabSelector).forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        const target = tab.getAttribute(tabAttr);
        group.querySelectorAll(panelSelector).forEach((p) => {
          p.classList.toggle('is-active', p.getAttribute(panelAttr) === target);
        });
      });
    });
  }
  setupTabs('[data-tab]', '[data-panel]', 'data-tab', 'data-panel');

  // ---- Log Blood menu ----
  const logBloodBtn = document.getElementById('log-blood-btn');
  const logBloodMenu = document.getElementById('log-blood-menu');
  logBloodBtn?.addEventListener('click', () => toggleMenu(logBloodBtn, logBloodMenu));

  const stockTable = document.getElementById('stock-table');
  const saveBar = document.getElementById('stock-savebar');
  const saveCount = document.getElementById('stock-savebar-count');

  function updatePendingCount() {
    const changed = stockTable.querySelectorAll('.stock-row.is-changed').length;
    saveCount.textContent = String(changed);
    saveBar.classList.toggle('is-active', changed > 0 || stockTable.classList.contains('is-editing'));
  }

  function enterEditMode() {
    closeAllExcept(null);
    stockTable.classList.add('is-editing');
    saveBar.classList.add('is-active');
    updatePendingCount();
  }

  function exitEditMode() {
    stockTable.classList.remove('is-editing');
    saveBar.classList.remove('is-active');
    // reset any unsaved edits back to their original values
    stockTable.querySelectorAll('.stock-row').forEach((row) => {
      const original = row.dataset.value;
      row.querySelector('.stock-row__input').value = original;
      row.classList.remove('is-changed');
    });
  }

  document.getElementById('log-blood-manual-btn')?.addEventListener('click', () => {
    logBloodMenu.classList.remove('is-open');
    enterEditMode();
  });

  document.getElementById('log-blood-ai-btn')?.addEventListener('click', () => {
    logBloodMenu.classList.remove('is-open');
    openLedgerSlideover();
  });

  document.getElementById('stock-cancel-btn')?.addEventListener('click', exitEditMode);

  document.getElementById('stock-save-btn')?.addEventListener('click', () => {
    stockTable.querySelectorAll('.stock-row.is-changed').forEach((row) => {
      const label = row.querySelector('.stock-row__label').textContent;
      const oldVal = Number(row.dataset.value);
      const input = row.querySelector('.stock-row__input');
      const newVal = Number(input.value);
      const delta = newVal - oldVal;
      if (delta === 0) return;

      // update row's live values
      row.dataset.value = String(newVal);
      row.querySelector('.stock-row__qty').firstChild.textContent = `${newVal} `;
      row.classList.remove('is-changed');

      // log to timeline
      const deltaText = `${delta > 0 ? '+' : ''}${delta} units`;
      addTimelineNode(delta > 0 ? 'in' : 'out', label, deltaText, 'Manual Entry');
    });
    exitEditMode();
  });

  // Per-row live editing: track changes as staff adjust individual rows
  stockTable?.addEventListener('input', (e) => {
    if (!e.target.classList.contains('stock-row__input')) return;
    const row = e.target.closest('.stock-row');
    const isChanged = Number(e.target.value) !== Number(row.dataset.value);
    row.classList.toggle('is-changed', isChanged);
    updatePendingCount();
  });

  stockTable?.addEventListener('click', (e) => {
    const stepBtn = e.target.closest('.stock-row__step');
    if (!stepBtn) return;
    const row = stepBtn.closest('.stock-row');
    const input = row.querySelector('.stock-row__input');
    const dir = Number(stepBtn.dataset.step);
    input.value = Math.max(0, Number(input.value) + dir);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // ---- AI Ledger Reader slide-over ----
  const ledgerOverlay = document.getElementById('ledger-overlay');
  const ledgerSlideover = document.getElementById('ledger-slideover');
  const ledgerUpload = document.getElementById('ledger-upload');
  const ledgerReview = document.getElementById('ledger-review');

  function openLedgerSlideover() {
    ledgerOverlay.classList.add('is-open');
    ledgerSlideover.classList.add('is-open');
    ledgerSlideover.setAttribute('aria-hidden', 'false');
  }
  function closeLedgerSlideover() {
    ledgerOverlay.classList.remove('is-open');
    ledgerSlideover.classList.remove('is-open');
    ledgerSlideover.setAttribute('aria-hidden', 'true');
    ledgerUpload.style.display = 'flex';
    ledgerReview.classList.remove('is-active');
  }
  document.getElementById('ledger-close-btn')?.addEventListener('click', closeLedgerSlideover);
  ledgerOverlay?.addEventListener('click', closeLedgerSlideover);

  document.getElementById('ledger-upload-btn')?.addEventListener('click', () => {
    ledgerUpload.style.display = 'none';
    ledgerReview.classList.add('is-active');
  });
  document.getElementById('ledger-retake-btn')?.addEventListener('click', () => {
    ledgerReview.classList.remove('is-active');
    ledgerUpload.style.display = 'flex';
  });

  // Stock table — each row expands to show its last-updated detail (view mode only).
  // Full per-batch history view is a later addition; this is the lightweight version.
  document.querySelectorAll('.stock-row__main').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (stockTable.classList.contains('is-editing')) return;
      const row = btn.closest('.stock-row');
      const isOpen = row.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Click outside any open menu closes it (but not the Log Blood menu while editing is active)
  document.addEventListener('click', (e) => {
    const isInsideHeader = e.target.closest('.dash-header');
    const isInsideLogBlood = e.target.closest('.log-blood-wrap');
    if (!isInsideHeader && !isInsideLogBlood) closeAllExcept(null);
  });

  // Escape closes everything, including the slide-over
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllExcept(null);
      if (ledgerSlideover.classList.contains('is-open')) closeLedgerSlideover();
    }
  });
});
