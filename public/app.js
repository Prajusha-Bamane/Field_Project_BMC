// Toast notifications
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type]||''}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// Auth helpers
function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }

// API fetch wrapper
async function api(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (res.status === 401) { logout(); return null; }
  return { ok: res.ok, status: res.status, data };
}

// Format date
function fmtDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// Category emoji
const CAT_EMOJI = { clothes:'👕', books:'📚', utensils:'🍽️', toys:'🧸', appliances:'📱', other:'📦' };
const COND_LABEL = { good:'✅ Good', used:'🔄 Used', worn:'⚠️ Worn' };
const STATUS_CLASS = { listed:'badge-listed', assigned:'badge-assigned', picked:'badge-picked', distributed:'badge-distributed' };
const STATUS_LABEL = { listed:'📋 Listed', assigned:'🚗 Assigned', picked:'📦 Picked', distributed:'✅ Distributed' };

function statusBadge(status) {
  return `<span class="badge ${STATUS_CLASS[status]||''}">${STATUS_LABEL[status]||status}</span>`;
}

// Check auth on protected pages
function requireAuth(role) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) { window.location.href = '/login'; return false; }
  if (role && user.role !== role) {
    if (user.role === 'donor') window.location.href = '/donor';
    else if (user.role === 'ngo') window.location.href = '/ngo';
    else window.location.href = '/admin';
    return false;
  }
  return true;
}

// Show loading skeleton
function skeleton() {
  return `<div style="margin-bottom:10px;"><div class="skeleton" style="height:16px; width:70%; margin-bottom:8px;"></div><div class="skeleton" style="height:12px; width:50%;"></div></div>`;
}
