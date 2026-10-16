const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

let token = sessionStorage.getItem('orgToken') || null;
let currentEvent = null;

function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = ''), 3200);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch('/api' + path, { ...opts, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) { token = null; sessionStorage.removeItem('orgToken'); renderOrganizer(); }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

/* ---------- Tabs ---------- */
function show(view) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== 'view-' + view));
  if (view === 'events') loadEvents();
  if (view === 'organizer') renderOrganizer();
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));

/* ---------- Events ---------- */
async function loadEvents() {
  const box = $('#events');
  try {
    const events = await api('/events');
    if (!events.length) { box.innerHTML = '<div class="empty">No events yet. Organizers can add one from the Organizer tab.</div>'; return; }
    box.innerHTML = events.map((e) => {
      const full = e.seatsLeft === 0;
      const pct = Math.round((e.confirmedCount / e.capacity) * 100);
      return `<article class="card">
        <h3>${esc(e.title)}</h3>
        <div class="meta"><span>📅 ${fmt(e.eventDateTime)}</span><span>📍 ${esc(e.location)}</span></div>
        <p class="desc">${esc(e.description)}</p>
        <div class="bar-seats"><i style="width:${pct}%"></i></div>
        <div class="seats">${full ? '<span class="badge full">Full</span>' : e.seatsLeft + ' of ' + e.capacity + ' seats left'}</div>
        <p></p>
        <button class="btn" data-reg="${e.id}" data-title="${esc(e.title)}" ${full ? 'disabled' : ''}>${full ? 'Sold out' : 'Register'}</button>
      </article>`;
    }).join('');
  } catch (err) { toast(err.message, true); }
}

$('#events').addEventListener('click', (e) => {
  const b = e.target.closest('[data-reg]');
  if (!b) return;
  currentEvent = b.dataset.reg;
  $('#regTitle').textContent = 'Register for ' + b.dataset.title;
  $('#regForm').reset();
  $('#regDialog').showModal();
});
$('#regCancel').addEventListener('click', () => $('#regDialog').close());
$('#regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    await api('/registrations', { method: 'POST', body: JSON.stringify({ eventId: currentEvent, userName: f.get('userName'), userEmail: f.get('userEmail') }) });
    $('#regDialog').close();
    toast('Registration confirmed!');
    $('#lookupEmail').value = f.get('userEmail');
    loadEvents();
  } catch (err) { toast(err.message, true); }
});

/* ---------- My registrations ---------- */
async function loadMine(email) {
  const box = $('#mine');
  try {
    const regs = await api('/registrations/user/' + encodeURIComponent(email));
    if (!regs.length) { box.innerHTML = '<div class="empty">No registrations found for this email.</div>'; return; }
    box.innerHTML = regs.map((r) => `<div class="item">
      <div><strong>${esc(r.Event ? r.Event.title : 'Event #' + r.EventId)}</strong>
        <div class="meta">${r.Event ? '<span>📅 ' + fmt(r.Event.eventDateTime) + ' · 📍 ' + esc(r.Event.location) + '</span>' : ''}<span>${esc(r.userName)}</span></div></div>
      <div class="row-end" style="align-items:center">
        <span class="badge ${r.status}">${r.status}</span>
        ${r.status === 'CONFIRMED' ? `<button class="btn danger small" data-cancel="${r.id}">Cancel</button>` : ''}
      </div></div>`).join('');
  } catch (err) { toast(err.message, true); }
}
$('#lookup').addEventListener('submit', (e) => { e.preventDefault(); loadMine($('#lookupEmail').value); });
$('#mine').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-cancel]');
  if (!b || !confirm('Cancel this registration?')) return;
  try {
    await api(`/registrations/${b.dataset.cancel}/cancel`, { method: 'PUT', body: JSON.stringify({ userEmail: $('#lookupEmail').value }) });
    toast('Registration cancelled');
    loadMine($('#lookupEmail').value);
  } catch (err) { toast(err.message, true); }
});

/* ---------- Organizer ---------- */
function renderOrganizer() {
  $('#loginBox').hidden = !!token;
  $('#adminBox').hidden = !token;
  if (token) loadAdminEvents();
}
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ password: $('#adminPass').value }) });
    token = r.token; sessionStorage.setItem('orgToken', token);
    $('#adminPass').value = '';
    renderOrganizer();
  } catch (err) { toast(err.message, true); }
});
$('#logout').addEventListener('click', () => { token = null; sessionStorage.removeItem('orgToken'); renderOrganizer(); });

$('#eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  try {
    await api('/events', { method: 'POST', body: JSON.stringify(f) });
    e.target.reset();
    toast('Event created');
    loadAdminEvents();
  } catch (err) { toast(err.message, true); }
});

async function loadAdminEvents() {
  const box = $('#adminEvents');
  try {
    const events = await api('/events');
    box.innerHTML = events.length ? events.map((ev) => `<div class="item">
      <div><strong>${esc(ev.title)}</strong>
        <div class="meta"><span>${fmt(ev.eventDateTime)} · ${esc(ev.location)} · ${ev.confirmedCount}/${ev.capacity} registered</span></div></div>
      <div class="row-end">
        <button class="btn ghost small" data-att="${ev.id}" data-title="${esc(ev.title)}">Attendees</button>
        <button class="btn danger small" data-del="${ev.id}">Delete</button>
      </div></div>`).join('') : '<div class="empty">No events yet.</div>';
  } catch (err) { toast(err.message, true); }
}
$('#adminEvents').addEventListener('click', async (e) => {
  const del = e.target.closest('[data-del]');
  const att = e.target.closest('[data-att]');
  try {
    if (del && confirm('Delete this event and all its registrations?')) {
      await api('/events/' + del.dataset.del, { method: 'DELETE' });
      toast('Event deleted'); loadAdminEvents();
    }
    if (att) {
      const regs = await api('/registrations/event/' + att.dataset.att);
      $('#attTitle').textContent = 'Attendees · ' + att.dataset.title;
      $('#attList').innerHTML = regs.length ? regs.map((r) => `<div class="item"><div><strong>${esc(r.userName)}</strong><div class="meta">${esc(r.userEmail)}</div></div><span class="badge ${r.status}">${r.status}</span></div>`).join('') : '<div class="empty">No registrations yet.</div>';
      $('#attDialog').showModal();
    }
  } catch (err) { toast(err.message, true); }
});
$('#attClose').addEventListener('click', () => $('#attDialog').close());

loadEvents();
