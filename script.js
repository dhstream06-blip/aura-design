/* ============================================================
   AURA DESIGN — Main JavaScript
   Handles: Auth, Project storage, Gallery rendering,
            Admin dashboard, Client page, Annotation system
   Storage: localStorage + optional public cloud sync (GitHub Gist)
   ============================================================ */

/* ==================== CONSTANTS ==================== */
const ADMIN_CODE = '1040';
const STORAGE_KEY = 'aura_projects';
const CLOUD_CONFIG_KEY = 'aura_cloud_config';

/* ==================== STORAGE HELPERS ==================== */

/** Load all projects from localStorage */
function getProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/** Save projects array to localStorage (and sync to cloud when configured) */
function saveProjects(projects, options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  if (!options.skipCloud) {
    syncProjectsToCloud(projects);
  }
}

/** Load cloud config */
function getCloudConfig() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Save cloud config */
function setCloudConfig(config) {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config || {}));
}

/** Get a single project by its unique ID */
function getProject(id) {
  return getProjects().find((p) => p.id === id) || null;
}

/** Update a project by ID */
function updateProject(id, updates) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...updates };
    saveProjects(projects);
  }
}

/** Generate a unique project ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ==================== PUBLIC CLOUD SYNC (GitHub Gist) ==================== */

/**
 * Optional cloud mode for GitHub Pages:
 * - Admin stores Gist ID + GitHub token locally in browser
 * - Projects are written to a PUBLIC gist file `projects.json`
 * - Any visitor can read those projects by using same gist ID
 */

function getCloudProjectsURL(gistId) {
  return `https://api.github.com/gists/${gistId}`;
}

async function fetchProjectsFromCloud() {
  const config = getCloudConfig();
  if (!config.gistId) return null;

  try {
    const res = await fetch(getCloudProjectsURL(config.gistId), {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Cloud fetch failed (${res.status})`);

    const gist = await res.json();
    const file = gist.files?.['projects.json'];
    if (!file?.content) return [];

    const parsed = JSON.parse(file.content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Cloud fetch error:', err.message);
    return null;
  }
}

async function syncProjectsToCloud(projects) {
  const config = getCloudConfig();
  if (!config.gistId || !config.token) return;

  try {
    const res = await fetch(getCloudProjectsURL(config.gistId), {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'projects.json': {
            content: JSON.stringify(projects, null, 2)
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloud sync failed (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.warn('Cloud sync error:', err.message);
  }
}

async function hydrateFromCloud() {
  const cloudProjects = await fetchProjectsFromCloud();
  if (cloudProjects) {
    saveProjects(cloudProjects, { skipCloud: true });
  }
}

async function saveCloudSettings() {
  const gistId = document.getElementById('gistIdInput')?.value.trim();
  const token = document.getElementById('gistTokenInput')?.value.trim();
  const status = document.getElementById('cloudStatus');

  if (!gistId) {
    if (status) status.textContent = 'Please provide a Gist ID.';
    return;
  }

  setCloudConfig({ gistId, token });
  if (status) status.textContent = 'Cloud settings saved locally.';

  // Pull latest cloud data immediately.
  await hydrateFromCloud();
  renderAdminGrid();
  renderGallery();
}

async function testCloudConnection() {
  const status = document.getElementById('cloudStatus');
  if (status) status.textContent = 'Testing connection...';

  const gistId = document.getElementById('gistIdInput')?.value.trim();
  if (!gistId) {
    if (status) status.textContent = 'Enter a Gist ID first.';
    return;
  }

  try {
    const res = await fetch(getCloudProjectsURL(gistId), {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (status) status.textContent = 'Connection successful. Gist is reachable.';
  } catch (err) {
    if (status) status.textContent = `Connection failed: ${err.message}`;
  }
}

function loadCloudSettingsUI() {
  const gistInput = document.getElementById('gistIdInput');
  const tokenInput = document.getElementById('gistTokenInput');
  if (!gistInput || !tokenInput) return;

  const config = getCloudConfig();
  gistInput.value = config.gistId || '';
  tokenInput.value = config.token || '';
}

/* ==================== HOMEPAGE ==================== */

/** Render the public gallery grid */
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const projects = getProjects().filter((p) => p.published);
  const emptyState = document.getElementById('emptyState');

  // Clear existing cards (keep empty state el)
  Array.from(grid.children).forEach((el) => {
    if (!el.id) el.remove();
  });

  if (projects.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  projects.forEach((project) => {
    const card = createGalleryCard(project);
    grid.appendChild(card);
  });
}

/** Build a gallery project card element */
function createGalleryCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.style.animationDelay = Math.random() * 0.3 + 's';

  const statusLabel = { approved: 'Approved', changes: 'Needs Changes', pending: 'In Review' };
  const thumbHTML = project.fileType === 'image'
    ? `<img src="${project.fileData}" alt="${project.title}" loading="lazy" />`
    : `<div class="card-thumb-pdf">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <span>PDF Document</span>
      </div>`;

  card.innerHTML = `
    <div class="card-thumb">
      ${thumbHTML}
      <div class="card-overlay"></div>
      <div class="card-overlay-actions">
        <a href="client.html?id=${project.id}" class="btn-primary small">View Project</a>
      </div>
    </div>
    <div class="card-body">
      <div class="card-title">${escapeHTML(project.title)}</div>
      <div class="card-meta">
        <span>${escapeHTML(project.clientName || '')}</span>
        <span class="card-status ${project.status}">${statusLabel[project.status] || 'In Review'}</span>
      </div>
    </div>`;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('a')) {
      window.location.href = `client.html?id=${project.id}`;
    }
  });
  return card;
}

/* ==================== ADMIN MODAL (homepage) ==================== */

function openAdminModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.add('open');
  setTimeout(() => document.getElementById('adminPassword')?.focus(), 300);
  document.getElementById('adminPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAdminPassword();
  });
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('open');
  document.getElementById('adminPassword').value = '';
  document.getElementById('modalError').classList.remove('show');
}

function checkAdminPassword() {
  const val = document.getElementById('adminPassword').value;
  if (val === ADMIN_CODE) {
    sessionStorage.setItem('aura_admin', '1');
    window.location.href = 'admin.html';
  } else {
    document.getElementById('modalError').classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

/* ==================== ADMIN PAGE ==================== */

/** Called on admin.html to verify session or show gate */
function checkGatePassword() {
  const val = document.getElementById('gatePassword').value;
  if (val === ADMIN_CODE) {
    sessionStorage.setItem('aura_admin', '1');
    showAdminContent();
  } else {
    const err = document.getElementById('gateError');
    err.classList.add('show');
    document.getElementById('gatePassword').value = '';
    document.getElementById('gatePassword').focus();
  }
}

async function showAdminContent() {
  document.getElementById('passwordGate').style.display = 'none';
  document.getElementById('adminContent').style.display = 'block';
  loadCloudSettingsUI();
  await hydrateFromCloud();
  renderAdminGrid();
}

function adminLogout() {
  sessionStorage.removeItem('aura_admin');
  window.location.href = 'index.html';
}

/* ---- Upload Zone drag & drop ---- */
function setupUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  if (!zone || !fileInput) return;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
  });
}

let selectedFile = null;

function handleFileSelected(file) {
  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    alert('Please upload an image (PNG, JPG, GIF, WebP) or PDF file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('File is too large. Please keep it under 10MB.');
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    // Show preview
    const preview = document.getElementById('filePreview');
    const thumb = document.getElementById('previewThumb');
    document.getElementById('previewName').textContent = file.name;

    if (file.type.startsWith('image/')) {
      thumb.innerHTML = `<img src="${data}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`;
    } else {
      thumb.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border-radius:6px;font-size:11px;color:var(--text-tertiary);letter-spacing:.1em;">PDF</div>';
    }

    document.getElementById('uploadZone').style.display = 'none';
    preview.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function clearFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('uploadZone').style.display = 'block';
  document.getElementById('previewThumb').innerHTML = '';
}

/** Upload / publish a project */
function uploadProject() {
  const title = document.getElementById('projectTitle').value.trim();
  const clientName = document.getElementById('clientName').value.trim();

  if (!title) {
    alert('Please enter a project title.');
    return;
  }
  if (!selectedFile) {
    alert('Please select a file to upload.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const fileData = e.target.result;
    const id = generateId();
    const project = {
      id,
      title,
      clientName,
      fileData,
      fileType: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
      fileName: selectedFile.name,
      status: 'pending',
      published: true,
      createdAt: Date.now(),
      feedback: null,
      annotations: []
    };

    const projects = getProjects();
    projects.unshift(project);
    saveProjects(projects);

    // Show generated link
    const link = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}client.html?id=${id}`;
    document.getElementById('generatedLink').textContent = link;
    document.getElementById('linkResult').style.display = 'block';
    document.getElementById('linkResult').scrollIntoView({ behavior: 'smooth' });

    // Reset form
    document.getElementById('projectTitle').value = '';
    document.getElementById('clientName').value = '';
    clearFile();

    renderAdminGrid();
  };
  reader.readAsDataURL(selectedFile);
}

function copyLink() {
  const link = document.getElementById('generatedLink').textContent;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  });
}

/** Render admin project management grid */
function renderAdminGrid() {
  const grid = document.getElementById('adminGrid');
  if (!grid) return;
  const projects = getProjects();
  const emptyState = document.getElementById('adminEmptyState');

  Array.from(grid.children).forEach((el) => {
    if (!el.id) el.remove();
  });

  if (projects.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  projects.forEach((project) => {
    const card = createAdminCard(project);
    grid.appendChild(card);
  });
}

function createAdminCard(project) {
  const card = document.createElement('div');
  card.className = 'admin-project-card';

  const statusLabel = { approved: 'Approved', changes: 'Needs Changes', pending: 'Pending' };
  const thumbHTML = project.fileType === 'image'
    ? `<img src="${project.fileData}" alt="${project.title}" />`
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:12px;letter-spacing:.1em;">PDF Document</div>';

  const clientLink = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}client.html?id=${project.id}`;
  const annotCount = (project.annotations || []).length;

  card.innerHTML = `
    <div class="admin-card-header">
      <div>
        <div class="admin-card-title">${escapeHTML(project.title)}</div>
        ${project.clientName ? `<div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">${escapeHTML(project.clientName)}</div>` : ''}
      </div>
      <span class="feedback-badge ${project.status}">${statusLabel[project.status]}</span>
    </div>
    <div class="admin-card-thumb">${thumbHTML}</div>
    ${annotCount > 0 ? `<div class="annotation-count">${annotCount} annotation${annotCount !== 1 ? 's' : ''} from client</div>` : ''}
    ${project.feedback ? `<div style="font-size:12px;color:var(--text-tertiary);margin:8px 0;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--glass-border)">Client note: ${escapeHTML(project.feedback)}</div>` : ''}
    <div class="admin-card-actions" style="margin-top:12px">
      <button class="btn-sm-link" onclick="copyProjectLink('${clientLink}', this)">Copy Link</button>
      <a href="client.html?id=${project.id}" class="btn-sm-link">Preview</a>
      <button class="btn-danger small" onclick="openDeleteModal('${project.id}')">Delete</button>
    </div>`;

  return card;
}

function copyProjectLink(link, btn) {
  navigator.clipboard.writeText(link).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy Link';
    }, 2000);
  });
}

/* ---- Delete Modal ---- */
let pendingDeleteId = null;

function openDeleteModal(id) {
  pendingDeleteId = id;
  const modal = document.getElementById('deleteModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);
}

function closeDeleteModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  const projects = getProjects().filter((p) => p.id !== pendingDeleteId);
  saveProjects(projects);
  closeDeleteModal();
  renderAdminGrid();
}

/* ==================== CLIENT PAGE ==================== */

let currentProjectId = null;
let pendingAnnotation = null;
let activeMarkerIdx = null;

function initClientPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showNotFound();
    return;
  }

  const project = getProject(id);
  if (!project) {
    showNotFound();
    return;
  }

  currentProjectId = id;
  document.title = `${project.title} — Aura Design`;

  // Set status badge
  const badge = document.getElementById('statusBadge');
  if (badge) {
    const labels = { approved: 'Approved', changes: 'Needs Changes', pending: 'Awaiting Review' };
    badge.className = `nav-badge ${project.status}`;
    badge.textContent = labels[project.status] || 'Awaiting Review';
  }

  // Set title
  document.getElementById('clientTitle').textContent = project.title;

  // Render design media
  const mediaEl = document.getElementById('designMedia');
  if (project.fileType === 'image') {
    const img = document.createElement('img');
    img.src = project.fileData;
    img.alt = project.title;
    img.style.cssText = 'width:100%;display:block;border:none;';
    mediaEl.appendChild(img);
  } else {
    const embed = document.createElement('embed');
    embed.src = project.fileData;
    embed.type = 'application/pdf';
    embed.style.cssText = 'width:100%;height:80vh;display:block;border:none;';
    mediaEl.appendChild(embed);
  }

  // Download button
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = project.fileData;
      a.download = project.fileName || project.title;
      a.click();
    });
  }

  // Show content
  document.getElementById('clientContent').style.display = 'block';

  // If feedback already submitted, show it
  if (project.status !== 'pending') {
    const submitSection = document.getElementById('feedbackSubmitted');
    const labels = { approved: 'You approved this design.', changes: 'You requested changes on this design.' };
    submitSection.querySelector('#submittedText').textContent = labels[project.status] || '';
    submitSection.style.display = 'flex';
    document.getElementById('approveBtn').disabled = true;
    document.getElementById('changesBtn').disabled = true;
    document.getElementById('approveBtn').style.opacity = '0.4';
    document.getElementById('changesBtn').style.opacity = '0.4';
  }

  setupAnnotationCanvas();
  renderAnnotations();
}

function showNotFound() {
  document.getElementById('notFound').style.display = 'flex';
}

/* ==================== ANNOTATION SYSTEM ==================== */

/**
 * Annotation logic:
 * - User clicks on the design canvas → records x%/y% position (relative)
 * - A comment popup appears → user writes note → saved to project.annotations[]
 * - Each annotation is stored as: { id, x, y, comment, createdAt }
 * - Markers are rendered as positioned dots on the markers-layer div
 * - Clicking a marker shows the comment in a detail panel
 * - All annotations stored in localStorage + optional cloud sync
 */

function setupAnnotationCanvas() {
  const canvas = document.getElementById('designCanvas');
  const toggle = document.getElementById('annotationToggle');
  if (!canvas) return;

  canvas.addEventListener('click', (e) => {
    if (!toggle.checked) return;

    // Ignore clicks on markers
    if (e.target.closest('.annotation-marker')) return;

    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    pendingAnnotation = { x: xPct, y: yPct };
    document.getElementById('commentText').value = '';
    document.getElementById('commentPopup').style.display = 'flex';
    setTimeout(() => document.getElementById('commentText').focus(), 100);
  });

  toggle.addEventListener('change', () => {
    canvas.classList.toggle('no-annotate', !toggle.checked);
  });
}

function saveAnnotation() {
  const comment = document.getElementById('commentText').value.trim();
  if (!comment) {
    alert('Please write a comment before saving.');
    return;
  }
  if (!pendingAnnotation) return;

  const project = getProject(currentProjectId);
  if (!project) return;

  const annotation = {
    id: generateId(),
    x: pendingAnnotation.x,
    y: pendingAnnotation.y,
    comment,
    createdAt: Date.now()
  };

  const annotations = project.annotations || [];
  annotations.push(annotation);
  updateProject(currentProjectId, { annotations });

  closeCommentPopup();
  renderAnnotations();
}

function closeCommentPopup() {
  document.getElementById('commentPopup').style.display = 'none';
  pendingAnnotation = null;
}

function renderAnnotations() {
  const layer = document.getElementById('markersLayer');
  if (!layer) return;
  layer.innerHTML = '';

  const project = getProject(currentProjectId);
  if (!project) return;

  const annotations = project.annotations || [];
  updateMarkerCount(annotations.length);

  annotations.forEach((ann, idx) => {
    const marker = document.createElement('div');
    marker.className = 'annotation-marker';
    marker.style.left = `${ann.x}%`;
    marker.style.top = `${ann.y}%`;
    marker.innerHTML = `<div class="marker-dot">${idx + 1}</div>`;
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      showMarkerDetail(ann, idx);
    });
    layer.appendChild(marker);
  });
}

function showMarkerDetail(annotation, idx) {
  activeMarkerIdx = idx;
  document.getElementById('detailNum').textContent = `Note #${idx + 1}`;
  document.getElementById('detailComment').textContent = annotation.comment;
  document.getElementById('markerDetail').style.display = 'block';
}

function closeMarkerDetail() {
  document.getElementById('markerDetail').style.display = 'none';
  activeMarkerIdx = null;
}

function deleteAnnotation() {
  if (activeMarkerIdx === null) return;
  const project = getProject(currentProjectId);
  const annotations = (project.annotations || []).filter((_, i) => i !== activeMarkerIdx);
  updateProject(currentProjectId, { annotations });
  closeMarkerDetail();
  renderAnnotations();
}

function clearAnnotations() {
  if (!confirm('Remove all annotations?')) return;
  updateProject(currentProjectId, { annotations: [] });
  renderAnnotations();
  closeMarkerDetail();
}

function updateMarkerCount(count) {
  const el = document.getElementById('markerCount');
  if (el) el.textContent = `${count} annotation${count !== 1 ? 's' : ''}`;
}

/* ==================== FEEDBACK SUBMISSION ==================== */

function submitDecision(decision) {
  const clientName = document.getElementById('clientNameInput')?.value.trim() || '';
  const project = getProject(currentProjectId);
  if (!project) return;

  updateProject(currentProjectId, {
    status: decision,
    feedback: clientName ? `Submitted by ${clientName}` : null,
    submittedAt: Date.now()
  });

  // Update status badge
  const badge = document.getElementById('statusBadge');
  if (badge) {
    badge.className = `nav-badge ${decision}`;
    badge.textContent = decision === 'approved' ? 'Approved' : 'Needs Changes';
  }

  const labels = {
    approved: 'Thank you — your approval has been recorded. We will proceed with the final deliverables.',
    changes: 'Feedback received. Review all annotation notes above — our team will be in touch shortly.'
  };
  document.getElementById('submittedText').textContent = labels[decision];
  document.getElementById('feedbackSubmitted').style.display = 'flex';
  document.getElementById('approveBtn').disabled = true;
  document.getElementById('changesBtn').disabled = true;
  document.getElementById('approveBtn').style.opacity = '0.4';
  document.getElementById('changesBtn').style.opacity = '0.4';
}

/* ==================== UTILS ==================== */

/** Escape HTML to prevent XSS */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==================== PAGE INIT ==================== */

window.addEventListener('DOMContentLoaded', async () => {
  await hydrateFromCloud();

  // Homepage
  if (document.getElementById('galleryGrid')) {
    renderGallery();
  }

  // Admin page
  if (document.getElementById('adminContent')) {
    loadCloudSettingsUI();
  }

  // Client page: setup done inline via <script> in client.html
});
