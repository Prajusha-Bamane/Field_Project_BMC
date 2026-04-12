// ── ReUse BMC – Shared Utilities ──

const API = {
  get: (url) => fetch(url, { headers: authHeader() }).then(r => r.json()),
  post: (url, data) => fetch(url, { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  put: (url, data) => fetch(url, { method: 'PUT', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  delete: (url) => fetch(url, { method: 'DELETE', headers: authHeader() }).then(r => r.json()),
  postForm: (url, formData) => fetch(url, { method: 'POST', headers: authHeader(), body: formData }).then(r => r.json()),
  putForm: (url, formData) => fetch(url, { method: 'PUT', headers: authHeader(), body: formData }).then(r => r.json()),
};

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

function requireAuth(role) {
  const user = getUser();
  const token = localStorage.getItem('token');
  if (!user || !token) { window.location.href = '/login'; return null; }
  if (role && user.role !== role) { window.location.href = '/login'; return null; }
  return user;
}

function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  const navItem = document.querySelector(`[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (navItem) navItem.classList.add('active');
}

function statusBadge(status) {
  const map = {
    listed: ['📋 Listed', 'listed'],
    assigned: ['🚗 Assigned', 'assigned'],
    picked: ['📦 Picked', 'picked'],
    submitted: ['📤 Submitted', 'submitted'],
    received: ['✅ Received', 'received'],
    distributed: ['🎁 Distributed', 'distributed'],
    recycled: ['♻️ Recycled', 'recycled'],
  };
  const [label, cls] = map[status] || [status, 'listed'];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
